/**
 * Mission Architect - Team Mode (Pass-the-Device) Controller
 * Multi-player collaborative engineering for 2 to 4 players.
 */

import { state, setScreen, setStep, notify } from './state.js';

export const ROLE_DEFINITIONS = {
  // 4 Player Roles
  4: [
    {
      id: 'planner',
      name: 'Mission Planner',
      priority: 'Stay within budget & optimize launcher capacity',
      priorityKey: 'budget',
      ownedSteps: [0, 3], // Spacecraft destination/bus, launcher & orbit
      desc: 'Controls project budget, selects launch vehicle, and approves operational orbit.'
    },
    {
      id: 'engineer',
      name: 'Spacecraft Systems Engineer',
      priority: 'Keep mass low & ensure positive power balance',
      priorityKey: 'power',
      ownedSteps: [0, 1], // Bus chassis, solar panels, batteries, extras
      desc: 'Designs electrical power system, thermal kits, and structural mass margins.'
    },
    {
      id: 'science',
      name: 'Science Lead',
      priority: 'Maximize science return & fulfill mission objectives',
      priorityKey: 'science',
      ownedSteps: [2], // Scientific Instruments
      desc: 'Selects the payload sensor suite to maximize data return and meet mission criteria.'
    },
    {
      id: 'comms',
      name: 'Communications Lead',
      priority: 'Downlink 100% of data with high-gain antennas',
      priorityKey: 'data',
      ownedSteps: [1], // Antenna selection
      desc: 'Optimizes daily data transmission pipeline to prevent ground station buffer overflows.'
    }
  ],
  // 3 Player Roles
  3: [
    {
      id: 'planner',
      name: 'Mission Planner',
      priority: 'Stay within budget & optimize launcher capacity',
      priorityKey: 'budget',
      ownedSteps: [0, 3],
      desc: 'Oversees budget, launch vehicle capacity, and orbital trajectories.'
    },
    {
      id: 'engineer_comms',
      name: 'Systems & Comms Engineer',
      priority: 'Keep mass low & return all telemetry data',
      priorityKey: 'power',
      ownedSteps: [1],
      desc: 'Configures solar panels, batteries, antennas, and protection extras.'
    },
    {
      id: 'science',
      name: 'Science Lead',
      priority: 'Maximize scientific return & fulfill mission criteria',
      priorityKey: 'science',
      ownedSteps: [2],
      desc: 'Chooses scientific instrument payloads and validates objectives.'
    }
  ],
  // 2 Player Roles
  2: [
    {
      id: 'flight_director',
      name: 'Flight Director & Platform Lead',
      priority: 'Maintain strict budget & launcher mass margin',
      priorityKey: 'budget',
      ownedSteps: [0, 1, 3], // Mission, bus, power, launcher, orbit
      desc: 'Manages mission architecture, bus platform, power balance, and launch vehicle.'
    },
    {
      id: 'payload_specialist',
      name: 'Payload & Communications Lead',
      priority: 'Maximize science output & clear telemetry downlinks',
      priorityKey: 'science',
      ownedSteps: [1, 2], // Antenna, instruments, extras
      desc: 'Selects scientific sensors, downlink antennas, and payload protection systems.'
    }
  ]
};

export const CHANGE_REQUEST_REASONS = [
  'Budget exceeded or dangerously low (< $5M remaining)',
  'Launch mass exceeds booster capacity',
  'Solar power generation deficit in orbit',
  'Telemetry data rate bottleneck (instruments losing data)',
  'Core scientific requirements not yet fulfilled',
  'Bus instrument mass cap exceeded'
];

export const teamState = {
  playerCount: 4,
  players: [], // { name, roleId, roleName, priority, priorityKey, ownedSteps }
  currentTurnIndex: 0,
  turnOrder: [], // Sequence of player indices
  changeRequestCount: 0,
  approvalVotes: {}, // { [playerIndex]: { approved: boolean, reason?: string } }
  changeLogs: []
};

/**
 * Initializes team mode with player names and role allocation
 */
export function initTeamMode(playerNames) {
  const count = Math.max(2, Math.min(4, playerNames.length));
  teamState.playerCount = count;
  const roleDefs = ROLE_DEFINITIONS[count];

  teamState.players = playerNames.map((name, idx) => {
    const role = roleDefs[idx] || roleDefs[0];
    return {
      name: name.trim() || `Player ${idx + 1}`,
      roleId: role.id,
      roleName: role.name,
      priority: role.priority,
      priorityKey: role.priorityKey,
      ownedSteps: role.ownedSteps,
      desc: role.desc
    };
  });

  // Turn order corresponds to steps 0, 1, 2, 3
  teamState.currentTurnIndex = 0;
  teamState.changeRequestCount = 0;
  teamState.approvalVotes = {};
  teamState.changeLogs = [];
  teamState.missionPicked = false;

  state.isTeamMode = true;
  state.teamPlayers = teamState.players;

  // Show Pass-the-Device for Player 1
  showPassDeviceScreen(0);
}

/**
 * Shows the full-screen Pass-The-Device interstitial
 */
export function showPassDeviceScreen(playerIdx) {
  teamState.currentTurnIndex = playerIdx;
  state.activePlayerIndex = playerIdx;
  const player = teamState.players[playerIdx];

  const screen = document.getElementById('screen-pass-device');
  const nameEl = document.getElementById('pass-player-name');
  const roleEl = document.getElementById('pass-player-role');
  const prioEl = document.getElementById('pass-player-priority');
  const descEl = document.getElementById('pass-player-desc');

  const avatarEl = document.getElementById('pass-player-avatar');
  const colors = ['#38D5FF', '#35E0A1', '#8B5CFF', '#FFB547'];
  const col = colors[playerIdx % colors.length];

  if (avatarEl) {
    avatarEl.textContent = (player.name || 'P')[0].toUpperCase();
    avatarEl.style.backgroundColor = col;
    avatarEl.style.boxShadow = `0 0 30px ${col}88`;
  }
  if (nameEl) nameEl.textContent = player.name;
  if (roleEl) {
    roleEl.textContent = player.roleName;
    roleEl.style.color = col;
    roleEl.style.borderColor = `${col}66`;
  }
  if (prioEl) prioEl.textContent = player.priority;
  if (descEl) descEl.textContent = player.desc;

  setScreen('pass-device');
}

/**
 * Player acknowledges Ready on Pass-The-Device screen
 */
export function confirmPlayerReady() {
  const player = teamState.players[teamState.currentTurnIndex];
  if (teamState.currentTurnIndex === 0 && !teamState.missionPicked) {
    teamState.missionPicked = true;
    setScreen('mission-select');
    return;
  }

  let targetStep = 0;
  if (teamState.currentTurnIndex === 0) targetStep = 0; // Spacecraft
  else if (teamState.currentTurnIndex === 1) targetStep = 1; // Power & Comms
  else if (teamState.currentTurnIndex === 2) targetStep = 2; // Instruments
  else if (teamState.currentTurnIndex === 3) targetStep = 3; // Launch & Orbit
  else targetStep = 4;

  setStep(targetStep);
  setScreen('build');
}

/**
 * Checks if current active player owns a specific step
 */
export function doesCurrentPlayerOwnStep(stepIndex) {
  if (!state.isTeamMode) return true;
  const player = teamState.players[teamState.currentTurnIndex];
  if (!player) return true;
  return player.ownedSteps.includes(stepIndex);
}

/**
 * Advances to next player turn or opens the Team Review Round
 */
export function advanceTeamTurn() {
  const nextTurn = teamState.currentTurnIndex + 1;
  if (nextTurn < teamState.players.length) {
    showPassDeviceScreen(nextTurn);
  } else {
    // All player initial design turns completed -> Proceed to Team Review Round
    state.currentStep = 4; // Review step
    setScreen('build');
  }
}

/**
 * Records player vote in the Review Round
 */
export function submitPlayerVote(playerIndex, approved, reason = '') {
  teamState.approvalVotes[playerIndex] = { approved, reason };

  if (!approved) {
    teamState.changeRequestCount++;
    teamState.changeLogs.push({
      player: teamState.players[playerIndex].name,
      role: teamState.players[playerIndex].roleName,
      reason
    });
    // Find role responsible for this change request and route turn back
    routeChangeRequest(reason);
    return false;
  }

  // Check if all players have approved
  const totalApproved = Object.values(teamState.approvalVotes).filter(v => v.approved).length;
  if (totalApproved === teamState.players.length) {
    return true; // Unlocked!
  }
  return false;
}

/**
 * Grants full crew consensus approval
 */
export function approveAllCrew() {
  teamState.players.forEach((_, idx) => {
    teamState.approvalVotes[idx] = { approved: true };
  });
  return true;
}

/**
 * Routes a change request back to the responsible role
 */
function routeChangeRequest(reason) {
  let targetRoleIndex = 0; // Default to Planner
  if (reason.includes('budget') || reason.includes('booster')) {
    targetRoleIndex = teamState.players.findIndex(p => p.roleId === 'planner' || p.roleId === 'flight_director');
  } else if (reason.includes('power') || reason.includes('mass cap')) {
    targetRoleIndex = teamState.players.findIndex(p => p.roleId === 'engineer' || p.roleId === 'engineer_comms');
  } else if (reason.includes('science') || reason.includes('requirements')) {
    targetRoleIndex = teamState.players.findIndex(p => p.roleId === 'science' || p.roleId === 'payload_specialist');
  } else if (reason.includes('telemetry') || reason.includes('downlink')) {
    targetRoleIndex = teamState.players.findIndex(p => p.roleId === 'comms' || p.roleId === 'engineer_comms');
  }

  if (targetRoleIndex < 0) targetRoleIndex = 0;
  showPassDeviceScreen(targetRoleIndex);
}

/**
 * Computes Team Sync Bonus (0 to +10 pts)
 */
export function calculateTeamSyncBonus(result) {
  if (!state.isTeamMode) return 0;

  // Base 10 points minus 2.5 points per change request
  let bonus = Math.max(0, 10 - teamState.changeRequestCount * 2.5);

  // Bonus check: Did all player priorities end in OK status?
  const budgetOk = result.constraints.budget;
  const powerOk = result.powerStatus === 'OK';
  const dataOk = result.dataStatus === 'OK';
  const reqsOk = result.allReqsMet;

  if (budgetOk && powerOk && dataOk && reqsOk) {
    bonus = Math.min(10, bonus + 2);
  } else {
    bonus = Math.max(0, bonus - 2);
  }

  return Math.round(bonus * 10) / 10;
}
