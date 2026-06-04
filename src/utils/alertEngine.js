// ─────────────────────────────────────────────
// PetalCast — Alert Engine
// ─────────────────────────────────────────────
// Generates alerts per space, not per plant.
// Each space alert has a headline + optional callout plant.
// Urgent plant-level alerts fire separately.

import PLANT_DB from "../data/plants.js";

const SEASON_MAP = {
  12:"winter",1:"winter",2:"winter",
  3:"spring",4:"spring",5:"spring",
  6:"summer",7:"summer",8:"summer",
  9:"autumn",10:"autumn",11:"autumn"
};

function getSeason() {
  return SEASON_MAP[new Date().getMonth() + 1];
}

// How many hours to suppress watering after logging, per plant type
function wateringSuppressionHours(plant, stage, soil, position) {
  const season = getSeason();
  const band = plant.watering?.[season] || "";
  const base =
    band.includes("daily")    ? 18 :
    band.includes("every 2")  ? 36 :
    band.includes("twice")    ? 48 :
    band.includes("once")     ? 96 :
    band.includes("minimal")  ? 168 : 72;

  const soilMult   = { sandy: 0.7, chalk: 0.75, loam: 1.0, clay: 1.3, peat: 1.2 }[soil] || 1.0;
  const posMult    = { pot: 0.6, "raised bed": 0.85, ground: 1.0 }[position] || 1.0;
  const stageMult  = { seedling: 0.7, young: 0.85, established: 1.0, mature: 1.1 }[stage] || 1.0;

  return base * soilMult * posMult * stageMult;
}

// Is this plant still within its post-watering suppression window?
function isWateringSuppressed(spacePlant, plant, spaceLastWatered, soil) {
  const lastWatered = spacePlant.lastWatered || spaceLastWatered;
  if (!lastWatered) return false;
  const hours = wateringSuppressionHours(plant, spacePlant.stage, soil, spacePlant.position);
  const elapsed = (Date.now() - new Date(lastWatered).getTime()) / (1000 * 60 * 60);
  return elapsed < hours;
}

// Does this plant need watering based on conditions?
function needsWatering(plant, spacePlant, weather, soil, aspect) {
  const season = getSeason();
  const band = plant.watering?.[season] || "none";
  if (band === "none") return false;

  const soilFactor   = { sandy:0.6, chalk:0.65, loam:1.0, clay:1.4, peat:1.35 }[soil] || 1.0;
  const aspectFactor = { S:0.8, SW:0.85, W:0.9, SE:0.85, E:1.0, NE:1.1, N:1.2, NW:1.1 }[aspect] || 1.0;
  const posFactor    = { pot:0.6, "raised bed":0.8, ground:1.0 }[spacePlant.position] || 1.0;
  const m = soilFactor * aspectFactor * posFactor;

  const thresholds = {
    none:     null,
    low:      { days: 5,  rainMm: 3  * m },
    moderate: { days: 3,  rainMm: 5  * m },
    high:     { days: 2,  rainMm: 8  * m },
    regular:  { days: 2,  rainMm: 8  * m },
    frequent: { days: 1,  rainMm: 10 * m },
  };

  const key = Object.keys(thresholds).find(k => band.includes(k)) || "low";
  const t = thresholds[key];
  if (!t) return false;

  const rainKey = t.days <= 2 ? "rain2d" : t.days <= 3 ? "rain3d" : "rain5d";
  return (weather[rainKey] || 0) < t.rainMm;
}

// Does this plant have a frost risk tonight?
function hasFrostRisk(plant, weather) {
  if (!plant.frost_sensitivity?.sensitive) return false;
  const threshold = plant.frost_sensitivity.threshold_c ?? -5;
  return weather.minTemp !== null && weather.minTemp <= threshold + 2;
}

// Is pruning due this month?
function isPruningDue(plant) {
  const m = new Date().getMonth() + 1;
  return (plant.pruning_months || []).some(pm => Math.abs(pm - m) <= 1);
}

// ── Main export ───────────────────────────────
// Generates all alerts for all spaces.
// Returns { spaceAlerts, plantAlerts }

export function generateAllAlerts(spaces, weather) {
  const spaceAlerts = [];
  const plantAlerts = [];

  for (const space of spaces) {
    if (!space.plants?.length) continue;

    const soil   = space.soil || "";
    const aspect = space.aspect || "";
    const lastWatered = space.wateringLog?.length
      ? [...space.wateringLog].sort((a,b) => new Date(b.timestamp)-new Date(a.timestamp))[0]?.timestamp
      : null;

    // Collect per-plant needs for this space
    const wateringNeeded = [];
    const frostRisk      = [];
    const pruningDue     = [];

    for (const spacePlant of space.plants) {
      const plant = PLANT_DB.find(p => p.id === spacePlant.plantId);
      if (!plant) continue;

      // Watering
      if (
        needsWatering(plant, spacePlant, weather, soil, aspect) &&
        !isWateringSuppressed(spacePlant, plant, lastWatered, soil)
      ) {
        wateringNeeded.push({ plant, spacePlant });
      }

      // Frost — always plant-level (urgent)
      if (hasFrostRisk(plant, weather)) {
        frostRisk.push({ plant, spacePlant });
      }

      // Pruning — space-level callout
      if (isPruningDue(plant)) {
        pruningDue.push({ plant, spacePlant });
      }
    }

    // ── Space-level watering alert ──────────────
    if (wateringNeeded.length > 0) {
      // Find the thirstiest plant for the callout
      // Pots > raised bed > ground; seedling/young > established > mature
      const priority = wateringNeeded.sort((a, b) => {
        const posScore = { pot: 3, "raised bed": 2, ground: 1 };
        const stageScore = { seedling: 4, young: 3, established: 2, mature: 1 };
        return (
          (posScore[b.spacePlant.position] || 1) - (posScore[a.spacePlant.position] || 1) ||
          (stageScore[b.spacePlant.stage]  || 2) - (stageScore[a.spacePlant.stage]  || 2)
        );
      });

      const calloutPlants = priority.slice(0, 2).map(x => x.plant.common_name);
      const callout = calloutPlants.length > 0
        ? `pay extra attention to the ${calloutPlants.join(" and ").toLowerCase()}`
        : null;

      spaceAlerts.push({
        id: `${space.id}-watering`,
        tier: "space",
        type: "watering",
        spaceId: space.id,
        spaceName: space.name,
        plantId: null,
        plantName: null,
        headline: `Time to water your ${space.name.toLowerCase()}`,
        callout,
        body: `Rainfall has been low recently.`,
        urgent: false,
      });
    }

    // ── Space-level pruning alert ───────────────
    if (pruningDue.length > 0) {
      const names = pruningDue.slice(0, 2).map(x => x.plant.common_name).join(" and ");
      spaceAlerts.push({
        id: `${space.id}-prune`,
        tier: "space",
        type: "prune",
        spaceId: space.id,
        spaceName: space.name,
        plantId: null,
        plantName: null,
        headline: `Some pruning to do in your ${space.name.toLowerCase()}`,
        callout: `${names.toLowerCase()} ${pruningDue.length === 1 ? "is" : "are"} the priority`,
        body: `This is a good month to prune.`,
        urgent: false,
      });
    }

    // ── Plant-level frost alerts (urgent) ────────
    for (const { plant, spacePlant } of frostRisk) {
      const isMovable = spacePlant.position === "pot";
      plantAlerts.push({
        id: `${space.id}-${spacePlant.id}-frost`,
        tier: "plant",
        type: "frost",
        spaceId: space.id,
        spaceName: space.name,
        plantId: spacePlant.plantId,
        plantName: plant.common_name,
        headline: `Frost risk — ${plant.common_name}`,
        callout: null,
        body: isMovable
          ? `Sub-zero forecast tonight. Bring this pot inside or cover well.`
          : `Sub-zero forecast tonight. Protect with fleece before dark.`,
        urgent: true,
      });
    }
  }

  return { spaceAlerts, plantAlerts };
}
