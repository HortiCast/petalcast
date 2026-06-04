// ─────────────────────────────────────────────
// PetalCast — Onboarding Questions
// ─────────────────────────────────────────────
// The 11 questions, their options, and optional
// "tell us more" expansion prompts.

export const ONBOARDING_QUESTIONS = [
  {
    id: "postcode",
    question: "What's your postcode?",
    type: "text",
    placeholder: "e.g. M1 1AB",
    hint: "Used to fetch your local weather. Nothing is stored elsewhere.",
    tellUsMore: null,
  },
  {
    id: "aspect",
    question: "Which direction does your garden roughly face?",
    type: "options",
    options: [
      { value: "N",  label: "North" },
      { value: "NE", label: "North-East" },
      { value: "E",  label: "East" },
      { value: "SE", label: "South-East" },
      { value: "S",  label: "South" },
      { value: "SW", label: "South-West" },
      { value: "W",  label: "West" },
      { value: "NW", label: "North-West" },
      { value: "?",  label: "Not sure" },
    ],
    tellUsMore: "Tell us more about your aspect or orientation",
  },
  {
    id: "skyExposure",
    question: "Is it open to the sky, or enclosed by walls, fences or buildings?",
    type: "options",
    options: [
      { value: "open",     label: "Open" },
      { value: "enclosed", label: "Enclosed" },
      { value: "mixed",    label: "Mix of both" },
    ],
    tellUsMore: "Describe your boundaries — e.g. high fence on north side, open to south",
  },
  {
    id: "sunMovement",
    question: "Does sun move across the garden during the day, or is it mostly consistent?",
    type: "options",
    options: [
      { value: "moves",      label: "Moves across it" },
      { value: "consistent", label: "Mostly consistent" },
      { value: "partial",    label: "Only reaches part of it" },
    ],
    tellUsMore: "Tell us more — e.g. sunny from midday, shaded in the morning",
  },
  {
    id: "hasZones",
    question: "Do you have distinct areas — like beds, pots, a patio, climbers on walls?",
    type: "options",
    options: [
      { value: "yes", label: "Yes, a few different areas" },
      { value: "no",  label: "No, it's fairly uniform" },
    ],
    tellUsMore: "Describe your areas — we'll help you set them up as separate spaces",
  },
  {
    id: "isRaised",
    question: "Are any areas raised or at a different level to others?",
    type: "options",
    options: [
      { value: "yes",      label: "Yes" },
      { value: "no",       label: "No" },
      { value: "splitLevel", label: "The whole garden is split level" },
    ],
    tellUsMore: "Tell us about the levels — raised beds, terracing, steps between areas",
  },
  {
    id: "hasShelter",
    question: "Do any walls or fences create sheltered spots?",
    type: "options",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no",  label: "No" },
    ],
    tellUsMore: "Describe where — e.g. south-facing wall, sheltered corner",
  },
  {
    id: "drainage",
    question: "After heavy rain, does your garden drain quickly or stay wet for a while?",
    type: "options",
    options: [
      { value: "fast",        label: "Drains quickly" },
      { value: "moderate",    label: "Takes a few hours" },
      { value: "slow",        label: "Stays wet for a day or more" },
      { value: "varies",      label: "Varies by area" },
    ],
    tellUsMore: null,
  },
  {
    id: "soilType",
    question: "What does your soil look and feel like?",
    type: "options",
    options: [
      { value: "loam",   label: "Dark and crumbly — holds moisture well" },
      { value: "clay",   label: "Heavy and sticky when wet, hard when dry" },
      { value: "sandy",  label: "Light and gritty — drains very quickly" },
      { value: "chalk",  label: "Pale and stony — often over chalk or limestone" },
      { value: "peat",   label: "Dark and spongy — common in moorland areas" },
      { value: "?",      label: "Not sure" },
    ],
    tellUsMore: null,
  },
  {
    id: "plantCount",
    question: "How many plants are you looking after roughly?",
    type: "options",
    options: [
      { value: "handful", label: "A handful — under 10" },
      { value: "border",  label: "A border's worth — 10 to 30" },
      { value: "full",    label: "A full garden — 30 or more" },
    ],
    tellUsMore: null,
  },
  {
    id: "nudgeFrequency",
    question: "How often do you want to be nudged?",
    type: "options",
    options: [
      { value: "daily",   label: "Daily — keep me on top of it" },
      { value: "few",     label: "A few times a week" },
      { value: "urgent",  label: "Only when it's urgent" },
    ],
    tellUsMore: null,
  },
];

// Map drainage answer to soil drainage flag
export function drainageToSoilHint(drainage) {
  const map = {
    fast:     "sandy",
    moderate: "loam",
    slow:     "clay",
    varies:   null,
  };
  return map[drainage] || null;
}

// Map onboarding answers to initial space suggestions
export function suggestInitialSpaces(answers) {
  const spaces = [];

  if (answers.hasZones === "yes" || answers.isRaised !== "no") {
    // Suggest separate spaces based on what they told us
    if (answers.isRaised === "yes" || answers.isRaised === "splitLevel") {
      spaces.push({ name: "Back garden — upper level", type: "raised_bed" });
      spaces.push({ name: "Back garden — lower level", type: "mixed" });
    } else {
      spaces.push({ name: "Back garden", type: "mixed" });
    }
  } else {
    spaces.push({ name: "My garden", type: "mixed" });
  }

  return spaces;
}
