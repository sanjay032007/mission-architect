/**
 * Mission Architect - State Management
 * In-memory observable state store with safe localStorage persistence.
 */

import { calculateMission, applyEventsToResult } from './engine.js';
import { MISSIONS } from './data.js';

const STORAGE_KEY_BEST = 'mission_architect_best_scores_v1';

function loadStoredScores() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BEST);
    return raw ? JSON.parse(raw) : { earth: 0, moon: 0, mars: 0 };
  } catch (e) {
    return { earth: 0, moon: 0, mars: 0 };
  }
}

function persistScore(missionId, score) {
  try {
    const current = loadStoredScores();
    if (score > (current[missionId] || 0)) {
      current[missionId] = score;
      localStorage.setItem(STORAGE_KEY_BEST, JSON.stringify(current));
    }
  } catch (e) {
    // Graceful fallback if storage is blocked or quota exceeded
  }
}

export const state = {
  currentScreen: 'landing', // 'landing' | 'mission-select' | 'build' | 'review' | 'sim' | 'report'
  missionId: 'earth',
  difficulty: 'normal', // 'easy' | 'normal' | 'hard' | 'sandbox'
  currentStep: 0, // 0: Spacecraft, 1: Power & Comms, 2: Instruments, 3: Launch & Orbit, 4: Review
  
  // Design Configuration
  busId: null,
  panelId: null,
  batteryId: 'none',
  antennaId: null,
  instrumentIds: [],
  extraIds: [],
  launcherId: null,
  orbitId: null,

  // Team mode state
  isTeamMode: false,
  teamPlayers: [],
  activePlayerIndex: 0,
  teamApprovalState: {},

  // Telemetry and results
  result: null,
  bestScores: loadStoredScores(),

  // Observers
  listeners: []
};

export function subscribe(listener) {
  state.listeners.push(listener);
  return () => {
    state.listeners = state.listeners.filter(l => l !== listener);
  };
}

let notifyScheduled = false;
export function notify() {
  // Re-run pure engine calculations debounced to animation frame
  if (!notifyScheduled) {
    notifyScheduled = true;
    requestAnimationFrame(() => {
      notifyScheduled = false;
      state.result = calculateMission(state);
      if (state.appliedEvents && state.appliedEvents.length > 0) {
        state.result = applyEventsToResult(state.result, state.appliedEvents);
      }
      for (const listener of state.listeners) {
        try {
          listener(state);
        } catch (err) {
          console.error('State observer error:', err);
        }
      }
    });
  }
}

export function setScreen(screenName) {
  state.currentScreen = screenName;
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  notify();
}

export function setMission(missionId) {
  state.missionId = missionId;
  // Set smart default orbit for destination
  if (missionId === 'earth') state.orbitId = 'sso';
  else if (missionId === 'moon') state.orbitId = 'moon_polar';
  else if (missionId === 'mars') state.orbitId = 'mars_polar';
  notify();
}

export function setDifficulty(difficulty) {
  state.difficulty = difficulty;
  notify();
}

export function setStep(stepIndex) {
  state.currentStep = Math.max(0, Math.min(4, stepIndex));
  notify();
}

export function selectBus(busId) {
  state.busId = busId;
  notify();
}

export function selectPanel(panelId) {
  state.panelId = panelId;
  notify();
}

export function selectBattery(batteryId) {
  state.batteryId = batteryId;
  notify();
}

export function selectAntenna(antennaId) {
  state.antennaId = antennaId;
  notify();
}

export function selectLauncher(launcherId) {
  state.launcherId = launcherId;
  notify();
}

export function selectOrbit(orbitId) {
  state.orbitId = orbitId;
  notify();
}

export function toggleInstrument(instrumentId) {
  const index = state.instrumentIds.indexOf(instrumentId);
  if (index >= 0) {
    state.instrumentIds.splice(index, 1);
  } else {
    state.instrumentIds.push(instrumentId);
  }
  notify();
}

export function toggleExtra(extraId) {
  const index = state.extraIds.indexOf(extraId);
  if (index >= 0) {
    state.extraIds.splice(index, 1);
  } else {
    state.extraIds.push(extraId);
  }
  notify();
}

export function resetMissionDesign() {
  state.busId = null;
  state.panelId = null;
  state.batteryId = 'none';
  state.antennaId = null;
  state.instrumentIds = [];
  state.extraIds = [];
  state.launcherId = null;
  state.currentStep = 0;
  
  if (state.missionId === 'earth') state.orbitId = 'sso';
  else if (state.missionId === 'moon') state.orbitId = 'moon_polar';
  else if (state.missionId === 'mars') state.orbitId = 'mars_polar';

  notify();
}

export function recordCurrentScore() {
  if (state.result && state.result.canLaunch) {
    const score = state.result.totalScore;
    persistScore(state.missionId, score);
    state.bestScores = loadStoredScores();
    recordComparisonResult(state.result);
  }
}


export const comparisonHistory = {
  earth: [],
  moon: [],
  mars: []
};

export function recordComparisonResult(res) {
  if (!res || !res.mission) return;
  const list = comparisonHistory[res.mission.id] || [];
  list.unshift({
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    score: res.totalScore,
    grade: res.grade,
    cost: res.totalCost,
    mass: res.launchMass,
    powerGen: res.powerGen,
    powerUse: res.powerUse,
    dataReturned: res.dataReturned,
    lifetime: res.lifetime,
    busName: res.bus ? res.bus.name : '—',
    launcherName: res.launcher ? res.launcher.name : '—',
    orbitName: res.orbit ? res.orbit.name : '—'
  });
  if (list.length > 3) list.pop();
  comparisonHistory[res.mission.id] = list;
}

export function exportDesignHash() {
  const config = {
    m: state.missionId,
    d: state.difficulty,
    b: state.busId,
    p: state.panelId,
    bat: state.batteryId,
    a: state.antennaId,
    i: state.instrumentIds,
    e: state.extraIds,
    l: state.launcherId,
    o: state.orbitId
  };
  try {
    const json = JSON.stringify(config);
    return btoa(encodeURIComponent(json));
  } catch (err) {
    return '';
  }
}

export function importDesignHash(hash) {
  try {
    const raw = decodeURIComponent(atob(hash));
    const config = JSON.parse(raw);
    if (!config || typeof config !== 'object' || !config.m) {
      throw new Error('Invalid mission format');
    }
    state.missionId = config.m || 'earth';
    state.difficulty = config.d || 'normal';
    state.busId = config.b || null;
    state.panelId = config.p || null;
    state.batteryId = config.bat || 'none';
    state.antennaId = config.a || null;
    state.instrumentIds = Array.isArray(config.i) ? config.i : [];
    state.extraIds = Array.isArray(config.e) ? config.e : [];
    state.launcherId = config.l || null;
    state.orbitId = config.o || null;
    notify();
    return true;
  } catch (err) {
    console.warn('Corrupted design hash. Reverting to default mission.');
    return false;
  }
}
