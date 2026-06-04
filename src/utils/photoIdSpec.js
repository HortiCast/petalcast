// ─────────────────────────────────────────────
// PetalCast — Photo ID Component Spec
// ─────────────────────────────────────────────
// This file describes how the photo ID UI works.
// The actual component will be built in:
// src/components/plants/AreaPhotoId.jsx

/*

FLOW
────

1. USER TAKES OR UPLOADS A PHOTO
   - Camera button opens device camera (mobile)
   - Or file picker for existing photo
   - Photo previewed before sending

2. AREA CONTEXT (optional but helpful)
   - "What area is this?"
   - Tap to select from their spaces — Back garden upper, Front garden etc
   - Sets the space context for all plants found

3. IDENTIFICATION RUNS
   - Single API call with batched prompt
   - Loading state: "Looking at your garden..."
   - Cost: one image call regardless of plant count

4. RESULTS SCREEN — three tiers shown clearly

   ✓ PRETTY SURE (high confidence >= 0.85)
   ─────────────────────────────────────
   Pre-ticked. Shown first.
   [ ✓ Lavender · Lavandula angustifolia ]  [×]
   [ ✓ Hardy Geranium · Geranium Rozanne ] [×]

   ? TAKE A LOOK (medium confidence 0.60–0.84)
   ────────────────────────────────────────────
   Shown with alternatives. User picks or searches.
   [ Rosa (Shrub) — is this right? ]
     → Yes, that's it
     → Actually it's: [ Rosa (Climbing) ] [ Rosa (Rambler) ]
     → Search instead

   ✗ NOT SURE (low confidence < 0.60)
   ────────────────────────────────────
   Shown last. Flagged clearly. Falls back to search.
   [ Couldn't identify this one — search by name ]

5. CONFIRMATION
   "Adding 4 plants to Back garden — upper level"
   [ Add these to my garden → ]

   All accepted plants added to the selected space
   in one operation. Stage defaults to "established"
   but user can change per plant before confirming.

6. TAKE ANOTHER PHOTO
   After confirming, prompt: "Got another area to add?"
   Keeps momentum for users adding a full garden.

────────────────────────────────────────────────

COST CONTROL
────────────

- One API call per photo, not per plant
- Recommend max image size before sending (resize to 1200px max)
  to reduce token count without losing identification quality
- Free tier: 10 photo ID sessions total
- Premium: unlimited
- Track usage in garden state: garden.photoIdCount

IMAGE RESIZING
────────────────
Before sending to API, resize image client-side:
- Max dimension: 1200px
- Quality: 0.85 JPEG
- This reduces token cost by ~60% vs full resolution
- Use canvas to resize in browser, no server needed

────────────────────────────────────────────────

COMPONENT PROPS
────────────────

<AreaPhotoId
  spaces={garden.spaces}           — for space selector
  plantDb={PLANT_DB}               — for matching
  onComplete={(spaceId, plants) => void}  — called with accepted plants
  onCancel={() => void}
  photoIdCount={garden.photoIdCount}      — for free tier limit check
/>

*/

export const PHOTO_ID_FREE_LIMIT = 10;

// Resize image before sending to reduce token cost
export async function resizeImageForApi(file, maxDimension = 1200, quality = 0.85) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height / width) * maxDimension);
          width = maxDimension;
        } else {
          width = Math.round((width / height) * maxDimension);
          height = maxDimension;
        }
      }

      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          resolve(blob);
        },
        "image/jpeg",
        quality
      );
    };

    img.src = url;
  });
}
Done

Copy all of that, paste into GitHub, commit.

That's the last one — tell me when it's done and we'll check the ful
