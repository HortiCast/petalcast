// ─────────────────────────────────────────────
// PetalCast — useGarden hook
// ─────────────────────────────────────────────
// Central state manager for the entire garden.
// All components read from and write to this hook.
// Persists to localStorage so data survives refresh.

import { useState, useEffect, useCallback } from "react";
import { createSpace, createSpacePlant, createWateringEvent } from "../data/models";

const STORAGE_KEY = "petalcast_garden_v1";

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

const DEFAULT_STATE = {
  setupComplete: false,
  postcode: "",
  location: null,
  weather: {
    minTemp: null,
    windKmh: null,
    rain2d: 0,
    rain3d: 0,
    rain5d: 0,
    rain14d: 0,
    forecastRain: [],
  },
  onboardingAnswers: {},
  spaces: [],
  nudgeFrequency: "few",
};

export function useGarden() {
  const [garden, setGarden] = useState(() => loadFromStorage() || DEFAULT_STATE);

  // Persist every change to localStorage
  useEffect(() => {
    saveToStorage(garden);
  }, [garden]);

  // ── Setup & weather ──────────────────────────

  function completeSetup({ postcode, location, weather, onboardingAnswers, nudgeFrequency }) {
    setGarden(prev => ({
      ...prev,
      setupComplete: true,
      postcode,
      location,
      weather,
      onboardingAnswers,
      nudgeFrequency: nudgeFrequency || "few",
    }));
  }

  function updateWeather(weather) {
    setGarden(prev => ({ ...prev, weather }));
  }

  function resetGarden() {
    setGarden(DEFAULT_STATE);
  }

  // ── Spaces ───────────────────────────────────

  function addSpace(spaceData) {
    const newSpace = createSpace(spaceData);
    setGarden(prev => ({
      ...prev,
      spaces: [...prev.spaces, newSpace],
    }));
    return newSpace.id;
  }

  function updateSpace(spaceId, updates) {
    setGarden(prev => ({
      ...prev,
      spaces: prev.spaces.map(s =>
        s.id === spaceId ? { ...s, ...updates } : s
      ),
    }));
  }

  function removeSpace(spaceId) {
    setGarden(prev => ({
      ...prev,
      spaces: prev.spaces.filter(s => s.id !== spaceId),
    }));
  }

  // ── Plants within spaces ─────────────────────

  function addPlantToSpace(spaceId, plantDbEntry, overrides = {}) {
    const newPlant = createSpacePlant(plantDbEntry, overrides);
    setGarden(prev => ({
      ...prev,
      spaces: prev.spaces.map(s =>
        s.id === spaceId
          ? { ...s, plants: [...s.plants, newPlant] }
          : s
      ),
    }));
    return newPlant.id;
  }

  function updatePlantInSpace(spaceId, plantId, updates) {
    setGarden(prev => ({
      ...prev,
      spaces: prev.spaces.map(s =>
        s.id === spaceId
          ? {
              ...s,
              plants: s.plants.map(p =>
                p.id === plantId ? { ...p, ...updates } : p
              ),
            }
          : s
      ),
    }));
  }

  function removePlantFromSpace(spaceId, plantId) {
    setGarden(prev => ({
      ...prev,
      spaces: prev.spaces.map(s =>
        s.id === spaceId
          ? { ...s, plants: s.plants.filter(p => p.id !== plantId) }
          : s
      ),
    }));
  }

  function movePlantToSpace(fromSpaceId, toSpaceId, plantId) {
    let plantToMove = null;
    setGarden(prev => {
      const fromSpace = prev.spaces.find(s => s.id === fromSpaceId);
      plantToMove = fromSpace?.plants.find(p => p.id === plantId);
      if (!plantToMove) return prev;
      return {
        ...prev,
        spaces: prev.spaces.map(s => {
          if (s.id === fromSpaceId) return { ...s, plants: s.plants.filter(p => p.id !== plantId) };
          if (s.id === toSpaceId)   return { ...s, plants: [...s.plants, { ...plantToMove, id: Date.now() }] };
          return s;
        }),
      };
    });
  }

  // ── Watering log ─────────────────────────────

  function logWatering(spaceId) {
    const weatherSnapshot = {
      temp: garden.weather.minTemp,
      rain2d: garden.weather.rain2d,
    };
    const event = createWateringEvent(spaceId, weatherSnapshot);
    const today = new Date().toISOString().split("T")[0];

    setGarden(prev => ({
      ...prev,
      spaces: prev.spaces.map(s =>
        s.id === spaceId
          ? {
              ...s,
              wateringLog: [...(s.wateringLog || []), event],
              // Update lastWatered on all plants in this space
              plants: s.plants.map(p => ({ ...p, lastWatered: today })),
            }
          : s
      ),
    }));
  }

  // ── Derived helpers ──────────────────────────

  // Flat list of all plants across all spaces (for alerts engine)
  const allPlantsFlat = garden.spaces.flatMap(space =>
    space.plants.map(p => ({
      ...p,
      spaceId: space.id,
      spaceName: space.name,
      spaceAspect: space.aspect || garden.onboardingAnswers?.aspect || "",
      spaceSoil: space.soil || garden.onboardingAnswers?.soil || "",
    }))
  );

  const totalPlantCount = allPlantsFlat.length;

  function getSpace(spaceId) {
    return garden.spaces.find(s => s.id === spaceId) || null;
  }

  function getLastWateredForSpace(spaceId) {
    const space = getSpace(spaceId);
    if (!space?.wateringLog?.length) return null;
    const sorted = [...space.wateringLog].sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    return sorted[0].timestamp;
  }

  return {
    garden,
    // Setup
    completeSetup,
    updateWeather,
    resetGarden,
    // Spaces
    addSpace,
    updateSpace,
    removeSpace,
    // Plants
    addPlantToSpace,
    updatePlantInSpace,
    removePlantFromSpace,
    movePlantToSpace,
    // Watering
    logWatering,
    getLastWateredForSpace,
    // Derived
    allPlantsFlat,
    totalPlantCount,
    getSpace,
  };
}
