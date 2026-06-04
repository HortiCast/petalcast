// ─────────────────────────────────────────────
// PetalCast — Brand & Styles
// ─────────────────────────────────────────────

export const BRAND = {
  // Primary palette
  petalRose:    "#C0527A",
  freshLeaf:    "#5C9E6A",
  morningSky:   "#5B9EC9",
  sunshine:     "#E8A52A",
  petalBlush:   "#FAF0F4",
  warmWhite:    "#FEFBF6",
  forestAnchor: "#1E3A2F",
  lichenGreen:  "#4A7C59",
  warmSoil:     "#7A5C3E",
  morningMist:  "#E8EDE5",
  seedCatalogue:"#F5F0E8",
};

// Seasonal hero colours
export function getSeasonalHero() {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5)  return { color: BRAND.petalRose,    season: "Spring" };
  if (m >= 6 && m <= 8)  return { color: BRAND.sunshine,     season: "Summer" };
  if (m >= 9 && m <= 11) return { color: BRAND.warmSoil,     season: "Autumn" };
  return                        { color: BRAND.forestAnchor, season: "Winter" };
}

// Alert border colours — brand spec
export const ALERT_COLOURS = {
  frost:    { border: "#2B5A8A", background: "#EEF4FA" },
  watering: { border: "#1A6E88", background: "#EAF4F8" },
  feed:     { border: "#6A5018", background: "#F5F2E8" },
  prune:    { border: "#6A4A28", background: "#F2EEE8" },
  good:     { border: "#2A6E38", background: "#EDF5EE" },
  care:     { border: "#C0527A", background: "#FAF0F4" },
};

// Shared style objects
export const base = {
  fontFamily: "'Georgia', 'Times New Roman', serif",
  fontSize: 14,
  lineHeight: 1.6,
  color: "#1a1a1a",
};

export const card = {
  background: "#fff",
  border: "1px solid #e2d9cf",
  borderRadius: 14,
  padding: "1.25rem 1.5rem",
  marginBottom: "1rem",
  boxShadow: "0 1px 4px rgba(30,58,47,0.06)",
};

export const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 13px",
  border: "1.5px solid #d4c9be",
  borderRadius: 9,
  fontSize: 14,
  fontFamily: "inherit",
  background: BRAND.warmWhite,
  color: "#1a1a1a",
  outline: "none",
  transition: "border-color 0.15s",
};

export const selectStyle = { ...inputStyle };

export const labelStyle = {
  fontSize: 11,
  color: "#9a8070",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 5,
  display: "block",
  fontFamily: "'Georgia', serif",
};

export const sectionHead = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: BRAND.forestAnchor,
  margin: "0 0 0.85rem",
};

export const btn = (bg, fg = "#fff") => ({
  background: bg,
  color: fg,
  border: "none",
  borderRadius: 9,
  padding: "10px 20px",
  fontSize: 14,
  fontFamily: "inherit",
  cursor: "pointer",
  fontWeight: 600,
  letterSpacing: "0.01em",
  transition: "filter 0.1s",
});

export const btnGhost = {
  background: "transparent",
  color: "#7a6a5e",
  border: "1.5px solid #d4c9be",
  borderRadius: 9,
  padding: "8px 14px",
  fontSize: 13,
  fontFamily: "inherit",
  cursor: "pointer",
};

export const alertCardStyle = (type) => ({
  background: ALERT_COLOURS[type]?.background || ALERT_COLOURS.care.background,
  borderLeft: `3px solid ${ALERT_COLOURS[type]?.border || ALERT_COLOURS.care.border}`,
  borderRadius: "0 10px 10px 0",
  padding: "10px 14px",
  fontSize: 13.5,
  marginBottom: 7,
});
