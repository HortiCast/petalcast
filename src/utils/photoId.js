// ─────────────────────────────────────────────
// PetalCast — Photo Plant Identification
// ─────────────────────────────────────────────
// Batched area-based identification.
// One API call per photo regardless of plant count.
// Returns confidence-tiered results for user confirmation.

// Confidence tiers
// high   (>= 0.85) — pre-ticked, ready to add
// medium (>= 0.60) — shown with alternatives to pick from
// low    (<  0.60) — flagged, falls back to text search

export const CONFIDENCE = {
  HIGH:   0.85,
  MEDIUM: 0.60,
};

// Convert image file to base64 for API
export async function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

// ── Main identification call ──────────────────
// Takes one photo and returns all plants found.
// Matches against the 241-plant database first,
// falls back to broader identification if no match.
//
// Returns array of IdentifiedPlant objects.

export async function identifyPlantsInPhoto(imageBase64, mediaType, plantDb) {
  // Build a compact plant list for the prompt
  // Sending full database would be too many tokens
  // Instead send id + common name + latin name only
  const plantList = plantDb
    .map(p => `${p.id}|${p.common_name}|${p.latin_name}`)
    .join("\n");

  const prompt = `You are a plant identification expert. Analyse this garden photo carefully.

Identify every plant you can see. For each plant:
1. First try to match it against this database of 241 garden plants (format: id|common_name|latin_name):
${plantList}

2. If you find a match, use that plant's id and name exactly.
3. If no match, identify it as best you can with common and latin name, and set matched to false.

For each plant return:
- plantId: the database id if matched, null if not
- commonName: the plant's common name
- latinName: the latin name
- confidence: a number 0-1 indicating how certain you are of the identification
- matched: true if found in database, false if not
- location: brief description of where in the image (e.g. "left foreground", "centre back")
- alternatives: if confidence < 0.85, array of up to 2 other possible matches from the database with their ids and names

Be honest about confidence. It is better to flag uncertainty than to guess wrongly.
A flowering plant in good light should score higher than a plant not in flower or partially hidden.

Respond ONLY with a JSON array. No preamble, no markdown, no explanation.
Example: [{"plantId":"lavender","commonName":"Lavender","latinName":"Lavandula angustifolia","confidence":0.92,"matched":true,"location":"left foreground","alternatives":[]}]`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType || "image/jpeg",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    }),
  });

  const data = await response.json();
  const text = data.content?.map(i => i.text || "").join("") || "[]";
  const clean = text.replace(/```json|```/g, "").trim();

  try {
    const results = JSON.parse(clean);
    return results.map(r => ({
      ...r,
      tier: r.confidence >= CONFIDENCE.HIGH
        ? "high"
        : r.confidence >= CONFIDENCE.MEDIUM
        ? "medium"
        : "low",
    }));
  } catch {
    return [];
  }
}

// ── Confirmation state helpers ────────────────
// Manages which identified plants the user has
// accepted, rejected or needs to resolve.

export function buildConfirmationState(identifiedPlants) {
  return identifiedPlants.map(plant => ({
    ...plant,
    // High confidence = pre-accepted
    // Medium/low = pending user decision
    accepted: plant.tier === "high",
    rejected: false,
    // If medium confidence, which alternative did they pick (if any)
    chosenAlternative: null,
  }));
}

export function acceptPlant(state, index) {
  return state.map((p, i) => i === index ? { ...p, accepted: true, rejected: false } : p);
}

export function rejectPlant(state, index) {
  return state.map((p, i) => i === index ? { ...p, accepted: false, rejected: true } : p);
}

export function chooseAlternative(state, index, alternative) {
  return state.map((p, i) =>
    i === index
      ? { ...p, accepted: true, rejected: false, chosenAlternative: alternative, plantId: alternative.plantId, commonName: alternative.commonName }
      : p
  );
}

// Plants the user has accepted — ready to add to space
export function getAcceptedPlants(state) {
  return state.filter(p => p.accepted && !p.rejected);
}

// Plants still needing a decision
export function getPendingPlants(state) {
  return state.filter(p => !p.accepted && !p.rejected);
}
Done
