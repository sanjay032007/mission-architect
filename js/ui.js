
// Accessible About & Credits Modal Controller
export function openAboutModal(tab = 'about') {
  const modal = document.getElementById('about-credits-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  modal.classList.add('open');
  switchAboutTab(tab);
  sound.playOpen();
}

export function closeAboutModal() {
  const modal = document.getElementById('about-credits-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('open');
    sound.playSelect();
  }
}

export function switchAboutTab(tabName) {
  const modal = document.getElementById('about-credits-modal');
  if (!modal) return;
  const tabs = modal.querySelectorAll('.modal-tab');
  const panes = modal.querySelectorAll('.tab-pane');
  tabs.forEach(t => {
    const isTarget = t.dataset.target === tabName;
    t.classList.toggle('active', isTarget);
    t.setAttribute('aria-selected', isTarget ? 'true' : 'false');
  });
  panes.forEach(p => {
    const isTarget = p.id === `tab-pane-${tabName}`;
    p.style.display = isTarget ? 'block' : 'none';
    p.classList.toggle('active', isTarget);
  });
}


let countdownTimer = null;

function triggerLaunchSequence() {
 const overlay = document.getElementById('launch-countdown-overlay');
 const numEl = document.getElementById('countdown-num');
 const labelEl = document.getElementById('countdown-label');
 const logEl = document.getElementById('countdown-ticker-log');
 
 if (!overlay || !numEl) {
  setScreen('sim');
  startSimulation();
  return;
 }

 overlay.style.display = 'flex';
 if (logEl) logEl.innerHTML = '';
 sound.playCountdownBeep(false);

 const steps = [
  { count: 10, time: 'T-00:00:10', label: 'RANGE SAFETY CLEAR // AUTOMATIC FLIGHT SEQUENCER ENGAGED', log: 'ALL RADAR & OPTICAL RANGE TRACKERS REPORT GREEN' },
  { count: 8, time: 'T-00:00:08', label: 'CRYOGENIC TOPPING TERMINATED // VEHICLE ON INTERNAL POWER', log: 'GROUND POWER UMBILICAL SEPARATED // BUS VOLTAGE 28.4V' },
  { count: 6, time: 'T-00:00:06', label: 'ATTITUDE GYROSCOPES LOCKED // FLIGHT COMPUTERS ARMED', log: 'INERTIAL MEASUREMENT UNIT (IMU) ZEROED // TRAJECTORY LOADED' },
  { count: 4, time: 'T-00:00:04', label: 'PROPELLANT TANKS PRESSURIZED // SOUND SUPPRESSION ACTIVE', log: 'WATER DELUGE SYSTEM INITIATED // ACOUSTIC BAFFLES SATURATED' },
  { count: 2, time: 'T-00:00:02', label: 'MAIN ENGINE IGNITION COMMANDED // TURBOPUMPS AT SPEED', log: 'IGNITION VERIFIED // CHAMBER PRESSURES NOMINAL' },
  { count: 1, time: 'T-00:00:01', label: 'THRUST PROFILE 100% // ALL PARAMETERS VERIFIED', log: 'FLIGHT HARDWARE COMMIT TO LIFTOFF' },
  { count: 0, time: 'T-00:00:00', label: 'HOLD-DOWN CLAMPS RELEASED // WE HAVE LIFTOFF!', log: 'TOWER CLEARED // VEHICLE COMMITTED TO FLIGHT' }
 ];

 let currentStepIdx = 0;

 function runStep(idx) {
  if (idx >= steps.length) {
   if (countdownTimer) clearInterval(countdownTimer);
   countdownTimer = null;
   overlay.style.display = 'none';
   sound.playLaunch();
   setScreen('sim');
   startSimulation();
   return;
  }

  const s = steps[idx];
  numEl.textContent = s.time;
  if (labelEl) labelEl.textContent = s.label;

  if (logEl) {
   const line = document.createElement('div');
   line.className = 'ticker-line';
   line.innerHTML = `<span class="text-cyan">[${s.time}]</span> ${s.log}`;
   logEl.appendChild(line);
   logEl.scrollTop = logEl.scrollHeight;
  }

  sound.playCountdownBeep(s.count <= 1);
 }

 runStep(0);

 if (countdownTimer) clearInterval(countdownTimer);
 countdownTimer = setInterval(() => {
  currentStepIdx++;
  runStep(currentStepIdx);
 }, 750);
}

function abortCountdown() {
 if (countdownTimer) {
  clearInterval(countdownTimer);
  countdownTimer = null;
 }
 const overlay = document.getElementById('launch-countdown-overlay');
 if (overlay) overlay.style.display = 'none';
 showToast('Launch aborted by Range Safety. Vehicle secured on pad.', 'warning');
}

function skipCountdown() {
 if (countdownTimer) {
  clearInterval(countdownTimer);
  countdownTimer = null;
 }
 const overlay = document.getElementById('launch-countdown-overlay');
 if (overlay) overlay.style.display = 'none';
 sound.playLaunch();
 setScreen('sim');
 startSimulation();
}


function generateSegmentedMeterHTML(pct, status, id) {
 const activeCells = Math.min(20, Math.max(0, Math.round((pct / 100) * 20)));
 const statusClass = status === 'ok' || status === 'go' ? 'active-go' : (status === 'tight' || status === 'warn' ? 'active-amber' : 'active-nogo');
 let cells = '';
 for (let i = 0; i < 20; i++) {
  const isActive = i < activeCells;
  cells += `<div class="segment-cell ${isActive ? statusClass : ''}" data-idx="${i}"></div>`;
 }
 return `<div class="segmented-meter" id="segmented-${id}" data-active="${activeCells}" data-status="${statusClass}">${cells}</div>`;
}

function generateArcDialSVG(title, current, max, unit, status) {
 const pct = Math.min(100, Math.max(0, max > 0 ? (current / max) * 100 : 0));
 const angle = -135 + (pct / 100) * 270;
 const statusColor = status === 'ok' || status === 'go' ? '#0A0D12' : (status === 'tight' || status === 'warn' ? '#FFB224' : '#FF5A5F');
 const rad = (angle * Math.PI) / 180;
 const nx = 45 + 22 * Math.cos(rad);
 const ny = 38 + 22 * Math.sin(rad);

 return `
  <div class="arc-dial-box">
   <svg class="arc-dial-svg" viewBox="0 0 90 65" aria-label="${title}: ${current} ${unit}">
    <path d="M 19.6 63.4 A 36 36 0 1 1 70.4 63.4" fill="none" stroke="#E2DFD6" stroke-width="5" stroke-linecap="round"/>
    <path d="M 19.6 63.4 A 36 36 0 1 1 70.4 63.4" fill="none" stroke="${statusColor}" stroke-width="5" stroke-linecap="round" stroke-dasharray="170" stroke-dashoffset="${170 - (pct / 100) * 170}"/>
    <line x1="45" y1="38" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="#0A0D12" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="45" cy="38" r="4" fill="#0A0D12"/>
    <circle cx="45" cy="38" r="1.5" fill="#FAF9F5"/>
   </svg>
   <span class="arc-dial-title">${title}</span>
   <span class="arc-dial-readout">${current}<span style="font-size:0.7rem; color:var(--text-muted); margin-left:2px;">${unit}</span></span>
  </div>
 `;
}

function showImpactPreview(card) {
 if (!state.result) return;
 
 const hypoState = {
  ...state,
  instrumentIds: [...(state.instrumentIds || [])],
  extraIds: [...(state.extraIds || [])]
 };

 const busId = card.dataset.selectBus;
 const panelId = card.dataset.selectPanel;
 const batteryId = card.dataset.selectBattery;
 const antennaId = card.dataset.selectAntenna;
 const instId = card.dataset.toggleInstrument;
 const extraId = card.dataset.toggleExtra;
 const launcherId = card.dataset.selectLauncher;
 const orbitId = card.dataset.selectOrbit;

 if (busId) hypoState.busId = busId;
 if (panelId) hypoState.panelId = panelId;
 if (batteryId) hypoState.batteryId = batteryId;
 if (antennaId) hypoState.antennaId = antennaId;
 if (launcherId) hypoState.launcherId = launcherId;
 if (orbitId) hypoState.orbitId = orbitId;
 if (instId) {
  if (!hypoState.instrumentIds.includes(instId)) {
   hypoState.instrumentIds.push(instId);
  } else {
   hypoState.instrumentIds = hypoState.instrumentIds.filter(id => id !== instId);
  }
 }
 if (extraId) {
  if (!hypoState.extraIds.includes(extraId)) {
   hypoState.extraIds.push(extraId);
  } else {
   hypoState.extraIds = hypoState.extraIds.filter(id => id !== extraId);
  }
 }

 const hypoRes = calculateMission(hypoState);
 clearImpactPreview();

 // 1. Mass ghost update
 const curCap = state.result.launcherCap || 500;
 const hypoCap = hypoRes.launcherCap || curCap;
 const curMassPct = Math.min(100, Math.max(0, (state.result.launchMass / curCap) * 100));
 const hypoMassPct = Math.min(100, Math.max(0, (hypoRes.launchMass / hypoCap) * 100));
 updateMeterGhost('mass', curMassPct, hypoMassPct);

 // 2. Power ghost update
 const curDenom = Math.max(state.result.powerUse, state.result.powerGen, 10);
 const hypoDenom = Math.max(hypoRes.powerUse, hypoRes.powerGen, 10);
 const curPowerPct = Math.min(100, Math.max(0, (state.result.powerGen / curDenom) * 100));
 const hypoPowerPct = Math.min(100, Math.max(0, (hypoRes.powerGen / hypoDenom) * 100));
 updateMeterGhost('power', curPowerPct, hypoPowerPct);

 // 3. Budget ghost update
 const cap = state.result.isSandbox ? Math.max(state.result.totalCost + 20, 100) : state.result.budget;
 const curBudgetPct = Math.min(100, Math.max(0, (state.result.totalCost / cap) * 100));
 const hypoBudgetPct = Math.min(100, Math.max(0, (hypoRes.totalCost / cap) * 100));
 updateMeterGhost('budget', curBudgetPct, hypoBudgetPct);

 // 4. Data ghost update
 const curMax = Math.max(state.result.dataGenDay, state.result.downlinkDay, 10);
 const hypoMax = Math.max(hypoRes.dataGenDay, hypoRes.downlinkDay, 10);
 const curDataPct = Math.min(100, (state.result.dataReturned / curMax) * 100);
 const hypoDataPct = Math.min(100, (hypoRes.dataReturned / hypoMax) * 100);
 updateMeterGhost('data', curDataPct, hypoDataPct);
}

function updateMeterGhost(id, curPct, hypoPct) {
 const meter = document.getElementById(`segmented-${id}`);
 if (!meter) return;
 const cells = meter.querySelectorAll('.segment-cell');
 const curCells = Math.min(20, Math.max(0, Math.round((curPct / 100) * 20)));
 const hypoCells = Math.min(20, Math.max(0, Math.round((hypoPct / 100) * 20)));

 if (hypoCells > curCells) {
  for (let i = curCells; i < hypoCells && i < 20; i++) {
   cells[i].classList.add('ghost-increase');
  }
 } else if (hypoCells < curCells) {
  for (let i = hypoCells; i < curCells && i < 20; i++) {
   cells[i].classList.add('ghost-decrease');
  }
 }
}

function clearImpactPreview() {
 document.querySelectorAll('.segment-cell.ghost-increase, .segment-cell.ghost-decrease').forEach(el => {
  el.classList.remove('ghost-increase', 'ghost-decrease');
 });
 document.querySelectorAll('.gauge-ghost-fill').forEach(el => el.remove());
}

import { calculateMission } from './engine.js';

function getLauncherSilhouetteSVG(id) {
 if (id === 'light') {
  return `<svg width="36" height="88" viewBox="0 0 36 88" fill="none" class="launcher-svg">
   <path d="M18 6 Q23 18 23 28 L13 28 Q13 18 18 6 Z" fill="#E2E8F0" stroke="#38D5FF" stroke-width="1.2"/>
   <rect x="13" y="28" width="10" height="46" fill="#1E293B" stroke="#64748B" stroke-width="1"/>
   <line x1="13" y1="50" x2="23" y2="50" stroke="#38D5FF" stroke-width="1" stroke-opacity="0.6"/>
   <polygon points="12,74 24,74 26,82 10,82" fill="#475569"/>
   <polygon points="12,66 8,80 12,78" fill="#38D5FF"/>
   <polygon points="24,66 28,80 24,78" fill="#38D5FF"/>
  </svg>`;
 } else if (id === 'medium') {
  return `<svg width="48" height="96" viewBox="0 0 48 96" fill="none" class="launcher-svg">
   <path d="M24 4 Q30 18 30 30 L18 30 Q18 18 24 4 Z" fill="#F8FAFC" stroke="#38D5FF" stroke-width="1.4"/>
   <rect x="18" y="30" width="12" height="52" fill="#1E293B" stroke="#64748B" stroke-width="1"/>
   <line x1="18" y1="54" x2="30" y2="54" stroke="#38D5FF" stroke-width="1" stroke-opacity="0.6"/>
   <path d="M11 38 Q14 46 14 52 L14 78 L8 78 L8 52 Q8 46 11 38 Z" fill="#334155" stroke="#94A3B8" stroke-width="1"/>
   <path d="M37 38 Q40 46 40 52 L40 78 L34 78 L34 52 Q34 46 37 38 Z" fill="#334155" stroke="#94A3B8" stroke-width="1"/>
   <polygon points="17,82 31,82 33,90 15,90" fill="#475569"/>
  </svg>`;
 } else {
  return `<svg width="60" height="104" viewBox="0 0 60 104" fill="none" class="launcher-svg">
   <path d="M30 2 Q38 18 38 30 L22 30 Q22 18 30 2 Z" fill="#FFFFFF" stroke="#38D5FF" stroke-width="1.6"/>
   <rect x="22" y="30" width="16" height="58" fill="#0F172A" stroke="#64748B" stroke-width="1.2"/>
   <path d="M13 26 Q17 34 17 42 L17 84 L7 84 L7 42 Q7 34 13 26 Z" fill="#1E293B" stroke="#38D5FF" stroke-width="1.2"/>
   <path d="M47 26 Q51 34 51 42 L51 84 L41 84 L41 42 Q41 34 47 26 Z" fill="#1E293B" stroke="#38D5FF" stroke-width="1.2"/>
   <polygon points="20,88 40,88 42,96 18,96" fill="#475569"/>
   <polygon points="6,84 16,84 17,90 5,90" fill="#334155"/>
   <polygon points="44,84 54,84 55,90 43,90" fill="#334155"/>
  </svg>`;
 }
}

function getOrbitDiagramSVG(id) {
 let orbitTrack = '<circle cx="40" cy="40" r="28" stroke="#38D5FF" stroke-width="1.6" stroke-dasharray="3 3"/>';
 let planetColor = '#1D4ED8';
 let extra = '';

 if (id === 'sso') {
  orbitTrack = '<ellipse cx="40" cy="40" rx="14" ry="32" stroke="#38D5FF" stroke-width="1.8" transform="rotate(-15 40 40)"/>';
  extra = '<line x1="6" y1="40" x2="20" y2="40" stroke="#F59E0B" stroke-width="2" stroke-dasharray="2 2"/>';
 } else if (id === 'leo') {
  orbitTrack = '<ellipse cx="40" cy="40" rx="30" ry="16" stroke="#38D5FF" stroke-width="1.6"/>';
 } else if (id === 'polar') {
  orbitTrack = '<ellipse cx="40" cy="40" rx="13" ry="32" stroke="#38D5FF" stroke-width="1.8"/>';
 } else if (id === 'gto' || (id && id.includes('elliptical'))) {
  orbitTrack = '<ellipse cx="46" cy="40" rx="28" ry="16" stroke="#FFB547" stroke-width="1.6" transform="rotate(-20 46 40)"/>';
 } else if (id && id.includes('lunar')) {
  planetColor = '#64748B';
  orbitTrack = '<circle cx="40" cy="40" r="26" stroke="#CBD5E1" stroke-width="1.6" stroke-dasharray="3 3"/>';
 } else if (id && id.includes('mars')) {
  planetColor = '#C2410C';
  orbitTrack = '<circle cx="40" cy="40" r="26" stroke="#FB923C" stroke-width="1.6" stroke-dasharray="3 3"/>';
 }

 return `<svg width="64" height="64" viewBox="0 0 80 80" fill="none" class="orbit-diagram-svg">
  <circle cx="40" cy="40" r="14" fill="${planetColor}"/>
  <circle cx="40" cy="40" r="14" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
  ${orbitTrack}
  ${extra}
 </svg>`;
}

/**
 * Mission Architect - UI Controller
 * Handles DOM rendering, event delegation, live gauges, stepper navigation, modals, and toasts.
 */

import {
 MISSIONS,
 BUSES,
 SOLAR_PANELS,
 BATTERIES,
 ANTENNAS,
 INSTRUMENTS,
 EXTRAS,
 LAUNCHERS,
 ORBITS
} from './data.js';

import {
 state,
 setScreen,
 setMission,
 setDifficulty,
 setStep,
 selectBus,
 selectPanel,
 selectBattery,
 selectAntenna,
 selectLauncher,
 selectOrbit,
 toggleInstrument,
 toggleExtra,
 resetMissionDesign
} from './state.js';

import { GLOSSARY_TERMS, GAUGE_EXPLANATIONS } from './glossary.js';
import { startSimulation, togglePause, setSimSpeed, skipSimulation } from './sim.js';
import { exportDesignHash, importDesignHash, comparisonHistory } from './state.js';
import {
 teamState,
 initTeamMode,
 showPassDeviceScreen,
 confirmPlayerReady,
 doesCurrentPlayerOwnStep,
 advanceTeamTurn,
 submitPlayerVote,
 approveAllCrew,
 calculateTeamSyncBonus,
 CHANGE_REQUEST_REASONS,
 ROLE_DEFINITIONS
} from './team.js';
import { sound } from './audio.js';

const ROLE_COLORS = {
 planner: '#38D5FF',
 flight_director: '#38D5FF',
 engineer: '#35E0A1',
 engineer_comms: '#35E0A1',
 science: '#8B5CFF',
 payload_specialist: '#8B5CFF',
 comms: '#FFB547'
};

export { sound } from './audio.js';

export const ICONS = {
 info: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
};

let previousViolations = new Set();

export function clearAllToasts() {
 const container = document.getElementById('toast-container');
 if (container) {
  container.innerHTML = '';
 }
}

export function showToast(message, type = 'info') {
 const container = document.getElementById('toast-container');
 if (!container) return;

 const toast = document.createElement('div');
 toast.className = `toast toast-${type}`;
 toast.setAttribute('role', 'alert');
 toast.innerHTML = `<span>${message}</span>`;

 container.appendChild(toast);
 requestAnimationFrame(() => toast.classList.add('show'));

 setTimeout(() => {
  toast.classList.remove('show');
  setTimeout(() => toast.remove(), 250);
 }, 3000);
}

let lastActiveScreen = null;

export function renderUI() {
 const res = state.result;
 if (!res) return;

 if (lastActiveScreen !== state.currentScreen) {
  clearAllToasts();
  lastActiveScreen = state.currentScreen;
 }

 const screens = document.querySelectorAll('.screen');
 screens.forEach(s => {
  if (s.id === `screen-${state.currentScreen}`) {
   s.classList.add('active');
  } else {
   s.classList.remove('active');
  }
 });

 if (state.currentScreen === 'team-setup') {
  renderTeamSetup();
 } else if (state.currentScreen === 'mission-select') {
  renderMissionSelect();
 } else if (state.currentScreen === 'build') {
  renderBuildScreen(res);
 } else if (state.currentScreen === 'review') {
  renderReviewScreen(res);
 } else if (state.currentScreen === 'report') {
  renderReportScreen(res);
 }

 renderLiveDashboard(res);
 checkLimitViolations(res);
}

function checkLimitViolations(res) {
 const currentViolations = new Set();
 if (res.launcherCap !== null && res.launchMass > res.launcherCap) {
  currentViolations.add('mass');
 }
 if (res.powerGen < res.powerUse) {
  currentViolations.add('power');
 }
 if (!res.isSandbox && res.totalCost > res.budget) {
  currentViolations.add('budget');
 }
 if (res.dataReturned < res.dataGenDay) {
  currentViolations.add('data');
 }

 currentViolations.forEach(key => {
  if (!previousViolations.has(key)) {
   const gaugeEl = document.getElementById(`gauge-${key}`);
   if (gaugeEl) {
    gaugeEl.classList.remove('gauge-shake');
    void gaugeEl.offsetWidth;
    gaugeEl.classList.add('gauge-shake');
   }
   if (key === 'budget') {
    showToast(`Budget limit exceeded by $${res.totalCost - res.budget}M!`, 'danger');
   } else if (key === 'mass') {
    showToast(`Launch mass exceeds ${res.launcher ? res.launcher.name : 'launcher'} capacity!`, 'danger');
   }
  }
 });

 previousViolations = currentViolations;
}


let selectedTeamCount = 4;

function renderTeamSetup() {
  const container = document.getElementById('team-players-inputs');
  if (!container) return;

  const roleDefs = ROLE_DEFINITIONS[selectedTeamCount] || ROLE_DEFINITIONS[4];
  const defaultNames = ['Alex', 'Sam', 'Jordan', 'Taylor'];
  const colors = ['#0284C7', '#10B981', '#7C3AED', '#EA580C'];

  container.innerHTML = roleDefs.map((role, idx) => {
    const col = colors[idx % colors.length];
    const initial = (defaultNames[idx] || 'P')[0];
    return `
      <div class="team-player-card" style="padding:16px; border:1.5px solid var(--line); border-left:5px solid ${col}; background:var(--surface-alt); border-radius:var(--radius-xs); box-shadow:1px 1px 0 #0A0D12;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:34px; height:34px; border-radius:50%; background:${col}; color:#FFFFFF; font-weight:800; font-family:var(--font-mono); font-size:1rem; display:flex; align-items:center; justify-content:center; border:1.5px solid #0A0D12;">
              ${initial}
            </div>
            <div>
              <strong style="color:var(--text); font-size:1rem; font-family:var(--font-heading); text-transform:uppercase;">Player ${idx + 1}: ${role.name}</strong>
              <div style="font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); text-transform:uppercase; letter-spacing:0.04em;">Key Focus: ${role.priorityKey.toUpperCase()}</div>
            </div>
          </div>
          <span class="badge" style="background:var(--surface); color:var(--text); border:1px solid var(--line); font-family:var(--font-mono); font-size:0.72rem; font-weight:700;">
            ROLE 0${idx + 1}
          </span>
        </div>
        <p style="font-size:0.86rem; color:var(--text-muted); margin:0 0 10px; line-height:1.4;">${role.desc}</p>
        <div>
          <input type="text" class="team-player-input" data-player-idx="${idx}" value="${defaultNames[idx] || `Player ${idx+1}`}" style="width:100%; box-sizing:border-box; padding:10px 14px; background:#FFFFFF; border:1.5px solid var(--line); border-radius:4px; color:#0A0D12; font-weight:700; font-family:var(--font-mono); font-size:0.95rem; box-shadow:inset 0 1px 3px rgba(0,0,0,0.06);" aria-label="Name for ${role.name}">
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.team-count-btn').forEach(btn => {
    const c = parseInt(btn.dataset.teamCount, 10);
    if (c === selectedTeamCount) {
      btn.classList.add('active');
      btn.style.borderColor = 'var(--line)';
      btn.style.background = 'var(--text)';
      btn.style.color = '#FFFFFF';
      btn.style.boxShadow = '2px 2px 0 #0A0D12';
    } else {
      btn.classList.remove('active');
      btn.style.borderColor = 'var(--line)';
      btn.style.background = 'var(--surface)';
      btn.style.color = 'var(--text)';
      btn.style.boxShadow = 'none';
    }
  });
}
function openCompareModal() {
 const modal = document.getElementById('compare-modal');
 const tableContainer = document.getElementById('compare-table-container');
 if (!modal || !tableContainer) return;

 const history = comparisonHistory[state.missionId] || [];
 if (history.length === 0) {
  tableContainer.innerHTML = `<p class="text-muted" style="padding:var(--space-5); text-align:center;">No past flights recorded for ${state.missionId} yet. Complete a mission flight to populate iteration history.</p>`;
 } else {
  tableContainer.innerHTML = `
   <div style="overflow-x:auto; max-height:420px;">
    <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem; min-width:560px;">
     <thead>
      <tr style="position:sticky; top:0; background:#0B1226; border-bottom:1px solid var(--stroke); color:var(--muted); font-size:0.78rem; text-transform:uppercase; z-index:2;">
       <th style="padding:12px 14px; width:15%;">Run</th>
       <th style="padding:12px 14px; width:22%;">Grade</th>
       <th style="padding:12px 14px; width:16%;">Cost</th>
       <th style="padding:12px 14px; width:16%;">Mass</th>
       <th style="padding:12px 14px; width:18%;">Data</th>
       <th style="padding:12px 14px; width:13%;">Life</th>
      </tr>
     </thead>
     <tbody>
      ${history.map((h, i) => {
       const prev = history[i + 1];
       let scoreDelta = '';
       if (prev) {
        if (h.score > prev.score) scoreDelta = `<span style="color:var(--ok); font-size:0.75rem; margin-left:4px; font-weight:700;">▲ +${h.score - prev.score}</span>`;
        else if (h.score < prev.score) scoreDelta = `<span style="color:var(--danger); font-size:0.75rem; margin-left:4px; font-weight:700;">▼ ${h.score - prev.score}</span>`;
       }
       return `
       <tr style="border-bottom:1px solid rgba(255,255,255,0.06); transition:background 150ms ease-out;">
        <td style="padding:12px 14px; font-weight:700; white-space:nowrap; color:var(--text);">Flight #${history.length - i}</td>
        <td style="padding:12px 14px; white-space:nowrap;">
         <span class="status-chip ${h.grade === 'S' || h.grade === 'A' ? 'ok' : (h.grade === 'B' || h.grade === 'C' ? 'warn' : 'danger')}" style="font-weight:700;">
          ${h.grade} (${h.score} pts)
         </span>
         ${scoreDelta}
        </td>
        <td style="padding:12px 14px; white-space:nowrap; font-family:'JetBrains Mono', monospace;">$${h.cost}M</td>
        <td style="padding:12px 14px; white-space:nowrap; font-family:'JetBrains Mono', monospace;">${h.mass} kg</td>
        <td style="padding:12px 14px; white-space:nowrap; font-family:'JetBrains Mono', monospace;">${h.dataReturned ?? h.data ?? '—'} Gb/d</td>
        <td style="padding:12px 14px; white-space:nowrap; font-family:'JetBrains Mono', monospace;">${h.lifetime ?? h.life ?? '—'} yr</td>
       </tr>
       `;
      }).join('')}
     </tbody>
    </table>
   </div>
  `;
 }

 modal.classList.add('open');
}
function closeCompareModal() {
 const modal = document.getElementById('compare-modal');
 if (modal) modal.classList.remove('open');
}

function renderMissionSelect() {
 const grid = document.getElementById('mission-cards-grid');
 if (!grid) return;

  const planetIllustrations = {
  earth: `<svg width="100" height="100" viewBox="0 0 100 100" fill="none">
   <defs>
    <clipPath id="earthClip"><circle cx="50" cy="50" r="36"/></clipPath>
    <radialGradient id="earthGrad" cx="42%" cy="42%" r="58%">
     <stop offset="0%" stop-color="#38BDF8"/>
     <stop offset="45%" stop-color="#0284C7"/>
     <stop offset="100%" stop-color="#0369A1"/>
    </radialGradient>
   </defs>
   <!-- Orbital Path Line -->
   <ellipse cx="50" cy="50" rx="46" ry="16" stroke="#0A0D12" stroke-width="1.2" stroke-dasharray="3 3"/>
   <!-- Planet Base Sphere (Ocean Blue) -->
   <circle cx="50" cy="50" r="36" fill="url(#earthGrad)" stroke="#0A0D12" stroke-width="2.5"/>
   <!-- Continents (Vibrant Green) -->
   <g clip-path="url(#earthClip)">
    <path d="M 32 30 Q 42 24 52 30 Q 56 38 48 46 Q 36 48 32 36 Z" fill="#10B981" stroke="#0A0D12" stroke-width="1.4"/>
    <path d="M 52 42 Q 62 44 60 56 Q 52 64 46 54 Z" fill="#10B981" stroke="#0A0D12" stroke-width="1.4"/>
    <path d="M 26 62 Q 36 60 40 68 Q 34 76 24 72 Z" fill="#10B981" stroke="#0A0D12" stroke-width="1.4"/>
    <!-- White Cloud Bands -->
    <path d="M 22 28 Q 50 36 78 28" stroke="rgba(255,255,255,0.7)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <path d="M 24 54 Q 50 62 76 54" stroke="rgba(255,255,255,0.6)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
   </g>
   <!-- Outer Rim Ring -->
   <circle cx="50" cy="50" r="36" stroke="#0A0D12" stroke-width="2.5"/>
   <circle cx="86" cy="46" r="3.5" fill="#FFB224" stroke="#0A0D12" stroke-width="1.2"/>
  </svg>`,

  moon: `<svg width="100" height="100" viewBox="0 0 100 100" fill="none">
   <defs>
    <clipPath id="moonClip"><circle cx="50" cy="50" r="36"/></clipPath>
    <radialGradient id="moonGrad" cx="42%" cy="42%" r="58%">
     <stop offset="0%" stop-color="#F1F5F9"/>
     <stop offset="50%" stop-color="#CBD5E1"/>
     <stop offset="100%" stop-color="#94A3B8"/>
    </radialGradient>
   </defs>
   <ellipse cx="50" cy="50" rx="46" ry="16" stroke="#0A0D12" stroke-width="1.2" stroke-dasharray="3 3"/>
   <circle cx="50" cy="50" r="36" fill="url(#moonGrad)" stroke="#0A0D12" stroke-width="2.5"/>
   <g clip-path="url(#moonClip)">
    <!-- Lunar Basalt Maria -->
    <ellipse cx="38" cy="34" rx="11" ry="8" fill="#64748B" stroke="#0A0D12" stroke-width="1.2"/>
    <circle cx="56" cy="46" r="7" fill="#64748B" stroke="#0A0D12" stroke-width="1.2"/>
    <circle cx="48" cy="68" r="5" fill="#64748B" stroke="#0A0D12" stroke-width="1.2"/>
    <circle cx="68" cy="32" r="3.5" fill="#475569" stroke="#0A0D12" stroke-width="1"/>
    <circle cx="28" cy="54" r="4" fill="#475569" stroke="#0A0D12" stroke-width="1"/>
   </g>
   <circle cx="50" cy="50" r="36" stroke="#0A0D12" stroke-width="2.5"/>
   <circle cx="86" cy="46" r="3.5" fill="#FFB224" stroke="#0A0D12" stroke-width="1.2"/>
  </svg>`,

  mars: `<svg width="100" height="100" viewBox="0 0 100 100" fill="none">
   <defs>
    <clipPath id="marsClip"><circle cx="50" cy="50" r="36"/></clipPath>
    <radialGradient id="marsGrad" cx="42%" cy="42%" r="58%">
     <stop offset="0%" stop-color="#FB923C"/>
     <stop offset="45%" stop-color="#EA580C"/>
     <stop offset="100%" stop-color="#9A3412"/>
    </radialGradient>
   </defs>
   <ellipse cx="50" cy="50" rx="46" ry="16" stroke="#0A0D12" stroke-width="1.2" stroke-dasharray="3 3"/>
   <circle cx="50" cy="50" r="36" fill="url(#marsGrad)" stroke="#0A0D12" stroke-width="2.5"/>
   <g clip-path="url(#marsClip)">
    <!-- Polar Ice Cap -->
    <ellipse cx="50" cy="18" rx="14" ry="5.5" fill="#FFFFFF" stroke="#0A0D12" stroke-width="1.5"/>
    <!-- Canyon Valles Marineris -->
    <path d="M 30 46 Q 48 54 68 45" stroke="#7C2D12" stroke-width="3.5" stroke-linecap="round" fill="none"/>
    <path d="M 32 50 Q 50 58 70 49" stroke="#431407" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    <ellipse cx="28" cy="36" rx="6" ry="4.5" fill="#7C2D12" stroke="#0A0D12" stroke-width="1.2"/>
   </g>
   <circle cx="50" cy="50" r="36" stroke="#0A0D12" stroke-width="2.5"/>
   <circle cx="86" cy="46" r="3.5" fill="#FFB224" stroke="#0A0D12" stroke-width="1.2"/>
  </svg>`
 };

 const missionPatches = {
  earth: `<svg width="40" height="46" viewBox="0 0 40 46" fill="none">
   <path d="M 20 2 L 38 8 L 38 30 L 20 44 L 2 30 L 2 8 Z" fill="#FAF9F5" stroke="#0A0D12" stroke-width="2"/>
   <circle cx="20" cy="20" r="9" fill="#E2DFD6" stroke="#0A0D12" stroke-width="1.5"/>
   <text x="20" y="36" fill="#0A0D12" font-size="7" font-family="var(--font-mono)" font-weight="800" text-anchor="middle">MA-01</text>
  </svg>`,
  moon: `<svg width="40" height="46" viewBox="0 0 40 46" fill="none">
   <path d="M 20 2 L 38 8 L 38 30 L 20 44 L 2 30 L 2 8 Z" fill="#FAF9F5" stroke="#0A0D12" stroke-width="2"/>
   <path d="M 16 13 A 8 8 0 0 0 25 24 A 10 10 0 0 1 16 13 Z" fill="#E2DFD6" stroke="#0A0D12" stroke-width="1.5"/>
   <text x="20" y="36" fill="#0A0D12" font-size="7" font-family="var(--font-mono)" font-weight="800" text-anchor="middle">MA-02</text>
  </svg>`,
  mars: `<svg width="40" height="46" viewBox="0 0 40 46" fill="none">
   <path d="M 20 2 L 38 8 L 38 30 L 20 44 L 2 30 L 2 8 Z" fill="#FAF9F5" stroke="#0A0D12" stroke-width="2"/>
   <circle cx="20" cy="18" r="8" fill="#E2DFD6" stroke="#0A0D12" stroke-width="1.5"/>
   <ellipse cx="20" cy="12" rx="4" ry="1.5" fill="#FFFFFF" stroke="#0A0D12" stroke-width="0.8"/>
   <text x="20" y="36" fill="#0A0D12" font-size="7" font-family="var(--font-mono)" font-weight="800" text-anchor="middle">MA-03</text>
  </svg>`
 };

 const reqCriteria = {
  earth: ['SUN-SYNC ORBIT (SSO)', 'OPTICAL + IR SENSORS', 'MIN 3-YR LIFETIME'],
  moon: ['LUNAR POLAR ORBIT', 'RAD SENSOR + ALTIMETER', 'ECLIPSE BATTERY SIZING'],
  mars: ['LOW MARS ORBIT (LMO)', 'DEEP SPACE DISH', 'HIGH-RAD SHIELDING']
 };

 const solarSpecs = {
  earth: '1.00 AU (100%)',
  moon: '1.00 AU (100%)',
  mars: '1.52 AU (43%)'
 };

 const orbitSpecs = {
  earth: 'SSO 600-800 km',
  moon: 'Polar 100 km',
  mars: 'Areocentric LMO'
 };

 const missionIds = ['earth', 'moon', 'mars'];

 grid.innerHTML = missionIds.map(id => {
  const m = MISSIONS[id];
  if (!m) return '';
  const isSelected = state.missionId === m.id;
  const best = state.bestScores[m.id] || 0;
  const effectiveBudget = state.difficulty === 'sandbox' ? 'UNLIMITED' : (state.difficulty === 'hard' ? `$${Math.round(m.budget * 0.9)}M` : `$${m.budget}M`);
  const criteria = reqCriteria[m.id] || ['SCIENCE SENSOR', 'TELEMETRY LINK'];
  const patchSvg = missionPatches[m.id] || '';
  const planetSvg = planetIllustrations[m.id] || '';

  return `
   <div class="console-panel has-corner-ticks mission-card ${isSelected ? 'mission-card-selected' : ''}" data-mission-id="${m.id}" tabindex="0" role="button" aria-pressed="${isSelected}">
    <div class="panel-header-strip">
     <span class="panel-header-title">${m.id === 'earth' ? 'MA-01' : (m.id === 'moon' ? 'MA-02' : 'MA-03')} // ${m.name.toUpperCase()}</span>
     <div style="display:flex; align-items:center; gap:8px;">
      ${isSelected ? '<span class="selected-tag">ACTIVE SELECTION</span>' : ''}
      <span class="status-led ${isSelected ? 'led-amber pulse' : 'led-go'}"></span>
     </div>
    </div>

    <div class="mission-card-top-dossier">
     <div class="mission-patch-slot">${patchSvg}</div>
     <div class="mission-planet-view">${planetSvg}</div>
     <div class="mission-status-pill">
      <span class="text-dim">TARGET:</span>
      <strong style="color:var(--text); font-weight:800;">${m.destination.toUpperCase()}</strong>
     </div>
    </div>

    <div class="mission-card-body">
     <h3 class="mission-codename">${m.name}</h3>
     <p class="mission-obj-text">${m.objective}</p>
    </div>

    <div class="spec-matrix" style="grid-template-columns: repeat(2, 1fr); margin-bottom:12px;">
     <div class="spec-cell"><span class="spec-k">BUDGET CAP</span><span class="spec-v text-amber">${effectiveBudget}</span></div>
     <div class="spec-cell"><span class="spec-k">SOLAR FLUX</span><span class="spec-v">${solarSpecs[m.id]}</span></div>
     <div class="spec-cell"><span class="spec-k">ORBIT PROFILE</span><span class="spec-v">${orbitSpecs[m.id]}</span></div>
     <div class="spec-cell"><span class="spec-k">FLIGHT RECORD</span><span class="spec-v ${best > 0 ? 'text-go' : 'text-dim'}">${best > 0 ? `${best} / 100` : 'NONE'}</span></div>
    </div>

    <div class="mission-req-box">
     <span class="mission-req-label">MANDATORY CRITERIA:</span>
     <div class="mission-req-tags">
      ${criteria.map(c => `<span class="console-tag" style="font-size:0.68rem; padding:2px 6px;">${c}</span>`).join('')}
     </div>
    </div>

    <div class="mission-card-footer">
     <button class="btn ${isSelected ? 'btn-primary' : 'btn-secondary'} select-mission-btn" tabindex="-1">
      ${isSelected ? 'CONFIGURE ARCHITECTURE &rarr;' : 'SELECT TARGET DOSSIER'}
     </button>
    </div>
   </div>
  `;
 }).join('');

 // Update difficulty options buttons & ticker
 const diffDescriptions = {
  easy: 'STANDARD AEROSPACE MARGINS // FULL BUDGET // BENIGN SPACE WEATHER',
  normal: 'REALISTIC NASA FLIGHT RULES // $120M BASE // NOMINAL RADIATION DECAY',
  hard: 'BUDGET CUT (-10%) // ELEVATED RADIATION (+20%) // STRICT PAYLOAD CRITERIA',
  sandbox: 'UNRESTRICTED CAPITAL // ALL SUBSYSTEMS UNLOCKED // EXPERIMENTAL MODE'
 };

 document.querySelectorAll('.diff-btn').forEach(btn => {
  const diff = btn.dataset.diff;
  if (state.difficulty === diff) {
   btn.classList.add('active');
   btn.setAttribute('aria-pressed', 'true');
  } else {
   btn.classList.remove('active');
   btn.setAttribute('aria-pressed', 'false');
  }
 });

 const ticker = document.getElementById('difficulty-description-ticker');
 if (ticker) {
  ticker.textContent = diffDescriptions[state.difficulty] || diffDescriptions.normal;
 }

 const sandboxToggle = document.getElementById('sandbox-checkbox');
 if (sandboxToggle) {
  sandboxToggle.checked = state.difficulty === 'sandbox';
 }
}

function renderBuildScreen(res) {
 const stepItems = document.querySelectorAll('.rail-step-item, .step-item');
 stepItems.forEach((item) => {
  const idx = parseInt(item.dataset.stepIndex, 10);
  item.classList.remove('active', 'completed');
  const led = item.querySelector('.status-led');
  if (idx === state.currentStep) {
   item.classList.add('active');
   item.setAttribute('aria-current', 'step');
   if (led) { led.className = 'status-led led-amber pulse'; }
  } else if (idx < state.currentStep) {
   item.classList.add('completed');
   item.removeAttribute('aria-current');
   if (led) { led.className = 'status-led led-go'; }
  } else {
   item.removeAttribute('aria-current');
   if (led) { led.className = 'status-led'; }
  }
 });

 const contentContainer = document.getElementById('build-step-content');
 if (!contentContainer) return;

 const currentBus = BUSES[state.busId];
 const mission = MISSIONS[state.missionId];

 switch (state.currentStep) {
  case 0:
   contentContainer.innerHTML = `
    <div class="step-header-info has-corner-ticks">
     <div class="panel-header-strip">
      <span class="panel-subsystem-code">SECTION 01 // SPACECRAFT ARCHITECTURE</span>
      <span class="status-led led-amber pulse"></span>
     </div>
     <h2 class="step-headline">Select Spacecraft Bus Chassis</h2>
     <p class="step-subtitle">The bus is the core structural chassis. It dictates base electrical power draw, dry mass, payload bay capacity, and baseline service lifetime.</p>
    </div>
    <div class="cards-grid">
     ${Object.values(BUSES).map(bus => {
      const isSelected = state.busId === bus.id;
      return `
       <div class="card card-interactive has-corner-ticks ${isSelected ? 'card-selected' : ''}" data-select-bus="${bus.id}" tabindex="0" role="radio" aria-checked="${isSelected}">
        <div class="panel-header-strip">
         <span class="panel-subsystem-code">SYS-01 // BUS CHASSIS</span>
         <span class="selected-tag" style="${isSelected ? 'display:inline-flex;' : 'display:none;'}">SELECTED</span>
         <span class="status-led ${isSelected ? 'led-amber pulse' : 'led-go'}"></span>
        </div>
        <div class="card-part-title">
         <h3>${bus.name}</h3>
         <span class="badge badge-amber">$${bus.cost}M</span>
        </div>
        <p class="text-muted" style="font-size:0.86rem; margin: 4px 0 8px;">${bus.desc}</p>
        <div class="spec-matrix">
         <div class="spec-cell"><span class="spec-k">DRY MASS</span><span class="spec-v">${bus.mass} kg</span></div>
         <div class="spec-cell"><span class="spec-k">BASE PWR</span><span class="spec-v">${bus.basePower} W</span></div>
         <div class="spec-cell"><span class="spec-k">PAYLOAD CAP</span><span class="spec-v">${bus.instrMassCap} kg</span></div>
         <div class="spec-cell"><span class="spec-k">LIFETIME</span><span class="spec-v">${bus.lifetimeBase} YR</span></div>
        </div>
       </div>
      `;
     }).join('')}
    </div>
   `;
   break;

  case 1:
   contentContainer.innerHTML = `
    <div class="step-header-info has-corner-ticks">
     <div class="panel-header-strip">
      <span class="panel-subsystem-code">SECTION 02 // POWER GENERATION & COMMUNICATIONS</span>
      <span class="status-led led-amber pulse"></span>
     </div>
     <h2 class="step-headline">Solar Arrays, Energy Storage & Comms Link</h2>
     <p class="step-subtitle">Balance electrical power generation for orbital eclipse shadow cycles and size your Earth communications downlink pipeline.</p>
    </div>
    
    <h4 style="margin: var(--space-4) 0 var(--space-2); letter-spacing:0.06em;">01 // SOLAR POWER ARRAYS</h4>
    <div class="cards-grid">
     ${Object.values(SOLAR_PANELS).map(p => {
      const isSelected = state.panelId === p.id;
      return `
       <div class="card card-interactive has-corner-ticks ${isSelected ? 'card-selected' : ''}" data-select-panel="${p.id}" tabindex="0" role="radio" aria-checked="${isSelected}">
        <div class="panel-header-strip">
         <span class="panel-subsystem-code">SYS-02 // SOLAR ARRAY</span>
         <span class="selected-tag" style="${isSelected ? 'display:inline-flex;' : 'display:none;'}">SELECTED</span>
         <span class="status-led ${isSelected ? 'led-amber pulse' : 'led-go'}"></span>
        </div>
        <div class="card-part-title">
         <h4>${p.name}</h4>
         <span class="badge badge-amber">$${p.cost}M</span>
        </div>
        <p class="text-muted" style="font-size:0.84rem; margin: 4px 0 8px;">${p.desc}</p>
        <div class="spec-matrix">
         <div class="spec-cell"><span class="spec-k">POWER</span><span class="spec-v" style="color:var(--go);">+${p.watts} W</span></div>
         <div class="spec-cell"><span class="spec-k">MASS</span><span class="spec-v">${p.mass} kg</span></div>
         <div class="spec-cell"><span class="spec-k">COST</span><span class="spec-v">$${p.cost}M</span></div>
         <div class="spec-cell"><span class="spec-k">TYPE</span><span class="spec-v">${p.id === 'rtg' ? 'NUCLEAR' : 'PV'}</span></div>
        </div>
       </div>
      `;
     }).join('')}
    </div>

    <h4 style="margin: var(--space-5) 0 var(--space-2); letter-spacing:0.06em;">02 // BATTERY ENERGY STORAGE</h4>
    <div class="cards-grid">
     ${Object.values(BATTERIES).map(b => {
      const isSelected = state.batteryId === b.id;
      return `
       <div class="card card-interactive has-corner-ticks ${isSelected ? 'card-selected' : ''}" data-select-battery="${b.id}" tabindex="0" role="radio" aria-checked="${isSelected}">
        <div class="panel-header-strip">
         <span class="panel-subsystem-code">SYS-02 // STORAGE</span>
         <span class="selected-tag" style="${isSelected ? 'display:inline-flex;' : 'display:none;'}">SELECTED</span>
         <span class="status-led ${isSelected ? 'led-amber pulse' : 'led-go'}"></span>
        </div>
        <div class="card-part-title">
         <h4>${b.name}</h4>
         <span class="badge ${b.cost === 0 ? '' : 'badge-amber'}">${b.cost === 0 ? 'FREE' : '$' + b.cost + 'M'}</span>
        </div>
        <p class="text-muted" style="font-size:0.84rem; margin: 4px 0 8px;">${b.desc}</p>
        <div class="spec-matrix">
         <div class="spec-cell"><span class="spec-k">MASS</span><span class="spec-v">${b.mass} kg</span></div>
         <div class="spec-cell"><span class="spec-k">LIFE</span><span class="spec-v">+${b.lifetimeBonus} YR</span></div>
         <div class="spec-cell"><span class="spec-k">COST</span><span class="spec-v">$${b.cost}M</span></div>
         <div class="spec-cell"><span class="spec-k">ECLIPSE</span><span class="spec-v" style="color:${b.coversEclipse ? 'var(--go)' : 'var(--nogo)'};">${b.coversEclipse ? 'COVERED' : 'NONE'}</span></div>
        </div>
       </div>
      `;
     }).join('')}
    </div>

    <h4 style="margin: var(--space-5) 0 var(--space-2); letter-spacing:0.06em;">03 // COMMUNICATIONS ANTENNA</h4>
    <div class="cards-grid">
     ${Object.values(ANTENNAS).map(a => {
      const isSelected = state.antennaId === a.id;
      return `
       <div class="card card-interactive has-corner-ticks ${isSelected ? 'card-selected' : ''}" data-select-antenna="${a.id}" tabindex="0" role="radio" aria-checked="${isSelected}">
        <div class="panel-header-strip">
         <span class="panel-subsystem-code">SYS-02 // COMMS LINK</span>
         <span class="selected-tag" style="${isSelected ? 'display:inline-flex;' : 'display:none;'}">SELECTED</span>
         <span class="status-led ${isSelected ? 'led-amber pulse' : 'led-go'}"></span>
        </div>
        <div class="card-part-title">
         <h4>${a.name}</h4>
         <span class="badge badge-amber">$${a.cost}M</span>
        </div>
        <p class="text-muted" style="font-size:0.84rem; margin: 4px 0 8px;">${a.desc}</p>
        <div class="spec-matrix">
         <div class="spec-cell"><span class="spec-k">DOWNLINK</span><span class="spec-v" style="color:var(--cyan);">${a.rate} Gb/h</span></div>
         <div class="spec-cell"><span class="spec-k">PWR DRAW</span><span class="spec-v">${a.power} W</span></div>
         <div class="spec-cell"><span class="spec-k">MASS</span><span class="spec-v">${a.mass} kg</span></div>
         <div class="spec-cell"><span class="spec-k">COST</span><span class="spec-v">$${a.cost}M</span></div>
        </div>
       </div>
      `;
     }).join('')}
    </div>
   `;
   break;

  case 2:
   const curInstrCount = (state.instrumentIds || []).length;
   const maxSlots = currentBus ? currentBus.instrumentSlots : 2;
   const slotsLeft = maxSlots - curInstrCount;

   contentContainer.innerHTML = `
    <div class="step-header-info has-corner-ticks">
     <div class="panel-header-strip">
      <span class="panel-subsystem-code">SECTION 03 // SCIENTIFIC SENSORS & AVIONICS</span>
      <span class="status-led ${slotsLeft >= 0 ? 'led-go' : 'led-nogo'}"></span>
     </div>
     <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <div>
       <h2 class="step-headline">Scientific Payload & Redundant Extras</h2>
       <p class="step-subtitle">Mount observation sensors to achieve primary mission science thresholds without overflowing payload bay mass or electrical limits.</p>
      </div>
      <div class="badge ${slotsLeft >= 0 ? 'badge-cyan' : 'status-chip nogo'}" style="font-size:0.82rem; padding:4px 8px;">
       PAYLOAD SLOTS: ${curInstrCount} / ${maxSlots} USED
      </div>
     </div>
    </div>

    <h4 style="margin: var(--space-4) 0 var(--space-2); letter-spacing:0.06em;">01 // SCIENCE OBSERVATION SENSORS</h4>
    <div class="cards-grid">
     ${Object.values(INSTRUMENTS).map(inst => {
      const isSelected = (state.instrumentIds || []).includes(inst.id);
      const isReq = (mission.reqs.requiredInstruments || []).includes(inst.id);
      return `
       <div class="card card-interactive has-corner-ticks ${isSelected ? 'card-selected' : ''}" data-toggle-instrument="${inst.id}" tabindex="0" role="checkbox" aria-checked="${isSelected}">
        <div class="panel-header-strip">
         <span class="panel-subsystem-code">SYS-03 // SENSOR</span>
         <span class="selected-tag" style="${isSelected ? 'display:inline-flex;' : 'display:none;'}">MOUNTED</span>
         <span class="status-led ${isSelected ? 'led-amber pulse' : 'led-go'}"></span>
        </div>
        <div class="card-part-title">
         <div style="display:flex; align-items:center; gap:6px;">
          <h4>${inst.name}</h4>
          ${isReq ? '<span class="status-chip ok" style="font-size:0.65rem; padding:1px 4px;">REQ</span>' : ''}
         </div>
         <span class="badge badge-amber">$${inst.cost}M</span>
        </div>
        <p class="text-muted" style="font-size:0.84rem; margin: 4px 0 8px;">${inst.desc}</p>
        <div class="spec-matrix">
         <div class="spec-cell"><span class="spec-k">MASS</span><span class="spec-v">${inst.mass} kg</span></div>
         <div class="spec-cell"><span class="spec-k">PWR DRAW</span><span class="spec-v">${inst.power} W</span></div>
         <div class="spec-cell"><span class="spec-k">DATA RATE</span><span class="spec-v" style="color:var(--cyan);">${inst.dataRate} Gb/d</span></div>
         <div class="spec-cell"><span class="spec-k">SCI VALUE</span><span class="spec-v" style="color:var(--go);">${inst.scienceValue} PTS</span></div>
        </div>
       </div>
      `;
     }).join('')}
    </div>

    <h4 style="margin: var(--space-5) 0 var(--space-2); letter-spacing:0.06em;">02 // MISSION AVIONICS & RELIABILITY EXTRAS</h4>
    <div class="cards-grid">
     ${Object.values(EXTRAS).map(ext => {
      const isSelected = (state.extraIds || []).includes(ext.id);
      return `
       <div class="card card-interactive has-corner-ticks ${isSelected ? 'card-selected' : ''}" data-toggle-extra="${ext.id}" tabindex="0" role="checkbox" aria-checked="${isSelected}">
        <div class="panel-header-strip">
         <span class="panel-subsystem-code">SYS-03 // AVIONICS</span>
         <span class="selected-tag" style="${isSelected ? 'display:inline-flex;' : 'display:none;'}">EQUIPPED</span>
         <span class="status-led ${isSelected ? 'led-amber pulse' : 'led-go'}"></span>
        </div>
        <div class="card-part-title">
         <h4>${ext.name}</h4>
         <span class="badge badge-amber">$${ext.cost}M</span>
        </div>
        <p class="text-muted" style="font-size:0.84rem; margin: 4px 0 8px;">${ext.desc}</p>
        <div class="spec-matrix">
         <div class="spec-cell"><span class="spec-k">MASS</span><span class="spec-v">${ext.mass} kg</span></div>
         <div class="spec-cell"><span class="spec-k">PWR DRAW</span><span class="spec-v">${ext.power} W</span></div>
         <div class="spec-cell"><span class="spec-k">COST</span><span class="spec-v">$${ext.cost}M</span></div>
         <div class="spec-cell"><span class="spec-k">RELIAB</span><span class="spec-v" style="color:var(--go);">+BONUS</span></div>
        </div>
       </div>
      `;
     }).join('')}
    </div>
   `;
   break;

  case 3:
   const destOrbits = ORBITS[mission.destKey] || {};
   contentContainer.innerHTML = `
    <div class="step-header-info has-corner-ticks">
     <div class="panel-header-strip">
      <span class="panel-subsystem-code">SECTION 04 // LAUNCH SYSTEM & ORBITAL TRAJECTORY</span>
      <span class="status-led led-amber pulse"></span>
     </div>
     <h2 class="step-headline">Launch Vehicle & Mission Operational Orbit</h2>
     <p class="step-subtitle">Your launcher must possess sufficient lift capacity for your total spacecraft wet mass at the destination planetary gravitational well (${mission.name}).</p>
    </div>

    <h4 style="margin: var(--space-4) 0 var(--space-2); letter-spacing:0.06em;">01 // LAUNCH VEHICLE</h4>
    <div class="cards-grid">
     ${Object.values(LAUNCHERS).map(lnch => {
      const isSelected = state.launcherId === lnch.id;
      const cap = lnch.capacity[mission.destKey];
      const cannotReach = cap === null;
      return `
       <div class="card card-interactive has-corner-ticks ${isSelected ? 'card-selected' : ''} ${cannotReach ? 'card-disabled' : ''}" data-select-launcher="${lnch.id}" tabindex="0" role="radio" aria-checked="${isSelected}">
        <div class="panel-header-strip">
         <span class="panel-subsystem-code">SYS-04 // LAUNCH VEHICLE</span>
         <span class="selected-tag" style="${isSelected ? 'display:inline-flex;' : 'display:none;'}">ASSIGNED</span>
         <span class="status-led ${cannotReach ? 'led-nogo' : (isSelected ? 'led-amber pulse' : 'led-go')}"></span>
        </div>
        <div class="card-part-title">
         <h4>${lnch.name}</h4>
         <span class="badge badge-amber">$${lnch.cost}M</span>
        </div>
        <p class="text-muted" style="font-size:0.86rem; margin: 4px 0 8px;">${lnch.desc}</p>
        <div class="spec-matrix">
         <div class="spec-cell"><span class="spec-k">DEST CAP</span><span class="spec-v" style="color:${cannotReach ? 'var(--nogo)' : 'var(--go)'}; font-weight:800;">${cannotReach ? 'NO REACH' : cap + ' kg'}</span></div>
         <div class="spec-cell"><span class="spec-k">COST</span><span class="spec-v">$${lnch.cost}M</span></div>
         <div class="spec-cell"><span class="spec-k">DESTINATION</span><span class="spec-v">${mission.destKey.toUpperCase()}</span></div>
         <div class="spec-cell"><span class="spec-k">FLIGHT STATUS</span><span class="spec-v" style="color:${cannotReach ? 'var(--nogo)' : 'var(--go)'}; font-weight:800;">${cannotReach ? 'INSUF Δv' : 'FLIGHT GO'}</span></div>
        </div>
       </div>
      `;
     }).join('')}
    </div>

    <h4 style="margin: var(--space-5) 0 var(--space-2); letter-spacing:0.06em;">02 // TARGET OPERATIONAL ORBIT</h4>
    <div class="cards-grid">
     ${Object.values(destOrbits).map(orb => {
      const isSelected = state.orbitId === orb.id;
      return `
       <div class="card card-interactive has-corner-ticks ${isSelected ? 'card-selected' : ''}" data-select-orbit="${orb.id}" tabindex="0" role="radio" aria-checked="${isSelected}">
        <div class="panel-header-strip">
         <span class="panel-subsystem-code">SYS-04 // TRAJECTORY</span>
         <span class="selected-tag" style="${isSelected ? 'display:inline-flex;' : 'display:none;'}">LOCKED</span>
         <span class="status-led ${isSelected ? 'led-amber pulse' : 'led-go'}"></span>
        </div>
        <div class="card-part-title">
         <h4>${orb.name}</h4>
         <span class="badge">${Math.round(orb.coverage * 100)}% COV</span>
        </div>
        <p class="text-muted" style="font-size:0.86rem; margin: 4px 0 8px;">${orb.note}</p>
        <div class="spec-matrix">
         <div class="spec-cell"><span class="spec-k">SUNLIGHT</span><span class="spec-v">${Math.round(orb.sunFraction * 100)}%</span></div>
         <div class="spec-cell"><span class="spec-k">CONTACT</span><span class="spec-v">${orb.contactHours} h/d</span></div>
         <div class="spec-cell"><span class="spec-k">COVERAGE</span><span class="spec-v">${Math.round(orb.coverage * 100)}%</span></div>
         <div class="spec-cell"><span class="spec-k">MASS MULT</span><span class="spec-v">${orb.massMult}x</span></div>
        </div>
       </div>
      `;
     }).join('')}
    </div>
   `;
   break;

  case 4:
   const isTeam = state.isTeamMode && teamState.players.length > 0;
   let teamApprovalHtml = '';
   let allTeamApproved = true;

   if (isTeam) {
    allTeamApproved = teamState.players.every((p, idx) => teamState.approvalVotes[idx] && teamState.approvalVotes[idx].approved);
    const approvedCount = teamState.players.filter((p, idx) => teamState.approvalVotes[idx] && teamState.approvalVotes[idx].approved).length;
    const consensusPct = Math.round((approvedCount / teamState.players.length) * 100);
    const activeIdx = state.activePlayerIndex || 0;
    const activePlayer = teamState.players[activeIdx] || teamState.players[0];
    const hasVoted = Boolean(teamState.approvalVotes[activeIdx] && teamState.approvalVotes[activeIdx].approved);

    teamApprovalHtml = `
     <div class="card has-corner-ticks" style="border:1px solid var(--line-strong); background:var(--panel-2); margin-bottom:var(--space-4);">
      <div class="panel-header-strip">
       <span class="panel-subsystem-code">CREW CONSENSUS // FLIGHT READINESS SIGN-OFF</span>
       <span class="status-chip ${allTeamApproved ? 'ok' : 'tight'}">
        ${allTeamApproved ? 'ALL CREW SIGNED' : 'APPROVAL PENDING'}
       </span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-3); flex-wrap:wrap; gap:var(--space-2);">
       <div>
        <h3 style="color:#FFF;">Flight Readiness Consensus</h3>
        <div class="label-mono" style="margin-top:2px; color:var(--muted);">
         Consensus: <strong style="color:var(--text-bright);">${approvedCount} / ${teamState.players.length} Crew Signed (${consensusPct}%)</strong>
        </div>
       </div>
       <button class="btn btn-secondary btn-sm" id="team-vote-approve-all-btn" style="border-color:var(--go); color:var(--go);">
        Sign All Crew (Override)
       </button>
      </div>

      <!-- Consensus Progress Bar -->
      <div style="width:100%; height:6px; background:var(--panel-3); border-radius:2px; overflow:hidden; margin-bottom:var(--space-4);">
       <div style="width:${consensusPct}%; height:100%; background:var(--go); transition:width 300ms ease-out;"></div>
      </div>

      <!-- Crew Roster Status Grid -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:var(--space-3); margin-bottom:var(--space-4);">
       ${teamState.players.map((p, idx) => {
        const vote = teamState.approvalVotes[idx];
        const isApproved = vote && vote.approved;
        const isChange = vote && !vote.approved;
        return `
         <div style="background:var(--panel); border:1px solid ${isApproved ? 'var(--go)' : (isChange ? 'var(--amber)' : 'var(--line)')}; border-radius:var(--radius-sm); padding:var(--space-3);">
          <div style="display:flex; justify-content:space-between; align-items:center;">
           <strong style="color:var(--text-bright); font-size:0.92rem;">${p.name}</strong>
           <span class="status-chip ${isApproved ? 'ok' : (isChange ? 'warn' : 'tight')}" style="font-size:0.68rem;">
            ${isApproved ? 'SIGNED' : (isChange ? 'CHANGE' : 'PENDING')}
           </span>
          </div>
          <div class="label-mono" style="font-size:0.72rem; margin-top:2px;">${p.roleName}</div>
          ${vote && vote.reason ? `<div style="font-size:0.75rem; color:var(--amber); margin-top:4px;">"${vote.reason}"</div>` : ''}
         </div>
        `;
       }).join('')}
      </div>

      <!-- Active Voter Controls -->
      <div style="border-top:1px solid var(--line); padding-top:var(--space-3); display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:var(--space-2);">
       <div style="display:flex; align-items:center; gap:8px;">
        <span class="label-mono">Active Station:</span>
        <select id="team-active-voter-select" style="background:var(--panel-3); color:var(--text-bright); border:1px solid var(--line); border-radius:var(--radius-sm); padding:4px 8px; font-family:var(--font-mono); font-size:0.82rem; cursor:pointer;">
         ${teamState.players.map((p, idx) => `
          <option value="${idx}" ${idx === activeIdx ? 'selected' : ''}>${p.name} (${p.roleName})</option>
         `).join('')}
        </select>
       </div>
       <div style="display:flex; gap:8px;">
        <button class="btn btn-secondary btn-sm" id="team-vote-approve-btn" ${hasVoted ? 'disabled' : ''} style="color:var(--go); border-color:var(--go);">
         ✓ Sign Off Flight
        </button>
        <button class="btn btn-secondary btn-sm" id="team-vote-request-btn" style="color:var(--amber); border-color:var(--amber);">
         Request Adjustments
        </button>
       </div>
      </div>
     </div>
    `;
   }

   contentContainer.innerHTML = `
    <div class="step-header-info has-corner-ticks">
     <div class="panel-header-strip">
      <span class="panel-subsystem-code">SECTION 05 // PRE-FLIGHT INTEGRATION AUDIT</span>
      <span class="status-led ${res.canLaunch && allTeamApproved ? 'led-go' : 'led-nogo'}"></span>
     </div>
     <h2 class="step-headline">Pre-Flight Review & Launch Authorization</h2>
     <p class="step-subtitle">All engineering constraints, budget allocations, payload bay limits, and flight readiness criteria must report GO before ignition sequence authorization.</p>
    </div>

    ${teamApprovalHtml}

    <div class="review-grid-two-col" style="margin-top:var(--space-4);">
     <div class="card has-corner-ticks">
      <div class="panel-header-strip">
       <span class="panel-subsystem-code">CHK-01 // FLIGHT CONSTRAINTS CHECKLIST</span>
       <span class="status-led ${res.canLaunch ? 'led-go' : 'led-nogo'}"></span>
      </div>
      <div class="checklist-container" id="review-checklist-container">
       <!-- 4 Station Cards populated by renderReviewScreen -->
      </div>
     </div>

     <div class="card has-corner-ticks">
      <div class="panel-header-strip">
       <span class="panel-subsystem-code">CFG-01 // ASSEMBLED FLIGHT HARDWARE</span>
       <span class="status-led led-go"></span>
      </div>
      <div id="review-specs-container">
       <!-- Assembled Hardware Manifest populated by renderReviewScreen -->
      </div>
     </div>
    </div>

    <!-- Full-width Consensus Terminal Feed spanning below both CHK-01 and CFG-01 -->
    <div id="review-feed-container" style="margin-top:var(--space-4);"></div>

    <div id="review-launch-fails-box" style="margin-top:var(--space-4);"></div>

    <div style="margin-top:var(--space-5); text-align:center;">
     <button class="btn btn-primary btn-lg" id="review-launch-btn" ${res.canLaunch && allTeamApproved ? '' : 'disabled'} style="min-height:56px; padding: 0 40px; font-size:1.15rem;">
      ${res.canLaunch && allTeamApproved ? 'AUTHORIZE LAUNCH SEQUENCE &rarr;' : 'LAUNCH INTERLOCK ACTIVE (RESOLVE NO-GO ITEMS)'}
     </button>
    </div>
   `;

   renderReviewScreen(res);
   break;
 }
}


function updateStepperNavButtons(res) {
 const backBtn = document.getElementById('build-back-btn');
 const nextBtn = document.getElementById('build-next-btn');
 if (!nextBtn) return;

 if (state.currentStep === 0) {
  if (backBtn) backBtn.textContent = 'Change Mission';
  nextBtn.disabled = !state.busId;
  nextBtn.title = !state.busId ? 'Select a spacecraft bus to proceed' : '';
 } else if (state.currentStep === 1) {
  if (backBtn) backBtn.textContent = 'Back';
  const valid = Boolean(state.panelId && state.antennaId);
  nextBtn.disabled = !valid;
  nextBtn.title = !valid ? 'Select a solar panel and antenna to proceed' : '';
 } else if (state.currentStep === 2) {
  if (backBtn) backBtn.textContent = 'Back';
  const valid = state.instrumentIds.length >= 1;
  nextBtn.disabled = !valid;
  nextBtn.title = !valid ? 'Select at least one scientific instrument' : '';
 } else if (state.currentStep === 3) {
  if (backBtn) backBtn.textContent = 'Back';
  const valid = Boolean(state.launcherId && state.orbitId);
  nextBtn.disabled = !valid;
  nextBtn.title = !valid ? 'Select a launcher and orbit to proceed' : '';
  nextBtn.style.display = 'inline-flex';
 } else if (state.currentStep === 4) {
  if (backBtn) backBtn.textContent = 'Back';
  nextBtn.style.display = 'none'; // Launch button is inside review step
 }
}


/**
 * Generates an SVG illustration of the assembled spacecraft based on current selections.
 */
﻿function generateSpacecraftPreviewSVG(state) {
 const bus = BUSES[state.busId] || BUSES.small;
 const panel = SOLAR_PANELS[state.panelId] || SOLAR_PANELS.medium;
 const antenna = ANTENNAS[state.antennaId] || ANTENNAS.dish_small;
 const instruments = (state.instrumentIds || []).map(id => INSTRUMENTS[id]).filter(Boolean);

 let busW = 76;
 let busH = 86;
 let spanText = '2.40 m';
 let htText = '1.65 m';
 let busX = (340 - busW) / 2;
 let busY = 65;

 if (state.busId === 'cube') {
  busW = 52;
  busH = 52;
  spanText = '1.10 m';
  htText = '0.90 m';
  busX = (340 - busW) / 2;
  busY = 75;
 } else if (state.busId === 'heavy') {
  busW = 96;
  busH = 96;
  spanText = '3.80 m';
  htText = '2.20 m';
  busX = (340 - busW) / 2;
  busY = 60;
 }

 // Solar Arrays (Retro Technical Monochrome Lines)
 let solarHtml = '';
 if (state.panelId === 'rtg') {
  solarHtml = `
   <g transform="translate(${busX - 30}, ${busY + busH/2 - 16})">
    <rect x="0" y="0" width="24" height="32" rx="2" fill="#FAF9F5" stroke="#0A0D12" stroke-width="2"/>
    <line x1="0" y1="8" x2="24" y2="8" stroke="#0A0D12" stroke-width="1.2"/>
    <line x1="0" y1="16" x2="24" y2="16" stroke="#0A0D12" stroke-width="1.2"/>
    <line x1="0" y1="24" x2="24" y2="24" stroke="#0A0D12" stroke-width="1.2"/>
    <circle cx="12" cy="16" r="3.5" fill="#FFB224" stroke="#0A0D12" stroke-width="1"/>
   </g>
   <!-- Callout Line -->
   <polyline points="${busX - 30},${busY + busH/2} ${busX - 55},${busY + busH/2} ${busX - 70},${busY + busH/2 - 20}" stroke="#0A0D12" stroke-width="1.2" stroke-dasharray="2 2"/>
   <circle cx="${busX - 30}" cy="${busY + busH/2}" r="2" fill="#0A0D12"/>
   <text x="${busX - 74}" y="${busY + busH/2 - 24}" fill="#0A0D12" font-size="8.5" font-weight="700" font-family="var(--font-mono)" text-anchor="end">PWR-01 // RTG UNIT</text>
  `;
 } else if (state.panelId === 'small') {
  solarHtml = `
   <!-- Left Array -->
   <g transform="translate(${busX - 64}, ${busY + busH/2 - 20})">
    <rect x="0" y="0" width="56" height="40" rx="2" fill="#FAF9F5" stroke="#0A0D12" stroke-width="2"/>
    <line x1="28" y1="0" x2="28" y2="40" stroke="#0A0D12" stroke-width="1.2"/>
    <line x1="0" y1="20" x2="56" y2="20" stroke="#0A0D12" stroke-width="1.2"/>
    <!-- Golden Solar Accents -->
    <rect x="4" y="4" width="20" height="12" fill="#FFB224" fill-opacity="0.25"/>
    <rect x="32" y="24" width="20" height="12" fill="#FFB224" fill-opacity="0.25"/>
    <line x1="56" y1="20" x2="64" y2="20" stroke="#0A0D12" stroke-width="2.5"/>
   </g>
   <!-- Right Array -->
   <g transform="translate(${busX + busW + 8}, ${busY + busH/2 - 20})">
    <line x1="0" y1="20" x2="8" y2="20" stroke="#0A0D12" stroke-width="2.5"/>
    <rect x="8" y="0" width="56" height="40" rx="2" fill="#FAF9F5" stroke="#0A0D12" stroke-width="2"/>
    <line x1="36" y1="0" x2="36" y2="40" stroke="#0A0D12" stroke-width="1.2"/>
    <line x1="8" y1="20" x2="64" y2="20" stroke="#0A0D12" stroke-width="1.2"/>
    <rect x="12" y="4" width="20" height="12" fill="#FFB224" fill-opacity="0.25"/>
    <rect x="40" y="24" width="20" height="12" fill="#FFB224" fill-opacity="0.25"/>
   </g>
   <!-- Callout Leader -->
   <polyline points="${busX - 64},${busY + busH/2} ${busX - 85},${busY + busH/2} ${busX - 95},${busY + busH/2 - 24}" stroke="#0A0D12" stroke-width="1.2" stroke-dasharray="2 2"/>
   <circle cx="${busX - 64}" cy="${busY + busH/2}" r="2" fill="#0A0D12"/>
   <text x="${busX - 98}" y="${busY + busH/2 - 28}" fill="#0A0D12" font-size="8.5" font-weight="700" font-family="var(--font-mono)" text-anchor="end">PWR-01 // 60W ARRAY</text>
  `;
 } else if (state.panelId === 'medium') {
  solarHtml = `
   <!-- Left Wing -->
   <g transform="translate(${busX - 94}, ${busY + busH/2 - 26})">
    <rect x="0" y="0" width="86" height="52" rx="2" fill="#FAF9F5" stroke="#0A0D12" stroke-width="2"/>
    <line x1="28" y1="0" x2="28" y2="52" stroke="#0A0D12" stroke-width="1.2"/>
    <line x1="57" y1="0" x2="57" y2="52" stroke="#0A0D12" stroke-width="1.2"/>
    <line x1="0" y1="26" x2="86" y2="26" stroke="#0A0D12" stroke-width="1.2"/>
    <!-- Golden solar cell highlights -->
    <rect x="4" y="4" width="20" height="18" fill="#FFB224" fill-opacity="0.3"/>
    <rect x="32" y="28" width="21" height="18" fill="#FFB224" fill-opacity="0.3"/>
    <line x1="86" y1="26" x2="94" y2="26" stroke="#0A0D12" stroke-width="2.5"/>
   </g>
   <!-- Right Wing -->
   <g transform="translate(${busX + busW + 8}, ${busY + busH/2 - 26})">
    <line x1="0" y1="26" x2="8" y2="26" stroke="#0A0D12" stroke-width="2.5"/>
    <rect x="8" y="0" width="86" height="52" rx="2" fill="#FAF9F5" stroke="#0A0D12" stroke-width="2"/>
    <line x1="36" y1="0" x2="36" y2="52" stroke="#0A0D12" stroke-width="1.2"/>
    <line x1="65" y1="0" x2="65" y2="52" stroke="#0A0D12" stroke-width="1.2"/>
    <line x1="8" y1="26" x2="94" y2="26" stroke="#0A0D12" stroke-width="1.2"/>
    <rect x="12" y="4" width="20" height="18" fill="#FFB224" fill-opacity="0.3"/>
    <rect x="40" y="28" width="21" height="18" fill="#FFB224" fill-opacity="0.3"/>
   </g>
   <!-- Callout Leader -->
   <polyline points="${busX - 94},${busY + busH/2} ${busX - 105},${busY + busH/2} ${busX - 110},${busY + busH/2 - 24}" stroke="#0A0D12" stroke-width="1.2" stroke-dasharray="2 2"/>
   <circle cx="${busX - 94}" cy="${busY + busH/2}" r="2" fill="#0A0D12"/>
   <text x="${busX - 114}" y="${busY + busH/2 - 28}" fill="#0A0D12" font-size="8.5" font-weight="700" font-family="var(--font-mono)" text-anchor="end">PWR-01 // 250W WINGS</text>
  `;
 } else {
  // Large 900W Arrays
  solarHtml = `
   <!-- Left Double Wing -->
   <g transform="translate(${busX - 122}, ${busY + busH/2 - 32})">
    <rect x="0" y="0" width="114" height="64" rx="2" fill="#FAF9F5" stroke="#0A0D12" stroke-width="2"/>
    <line x1="38" y1="0" x2="38" y2="64" stroke="#0A0D12" stroke-width="1.2"/>
    <line x1="76" y1="0" x2="76" y2="64" stroke="#0A0D12" stroke-width="1.2"/>
    <line x1="0" y1="32" x2="114" y2="32" stroke="#0A0D12" stroke-width="1.2"/>
    <rect x="4" y="4" width="30" height="24" fill="#FFB224" fill-opacity="0.3"/>
    <rect x="42" y="36" width="30" height="24" fill="#FFB224" fill-opacity="0.3"/>
    <line x1="114" y1="32" x2="122" y2="32" stroke="#0A0D12" stroke-width="2.5"/>
   </g>
   <!-- Right Double Wing -->
   <g transform="translate(${busX + busW + 8}, ${busY + busH/2 - 32})">
    <line x1="0" y1="32" x2="8" y2="32" stroke="#0A0D12" stroke-width="2.5"/>
    <rect x="8" y="0" width="114" height="64" rx="2" fill="#FAF9F5" stroke="#0A0D12" stroke-width="2"/>
    <line x1="46" y1="0" x2="46" y2="64" stroke="#0A0D12" stroke-width="1.2"/>
    <line x1="84" y1="0" x2="84" y2="64" stroke="#0A0D12" stroke-width="1.2"/>
    <line x1="8" y1="32" x2="122" y2="32" stroke="#0A0D12" stroke-width="1.2"/>
    <rect x="12" y="4" width="30" height="24" fill="#FFB224" fill-opacity="0.3"/>
    <rect x="50" y="36" width="30" height="24" fill="#FFB224" fill-opacity="0.3"/>
   </g>
   <!-- Callout Leader -->
   <polyline points="${busX - 122},${busY + busH/2} ${busX - 130},${busY + busH/2} ${busX - 135},${busY + busH/2 - 24}" stroke="#0A0D12" stroke-width="1.2" stroke-dasharray="2 2"/>
   <circle cx="${busX - 122}" cy="${busY + busH/2}" r="2" fill="#0A0D12"/>
   <text x="${busX - 138}" y="${busY + busH/2 - 28}" fill="#0A0D12" font-size="8.5" font-weight="700" font-family="var(--font-mono)" text-anchor="end">PWR-01 // 900W HEAVY</text>
  `;
 }

 // Antenna Atop Bus
 let antennaHtml = '';
 if (state.antennaId === 'low' || state.antennaId === 'omni') {
  antennaHtml = `
   <g transform="translate(${busX + busW/2}, ${busY - 22})">
    <line x1="0" y1="22" x2="0" y2="0" stroke="#0A0D12" stroke-width="2"/>
    <circle cx="0" cy="0" r="3" fill="#FFB224" stroke="#0A0D12" stroke-width="1.2"/>
    <path d="M-8 -6 Q0 -12 8 -6" fill="none" stroke="#0A0D12" stroke-width="1.2" stroke-dasharray="2 2"/>
   </g>
   <polyline points="${busX + busW/2},${busY - 22} ${busX + busW/2 + 25},${busY - 35} ${busX + busW/2 + 75},${busY - 35}" stroke="#0A0D12" stroke-width="1.2" stroke-dasharray="2 2"/>
   <circle cx="${busX + busW/2}" cy="${busY - 22}" r="2" fill="#0A0D12"/>
   <text x="${busX + busW/2 + 78}" y="${busY - 32}" fill="#0A0D12" font-size="8.5" font-weight="700" font-family="var(--font-mono)">ANT-01 // OMNI WHIP</text>
  `;
 } else if (state.antennaId === 'patch') {
  antennaHtml = `
   <g transform="translate(${busX + busW/2 - 14}, ${busY - 12})">
    <rect x="0" y="0" width="28" height="10" rx="1" fill="#FAF9F5" stroke="#0A0D12" stroke-width="1.8"/>
    <line x1="9" y1="0" x2="9" y2="10" stroke="#0A0D12" stroke-width="1"/>
    <line x1="19" y1="0" x2="19" y2="10" stroke="#0A0D12" stroke-width="1"/>
   </g>
   <polyline points="${busX + busW/2},${busY - 12} ${busX + busW/2 + 25},${busY - 28} ${busX + busW/2 + 75},${busY - 28}" stroke="#0A0D12" stroke-width="1.2" stroke-dasharray="2 2"/>
   <circle cx="${busX + busW/2}" cy="${busY - 12}" r="2" fill="#0A0D12"/>
   <text x="${busX + busW/2 + 78}" y="${busY - 25}" fill="#0A0D12" font-size="8.5" font-weight="700" font-family="var(--font-mono)">ANT-01 // PHASED PATCH</text>
  `;
 } else if (state.antennaId === 'med' || state.antennaId === 'dish_small') {
  antennaHtml = `
   <g transform="translate(${busX + busW/2}, ${busY - 24})">
    <line x1="0" y1="24" x2="0" y2="10" stroke="#0A0D12" stroke-width="2"/>
    <path d="M-18 10 Q0 -2 18 10 Z" fill="#FAF9F5" stroke="#0A0D12" stroke-width="2"/>
    <line x1="0" y1="4" x2="0" y2="-4" stroke="#0A0D12" stroke-width="1.5"/>
    <circle cx="0" cy="-4" r="2.5" fill="#FFB224" stroke="#0A0D12" stroke-width="1"/>
   </g>
   <polyline points="${busX + busW/2},${busY - 24} ${busX + busW/2 + 25},${busY - 38} ${busX + busW/2 + 80},${busY - 38}" stroke="#0A0D12" stroke-width="1.2" stroke-dasharray="2 2"/>
   <circle cx="${busX + busW/2}" cy="${busY - 24}" r="2" fill="#0A0D12"/>
   <text x="${busX + busW/2 + 83}" y="${busY - 35}" fill="#0A0D12" font-size="8.5" font-weight="700" font-family="var(--font-mono)">ANT-02 // 0.75m DISH</text>
  `;
 } else {
  antennaHtml = `
   <g transform="translate(${busX + busW/2}, ${busY - 32})">
    <line x1="0" y1="32" x2="0" y2="14" stroke="#0A0D12" stroke-width="2.5"/>
    <path d="M-28 14 Q0 -4 28 14 Z" fill="#FAF9F5" stroke="#0A0D12" stroke-width="2.2"/>
    <line x1="0" y1="5" x2="0" y2="-6" stroke="#0A0D12" stroke-width="1.8"/>
    <circle cx="0" cy="-6" r="3" fill="#FFB224" stroke="#0A0D12" stroke-width="1.2"/>
   </g>
   <polyline points="${busX + busW/2},${busY - 32} ${busX + busW/2 + 25},${busY - 44} ${busX + busW/2 + 85},${busY - 44}" stroke="#0A0D12" stroke-width="1.2" stroke-dasharray="2 2"/>
   <circle cx="${busX + busW/2}" cy="${busY - 32}" r="2" fill="#0A0D12"/>
   <text x="${busX + busW/2 + 88}" y="${busY - 41}" fill="#0A0D12" font-size="8.5" font-weight="700" font-family="var(--font-mono)">ANT-03 // 1.5m HGA DISH</text>
  `;
 }

 // Instrument Apertures
 const instCount = instruments.length;
 let instHtml = `
  <!-- Sensor Bay Apertures -->
  <g transform="translate(${busX + busW/2 - 16}, ${busY + busH - 8})">
   <rect x="0" y="0" width="32" height="12" rx="1" fill="#FAF9F5" stroke="#0A0D12" stroke-width="1.8"/>
   <circle cx="10" cy="6" r="4" fill="#0A0D12"/>
   <circle cx="22" cy="6" r="3" fill="#FFB224" stroke="#0A0D12" stroke-width="1"/>
  </g>
  <!-- Callout Leader for Payload -->
  <polyline points="${busX + busW/2},${busY + busH + 4} ${busX + busW/2 + 30},${busY + busH + 18} ${busX + busW/2 + 85},${busY + busH + 18}" stroke="#0A0D12" stroke-width="1.2" stroke-dasharray="2 2"/>
  <circle cx="${busX + busW/2}" cy="${busY + busH + 4}" r="2" fill="#0A0D12"/>
  <text x="${busX + busW/2 + 88}" y="${busY + busH + 21}" fill="#0A0D12" font-size="8.5" font-weight="700" font-family="var(--font-mono)">SCI // ${instCount} SENSOR BAYS</text>
 `;

 return `
  <svg viewBox="0 0 340 185" width="100%" height="170" class="spacecraft-schematic-svg" fill="none">
   <defs>
    <pattern id="blueprintGridRetro" width="16" height="16" patternUnits="userSpaceOnUse">
     <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(10, 13, 18, 0.08)" stroke-width="0.8"/>
    </pattern>
   </defs>
   <rect width="340" height="185" fill="#FAF9F5"/>
   <rect width="340" height="185" fill="url(#blueprintGridRetro)"/>

   <!-- Dimension Lines -->
   <line x1="30" y1="18" x2="310" y2="18" stroke="#0A0D12" stroke-width="1" stroke-dasharray="2 2"/>
   <path d="M 30 14 L 30 22 M 30 18 L 36 15 M 30 18 L 36 21" stroke="#0A0D12" stroke-width="1.2"/>
   <path d="M 310 14 L 310 22 M 310 18 L 304 15 M 310 18 L 304 21" stroke="#0A0D12" stroke-width="1.2"/>
   <text x="170" y="14" fill="#0A0D12" font-size="8.5" font-weight="700" font-family="var(--font-mono)" text-anchor="middle">SPAN: ${spanText}</text>

   <line x1="328" y1="${busY}" x2="328" y2="${busY + busH}" stroke="#0A0D12" stroke-width="1" stroke-dasharray="2 2"/>
   <path d="M 324 ${busY} L 332 ${busY} M 328 ${busY} L 325 ${busY+5} M 328 ${busY} L 331 ${busY+5}" stroke="#0A0D12" stroke-width="1.2"/>
   <path d="M 324 ${busY+busH} L 332 ${busY+busH} M 328 ${busY+busH} L 325 ${busY+busH-5} M 328 ${busY+busH} L 331 ${busY+busH-5}" stroke="#0A0D12" stroke-width="1.2"/>
   <text x="323" y="${busY + busH/2 + 3}" fill="#0A0D12" font-size="8" font-weight="700" font-family="var(--font-mono)" text-anchor="end">HT: ${htText}</text>

   <!-- Assembled Model -->
   <g class="spacecraft-assembled-model" style="transition: transform 200ms ease-out;">
    ${solarHtml}
    ${antennaHtml}

    <!-- Primary Bus Structure -->
    <g transform="translate(${busX}, ${busY})">
     <rect x="0" y="0" width="${busW}" height="${busH}" rx="3" fill="#FAF9F5" stroke="#0A0D12" stroke-width="2"/>
     <line x1="0" y1="${busH*0.33}" x2="${busW}" y2="${busH*0.33}" stroke="#0A0D12" stroke-width="1.2"/>
     <line x1="0" y1="${busH*0.66}" x2="${busW}" y2="${busH*0.66}" stroke="#0A0D12" stroke-width="1.2"/>
     <line x1="${busW*0.5}" y1="0" x2="${busW*0.5}" y2="${busH}" stroke="#0A0D12" stroke-width="1" stroke-dasharray="2 2"/>
     <rect x="${busW*0.15}" y="${busH*0.12}" width="${busW*0.7}" height="${busH*0.35}" fill="#EAE6DD" stroke="#0A0D12" stroke-width="1.2"/>
     <circle cx="${busW*0.5}" cy="${busH*0.29}" r="4.5" fill="#FFB224" stroke="#0A0D12" stroke-width="1"/>
     <rect x="-4" y="6" width="4" height="6" fill="#0A0D12"/>
     <rect x="${busW}" y="6" width="4" height="6" fill="#0A0D12"/>
     <rect x="-4" y="${busH-12}" width="4" height="6" fill="#0A0D12"/>
     <rect x="${busW}" y="${busH-12}" width="4" height="6" fill="#0A0D12"/>
    </g>

    <!-- Bus Callout Leader -->
    <polyline points="${busX + busW},${busY + busH/2} ${busX + busW + 20},${busY + busH/2} ${busX + busW + 35},${busY + busH/2 - 12}" stroke="#0A0D12" stroke-width="1.2" stroke-dasharray="2 2"/>
    <circle cx="${busX + busW}" cy="${busY + busH/2}" r="2" fill="#0A0D12"/>
    <text x="${busX + busW + 38}" y="${busY + busH/2 - 14}" fill="#0A0D12" font-size="8.5" font-weight="700" font-family="var(--font-mono)">SYS-01 // ${bus.name.toUpperCase()}</text>

    ${instHtml}
   </g>
  </svg>
 `;
}

function renderLiveDashboard(res) {
 const container = document.getElementById('dashboard-gauges-container');
 if (!container) return;

 const mCap = res.launcherCap || 500;
 const massPct = Math.min(100, Math.max(0, (res.launchMass / mCap) * 100));

 const powerDenominator = Math.max(res.powerUse, res.powerGen, 10);
 const powerPct = Math.min(100, Math.max(0, (res.powerGen / powerDenominator) * 100));

 const budgetCap = res.isSandbox ? Math.max(res.totalCost + 20, 100) : res.budget;
 const budgetPct = Math.min(100, Math.max(0, (res.totalCost / budgetCap) * 100));

 const dataMax = Math.max(res.dataGenDay, res.downlinkDay, 10);
 const dataPct = Math.min(100, (res.dataReturned / dataMax) * 100);

 const commsPct = Math.min(100, (res.orbit ? (res.orbit.contactHours / 24) * 100 : 10));
 const lifePct = Math.min(100, (res.lifetime / 6) * 100);

 container.innerHTML = `
  <!-- 1. Technical Blueprint Spacecraft Schematic -->
  <div class="schematic-blueprint-box">
   ${generateSpacecraftPreviewSVG(state)}
   <div class="preview-panel-caption" style="display:flex; justify-content:space-between; padding:6px 4px 2px; font-family:var(--font-mono); font-size:0.75rem; border-top:1px solid var(--line); margin-top:2px;">
    <span>DRY: <strong class="text-cyan">${res.dryMass || 0}kg</strong></span>
    <span>INSTR: <strong class="text-cyan">${(state.instrumentIds || []).length}</strong></span>
    <span>LAUNCH: <strong class="text-amber">$${res.totalCost}M</strong></span>
   </div>
  </div>

  <!-- 2. Dual Analog Arc Dials (Power Margin & Data Link) -->
  <div class="arc-dial-container" style="margin: var(--space-3) 0;">
   ${generateArcDialSVG('POWER MARGIN', res.powerGen, powerDenominator, 'W', res.powerStatus.toLowerCase())}
   ${generateArcDialSVG('DATA RETURN', res.dataReturned, dataMax, 'Gb/d', res.dataStatus.toLowerCase())}
  </div>

  <!-- 3. Hardware Segmented Gauges (20-Segment LED Meters) -->
  <!-- Mass Gauge -->
  <div class="gauge-item" id="gauge-mass">
   <div class="gauge-header">
    <span class="gauge-label">
     Mass (kg)
     <button class="gauge-why-btn" data-why="mass" aria-label="Why Mass matters">${ICONS.info}</button>
    </span>
    <span class="gauge-values"><strong>${res.launchMass}</strong> / ${res.launcherCap !== null ? res.launcherCap : '—'} kg</span>
    <span class="status-chip ${res.massStatus.toLowerCase()}">${res.massStatus}</span>
   </div>
   ${generateSegmentedMeterHTML(massPct, res.massStatus.toLowerCase(), 'mass')}
   <div class="gauge-explanation-subtext">
    ${res.launcherCap !== null ? (res.launcherCap >= res.launchMass ? `Mass: ${res.launchMass} kg on ${res.launcherCap} kg rocket (+${res.launcherCap - res.launchMass} kg spare capacity)` : `Mass: ${res.launchMass} kg EXCEEDS ${res.launcherCap} kg rocket limit by ${res.launchMass - res.launcherCap} kg!`) : 'Selected rocket cannot reach target mission orbit.'}
   </div>
  </div>

  <!-- Power Gauge -->
  <div class="gauge-item" id="gauge-power">
   <div class="gauge-header">
    <span class="gauge-label">
     Power (W)
     <button class="gauge-why-btn" data-why="power" aria-label="Why Power matters">${ICONS.info}</button>
    </span>
    <span class="gauge-values"><strong>${res.powerGen}</strong> / ${res.powerUse} W</span>
    <span class="status-chip ${res.powerStatus.toLowerCase()}">${res.powerStatus}</span>
   </div>
   ${generateSegmentedMeterHTML(powerPct, res.powerStatus.toLowerCase(), 'power')}
   <div class="gauge-explanation-subtext">
    ${res.powerGen >= res.powerUse ? `Power: ${res.powerGen} W generated, ${res.powerUse} W consumed (+${res.powerGen - res.powerUse} W spare margin)` : `Power: ${res.powerGen} W generated, ${res.powerUse} W required (${res.powerUse - res.powerGen} W DEFICIT)`}
   </div>
  </div>

  <!-- Budget Gauge -->
  <div class="gauge-item" id="gauge-budget">
   <div class="gauge-header">
    <span class="gauge-label">
     Budget ($M)
     <button class="gauge-why-btn" data-why="budget" aria-label="Why Budget matters">${ICONS.info}</button>
    </span>
    <span class="gauge-values"><strong>$${res.totalCost}M</strong> / $${res.isSandbox ? '∞' : res.budget + 'M'}</span>
    <span class="status-chip ${res.constraints.budget ? 'ok' : 'over'}">${res.constraints.budget ? 'OK' : 'OVER'}</span>
   </div>
   ${generateSegmentedMeterHTML(budgetPct, res.constraints.budget ? 'ok' : 'over', 'budget')}
   <div class="gauge-explanation-subtext">
    ${res.isSandbox ? 'Sandbox Mode: Unlimited financial allocation.' : (res.constraints.budget ? `Budget: $${res.totalCost}M spent of $${res.budget}M allocation ($${res.budget - res.totalCost}M reserve remaining)` : `Budget: $${res.totalCost}M EXCEEDS $${res.budget}M cap by $${res.totalCost - res.budget}M!`)}
   </div>
  </div>

  <!-- Data Gauge -->
  <div class="gauge-item" id="gauge-data">
   <div class="gauge-header">
    <span class="gauge-label">
     Data Link (Gb/d)
     <button class="gauge-why-btn" data-why="data" aria-label="Why Data matters">${ICONS.info}</button>
    </span>
    <span class="gauge-values"><strong>${res.dataReturned}</strong> / ${res.dataGenDay} Gb/d</span>
    <span class="status-chip ${res.dataStatus.toLowerCase()}">${res.dataStatus}</span>
   </div>
   ${generateSegmentedMeterHTML(dataPct, res.dataStatus.toLowerCase(), 'data')}
   <div class="gauge-explanation-subtext">
    ${res.dataGenDay === 0 ? 'No science instruments producing data.' : (res.dataReturned >= res.dataGenDay ? `Data: ${res.dataGenDay} Gb/d generated, 100% successfully returned to Earth` : `Data: ${res.dataGenDay} Gb/d generated, ${res.dataReturned} Gb/d downlinked (${Math.round(((res.dataGenDay - res.dataReturned) / res.dataGenDay) * 100)}% lost to bandwidth bottleneck)`)}
   </div>
  </div>

  <!-- Communications Gauge -->
  <div class="gauge-item" id="gauge-comms">
   <div class="gauge-header">
    <span class="gauge-label">
     Comms Window
     <button class="gauge-why-btn" data-why="comms" aria-label="Why Communications matter">${ICONS.info}</button>
    </span>
    <span class="gauge-values"><strong>${res.orbit ? res.orbit.contactHours : 0}</strong> hrs/d</span>
    <span class="status-chip ok">OK</span>
   </div>
   ${generateSegmentedMeterHTML(commsPct, 'ok', 'comms')}
   <div class="gauge-explanation-subtext">
    Contact window: ${res.orbit ? res.orbit.contactHours : 0} hrs/day direct line-of-sight with Earth Ground Stations
   </div>
  </div>

  <!-- Lifetime Gauge -->
  <div class="gauge-item" id="gauge-lifetime">
   <div class="gauge-header">
    <span class="gauge-label">
     Lifetime (years)
     <button class="gauge-why-btn" data-why="lifetime" aria-label="Why Lifetime matters">${ICONS.info}</button>
    </span>
    <span class="gauge-values"><strong>${res.lifetime}</strong> years</span>
    <span class="status-chip ${res.lifetime >= res.mission.reqs.minLifetime ? 'ok' : 'warn'}">
     ${res.lifetime >= res.mission.reqs.minLifetime ? 'OK' : 'TIGHT'}
    </span>
   </div>
   ${generateSegmentedMeterHTML(lifePct, res.lifetime >= res.mission.reqs.minLifetime ? 'ok' : 'warn', 'lifetime')}
   <div class="gauge-explanation-subtext">
    Operational lifespan: ${res.lifetime} yr (Target minimum: ${res.mission ? res.mission.reqs.minLifetime : 1} yr)
   </div>
  </div>
 `;

 // Update mobile summary bar
 const mobSummary = document.getElementById('mobile-dash-summary-text');
 if (mobSummary) {
  mobSummary.innerHTML = `
   <span>MASS: <strong class="text-cyan">${res.launchMass}kg</strong></span>
   <span>COST: <strong class="text-amber">$${res.totalCost}M</strong></span>
   <span class="status-chip ${res.canLaunch ? 'ok' : 'danger'}" style="padding:1px 6px; font-size:0.75rem;">
    ${res.canLaunch ? 'LAUNCH GO' : 'NO-GO'}
   </span>
  `;
 }
}


function renderReviewScreen(res) {
 const container = document.getElementById('review-checklist-container');
 const summarySpecs = document.getElementById('review-specs-container');
 const launchBtn = document.getElementById('review-launch-btn');
 const launchFailsBox = document.getElementById('review-launch-fails-box');

 if (!container || !summarySpecs) return;

 // Station 1: Flight Planner
 const budgetOk = res.isSandbox || res.totalCost <= res.budget;
 const massOk = res.launcherCap === null || res.launchMass <= res.launcherCap;
 const plannerGo = budgetOk && massOk;

 // Station 2: Chief Engineer
 const powerOk = res.powerGen >= res.powerUse;
 const batteryOk = res.battery !== null;
 const busOk = res.bus !== null && res.panel !== null;
 const engineerGo = powerOk && batteryOk && busOk;

 // Station 3: Payload Scientist
 const instOk = res.instruments.length > 0;
 const reqsOk = res.reqDetails.every(r => r.passed);
 const scienceGo = instOk && reqsOk;

 // Station 4: Telemetry & Comms
 const antennaOk = res.antenna !== null;
 const orbitOk = res.orbit !== null;
 const downlinkOk = res.dataReturned >= res.dataGenDay;
 const commsGo = antennaOk && orbitOk && downlinkOk;

 const allStationsGo = plannerGo && engineerGo && scienceGo && commsGo;

 // Render 4 Operator Stations Poll in container
 container.innerHTML = `
  <div class="stations-poll-grid">
   <!-- Station 01: Flight Planner -->
   <div class="station-poll-card console-panel ${plannerGo ? 'poll-go' : 'poll-nogo'}">
    <div class="panel-header-strip">
     <span class="panel-subsystem-code">STA-01 // FLIGHT PLANNER</span>
     <div style="display:flex; align-items:center; gap:6px;">
      <span class="badge ${plannerGo ? 'badge-go' : 'badge-nogo'}">${plannerGo ? 'GO' : 'NO-GO'}</span>
      <span class="status-led ${plannerGo ? 'led-go' : 'led-nogo'}"></span>
     </div>
    </div>
    <div class="station-body">
     <div class="station-metrics mono-num">
      <span>COST: <strong class="${budgetOk ? 'text-amber' : 'text-nogo'}">$${res.totalCost}M / $${res.isSandbox ? '∞' : res.budget + 'M'}</strong></span>
      <span>MASS: <strong class="${massOk ? 'text-cyan' : 'text-nogo'}">${res.launchMass}kg / ${res.launcherCap || '—'}kg</strong></span>
     </div>
     <p class="station-log">${plannerGo ? 'Mission capital and rocket payload lift capacity verify within safe flight margins.' : (!massOk ? 'NO-GO: Spacecraft wet mass exceeds selected rocket lift capability.' : 'NO-GO: Integrated build exceeds allocated congressional budget ceiling.')}</p>
     ${!plannerGo ? `<button class="btn btn-secondary btn-sm fix-step-btn" data-jump-step="3" style="width:100%; margin-top:8px;">Fix Launch Vehicle &rarr;</button>` : ''}
    </div>
   </div>

   <!-- Station 02: Chief Engineer -->
   <div class="station-poll-card console-panel ${engineerGo ? 'poll-go' : 'poll-nogo'}">
    <div class="panel-header-strip">
     <span class="panel-subsystem-code">STA-02 // CHIEF ENGINEER</span>
     <div style="display:flex; align-items:center; gap:6px;">
      <span class="badge ${engineerGo ? 'badge-go' : 'badge-nogo'}">${engineerGo ? 'GO' : 'NO-GO'}</span>
      <span class="status-led ${engineerGo ? 'led-go' : 'led-nogo'}"></span>
     </div>
    </div>
    <div class="station-body">
     <div class="station-metrics mono-num">
      <span>POWER: <strong class="${powerOk ? 'text-go' : 'text-nogo'}">${res.powerGen}W gen / ${res.powerUse}W req</strong></span>
      <span>BATTERY: <strong class="${batteryOk ? 'text-cyan' : 'text-nogo'}">${res.battery ? res.battery.name : 'NONE'}</strong></span>
     </div>
     <p class="station-log">${engineerGo ? 'Power bus generation balances total electrical draw with adequate eclipse reserves.' : (!powerOk ? 'NO-GO: Electrical generation is lower than baseline spacecraft draw.' : 'NO-GO: Spacecraft lacks battery storage for orbital eclipse passes.')}</p>
     ${!engineerGo ? `<button class="btn btn-secondary btn-sm fix-step-btn" data-jump-step="1" style="width:100%; margin-top:8px;">Fix Power & Battery &rarr;</button>` : ''}
    </div>
   </div>

   <!-- Station 03: Payload Scientist -->
   <div class="station-poll-card console-panel ${scienceGo ? 'poll-go' : 'poll-nogo'}">
    <div class="panel-header-strip">
     <span class="panel-subsystem-code">STA-03 // PAYLOAD SCIENTIST</span>
     <div style="display:flex; align-items:center; gap:6px;">
      <span class="badge ${scienceGo ? 'badge-go' : 'badge-nogo'}">${scienceGo ? 'GO' : 'NO-GO'}</span>
      <span class="status-led ${scienceGo ? 'led-go' : 'led-nogo'}"></span>
     </div>
    </div>
    <div class="station-body">
     <div class="station-metrics mono-num">
      <span>SENSORS: <strong class="${instOk ? 'text-cyan' : 'text-nogo'}">${res.instruments.length} INSTALLED</strong></span>
      <span>TARGETS: <strong class="${reqsOk ? 'text-go' : 'text-nogo'}">${res.reqDetails.filter(r => r.passed).length} / ${res.reqDetails.length} OK</strong></span>
     </div>
     <p class="station-log">${scienceGo ? 'Scientific sensor payload meets primary planetary observation and resolution baseline.' : 'NO-GO: Missing critical sensor suites required for primary mission science objectives.'}</p>
     ${!scienceGo ? `<button class="btn btn-secondary btn-sm fix-step-btn" data-jump-step="2" style="width:100%; margin-top:8px;">Fix Scientific Payload &rarr;</button>` : ''}
    </div>
   </div>

   <!-- Station 04: Telemetry & Comms -->
   <div class="station-poll-card console-panel ${commsGo ? 'poll-go' : 'poll-nogo'}">
    <div class="panel-header-strip">
     <span class="panel-subsystem-code">STA-04 // TELEMETRY & COMMS</span>
     <div style="display:flex; align-items:center; gap:6px;">
      <span class="badge ${commsGo ? 'badge-go' : 'badge-nogo'}">${commsGo ? 'GO' : 'NO-GO'}</span>
      <span class="status-led ${commsGo ? 'led-go' : 'led-nogo'}"></span>
     </div>
    </div>
    <div class="station-body">
     <div class="station-metrics mono-num">
      <span>DOWNLINK: <strong class="${downlinkOk ? 'text-cyan' : 'text-nogo'}">${res.downlinkDay} Gb/d</strong></span>
      <span>CONTACT: <strong class="${orbitOk ? 'text-cyan' : 'text-nogo'}">${res.orbit ? res.orbit.contactHours : 0} HR/DAY</strong></span>
     </div>
     <p class="station-log">${commsGo ? 'Antenna RF link closure and ground station tracking schedule verified.' : (!antennaOk ? 'NO-GO: Spacecraft has no communication antenna mounted.' : (!orbitOk ? 'NO-GO: Orbital trajectory not selected.' : 'NO-GO: Daily sensor data output exceeds ground station downlink bandwidth.'))}</p>
     ${!commsGo ? `<button class="btn btn-secondary btn-sm fix-step-btn" data-jump-step="${!antennaOk ? 1 : 3}" style="width:100%; margin-top:8px;">Fix Antenna / Orbit &rarr;</button>` : ''}
    </div>
   </div>
  </div>

 `;

 // Render Consensus Terminal Feed in full-width container below the two columns
 const feedBox = document.getElementById('review-feed-container');
 if (feedBox) {
  feedBox.innerHTML = `
   <div class="console-panel has-corner-ticks review-terminal-feed">
    <div class="panel-header-strip">
     <span class="panel-subsystem-code">FEED-01 // REAL-TIME PRE-LAUNCH CONSENSUS LOG</span>
     <span style="font-family:var(--font-mono); font-size:0.7rem; color:var(--cyan);">SYNCED</span>
    </div>
    <div class="terminal-feed-content mono-num">
     <div class="feed-line"><span class="text-dim">[SYS-FLIGHT]</span> INITIATING PRE-LAUNCH GO/NO-GO CONSENSUS POLL...</div>
     <div class="feed-line"><span class="${plannerGo ? 'text-go' : 'text-nogo'}">[STA-01 PLAN]</span> ${plannerGo ? 'CAPITAL & MASS VERIFIED -> REPORT GO' : 'VIOLATION DETECTED -> REPORT NO-GO'}</div>
     <div class="feed-line"><span class="${engineerGo ? 'text-go' : 'text-nogo'}">[STA-02 ENGR]</span> ${engineerGo ? 'ELECTRICAL & POWER BUS NOMINAL -> REPORT GO' : 'POWER DEFICIT -> REPORT NO-GO'}</div>
     <div class="feed-line"><span class="${scienceGo ? 'text-go' : 'text-nogo'}">[STA-03 SCI]</span> ${scienceGo ? 'PRIMARY PAYLOAD SUITE CALIBRATED -> REPORT GO' : 'SCIENCE INCOMPLETE -> REPORT NO-GO'}</div>
     <div class="feed-line"><span class="${commsGo ? 'text-go' : 'text-nogo'}">[STA-04 COMM]</span> ${commsGo ? 'CARRIER FREQUENCY LOCKED -> REPORT GO' : 'LINK DEFICIT -> REPORT NO-GO'}</div>
     <div class="feed-line" style="border-top:1px solid var(--line); margin-top:4px; padding-top:4px;">
      <span class="${allStationsGo ? 'text-amber' : 'text-nogo'}">[FLIGHT-DIR]</span> <strong>${allStationsGo ? 'ALL STATIONS REPORT GO. IGNITION INTERLOCK DISENGAGED.' : 'INTERLOCK ENGAGED. RESOLVE NO-GO STATIONS PRIOR TO LAUNCH.'}</strong>
     </div>
    </div>
   </div>
  `;
 }

 // Assembled Hardware Manifest
 summarySpecs.innerHTML = `
  <div class="review-manifest-box">
   <div class="spec-matrix" style="grid-template-columns: repeat(2, 1fr); margin-bottom:12px;">
    <div class="spec-cell"><span class="spec-k">BUS CHASSIS</span><span class="spec-v text-cyan">${res.bus ? res.bus.name : '—'}</span></div>
    <div class="spec-cell"><span class="spec-k">SOLAR ARRAY</span><span class="spec-v text-cyan">${res.panel ? res.panel.name : '—'}</span></div>
    <div class="spec-cell"><span class="spec-k">BATTERY BANK</span><span class="spec-v text-cyan">${res.battery ? res.battery.name : '—'}</span></div>
    <div class="spec-cell"><span class="spec-k">ANTENNA DISH</span><span class="spec-v text-cyan">${res.antenna ? res.antenna.name : '—'}</span></div>
    <div class="spec-cell"><span class="spec-k">LAUNCH VEHICLE</span><span class="spec-v text-amber">${res.launcher ? res.launcher.name : '—'}</span></div>
    <div class="spec-cell"><span class="spec-k">ORBIT PROFILE</span><span class="spec-v text-amber">${res.orbit ? res.orbit.name : '—'}</span></div>
   </div>

   <div class="manifest-instruments" style="margin-bottom:12px;">
    <span class="spec-k" style="display:block; margin-bottom:4px;">INSTALLED SENSORS (${res.instruments.length}):</span>
    <div style="display:flex; flex-wrap:wrap; gap:4px;">
     ${res.instruments.length > 0 ? res.instruments.map(i => `<span class="console-tag" style="font-size:0.68rem; padding:2px 6px;">${i.name}</span>`).join('') : '<span class="text-dim" style="font-family:var(--font-mono); font-size:0.75rem;">None installed</span>'}
    </div>
   </div>

   <div class="manifest-instruments" style="margin-bottom:12px;">
    <span class="spec-k" style="display:block; margin-bottom:4px;">REDUNDANT EXTRAS (${res.extras.length}):</span>
    <div style="display:flex; flex-wrap:wrap; gap:4px;">
     ${res.extras.length > 0 ? res.extras.map(e => `<span class="console-tag" style="font-size:0.68rem; padding:2px 6px;">${e.name}</span>`).join('') : '<span class="text-dim" style="font-family:var(--font-mono); font-size:0.75rem;">None installed</span>'}
    </div>
   </div>

   <div class="spec-matrix manifest-summary-row" style="grid-template-columns: repeat(3, 1fr); margin-top:auto;">
    <div class="spec-cell"><span class="spec-k">DRY MASS</span><span class="spec-v text-cyan">${res.dryMass} kg</span></div>
    <div class="spec-cell"><span class="spec-k">WET MASS</span><span class="spec-v text-cyan">${res.launchMass} kg</span></div>
    <div class="spec-cell"><span class="spec-k">MISSION COST</span><span class="spec-v text-amber">$${res.totalCost}M</span></div>
   </div>
  </div>
 `;

 if (launchBtn) {
  launchBtn.disabled = !res.canLaunch;
  if (res.canLaunch) {
   launchBtn.textContent = 'AUTHORIZE LAUNCH SEQUENCE [T-10] →';
   launchBtn.className = 'btn btn-primary btn-lg';
  } else {
   launchBtn.textContent = 'LAUNCH INTERLOCK ACTIVE (RESOLVE NO-GO STATIONS)';
   launchBtn.className = 'btn btn-secondary btn-lg';
  }
 }

 if (launchFailsBox) {
  if (res.hardFails.length > 0) {
   launchFailsBox.style.display = 'block';
   launchFailsBox.innerHTML = `
    <div class="console-panel" style="border-color: var(--nogo); background: rgba(255, 90, 95, 0.06); padding:14px;">
     <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
      <span class="status-led led-nogo"></span>
      <strong style="font-family:var(--font-heading); color:var(--nogo); letter-spacing:0.04em;">HARD INTERLOCK BLOCKERS (${res.hardFails.length})</strong>
     </div>
     <ul style="padding-left: 20px; font-family:var(--font-mono); font-size: 0.8rem; line-height: 1.6; color: var(--text); margin:0;">
      ${res.hardFails.map(f => `<li>${f}</li>`).join('')}
     </ul>
    </div>
   `;
  } else {
   launchFailsBox.style.display = 'none';
  }
 }
}

function renderReportScreen(res) {
 const gradeBadge = document.getElementById('report-grade');
 const scoreCounter = document.getElementById('report-score');
 const gradeLabel = document.getElementById('report-grade-label');
 const radarContainer = document.getElementById('report-radar-container');
 const barsGrid = document.getElementById('report-bars-grid');
 const wentWellList = document.getElementById('report-went-well-list');
 const limitedList = document.getElementById('report-limited-list');
 const nextTipsList = document.getElementById('report-next-tips-list');
 const realMissionCard = document.getElementById('report-real-mission-card');

 if (!gradeBadge || !scoreCounter) return;

 clearAllToasts();

 let syncBonus = 0;
 if (state.isTeamMode) {
  syncBonus = calculateTeamSyncBonus(res);
 }
 const breakdownSum = Math.round(res.objectiveScore + res.scienceScore + res.efficiencyScore + res.reliabilityScore);
 const finalScore = Math.min(100, Math.round(breakdownSum + syncBonus));

 let finalGrade = 'Fail';
 let gradeText = 'Mission Terminated • Requirements Unmet';
 if (finalScore >= 90) { finalGrade = 'S'; gradeText = 'Class S • Exemplary Flight'; }
 else if (finalScore >= 80) { finalGrade = 'A'; gradeText = 'Grade A • Mission Accomplished'; }
 else if (finalScore >= 65) { finalGrade = 'B'; gradeText = 'Grade B • Mission Qualified'; }
 else if (finalScore >= 50) { finalGrade = 'C'; gradeText = 'Grade C • Degraded Operations'; }
 else { finalGrade = 'Fail'; gradeText = 'Requirements Unmet'; }

 res.finalGrade = finalGrade;
 res.finalScore = finalScore;

 gradeBadge.className = `report-grade-badge grade-${finalGrade}`;
 gradeBadge.textContent = finalGrade;

 if (gradeLabel) gradeLabel.textContent = gradeText;

 animateScoreCount(scoreCounter, finalScore);

 // Confetti burst for high achievement
 if (finalGrade === 'S' || finalGrade === 'A') {
  triggerConfettiBurst();
 }

 // Render SVG Radar Chart
 if (radarContainer) {
  radarContainer.innerHTML = renderRadarChartSVG(res);
 }

 // Render Category Breakdown Bars
 if (barsGrid) {
  barsGrid.innerHTML = `
   <div class="report-bar-card">
    <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.85rem;">
     <span style="font-weight:600;">Mission Objectives</span>
     <strong>${res.objectiveScore} / 40</strong>
    </div>
    <div class="gauge-bar-wrapper"><div class="gauge-fill ok" style="width:${(res.objectiveScore / 40) * 100}%;"></div></div>
   </div>
   <div class="report-bar-card">
    <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.85rem;">
     <span style="font-weight:600;">Scientific Return</span>
     <strong>${res.scienceScore} / 25</strong>
    </div>
    <div class="gauge-bar-wrapper"><div class="gauge-fill ok" style="width:${(res.scienceScore / 25) * 100}%;"></div></div>
   </div>
   <div class="report-bar-card">
    <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.85rem;">
     <span style="font-weight:600;">Cost & Mass Efficiency</span>
     <strong>${res.efficiencyScore} / 20</strong>
    </div>
    <div class="gauge-bar-wrapper"><div class="gauge-fill ok" style="width:${(res.efficiencyScore / 20) * 100}%;"></div></div>
   </div>
   <div class="report-bar-card">
    <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.85rem;">
     <span style="font-weight:600;">Reliability & Margins</span>
     <strong>${res.reliabilityScore} / 15</strong>
    </div>
    <div class="gauge-bar-wrapper"><div class="gauge-fill ok" style="width:${(res.reliabilityScore / 15) * 100}%;"></div></div>
   </div>
   ${state.isTeamMode ? `
    <div class="report-bar-card" style="border:1px solid var(--accent); background:rgba(56,213,255,0.08);">
     <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.85rem;">
      <span style="font-weight:600; color:var(--cyan);">Team Sync Bonus</span>
      <strong style="color:var(--cyan);">+${syncBonus} / 10</strong>
     </div>
     <div class="gauge-bar-wrapper"><div class="gauge-fill ok" style="width:${(syncBonus / 10) * 100}%;"></div></div>
    </div>
   ` : ''}
  `;
 }

 if (wentWellList) {
  wentWellList.innerHTML = res.explanations.wentWell.map(w => `
   <li class="feedback-item">
    <span class="feedback-bullet" style="color:var(--ok);">✓</span>
    <span>${w}</span>
   </li>
  `).join('') || '<li class="text-muted">No primary strengths noted.</li>';
 }

 if (limitedList) {
  limitedList.innerHTML = res.explanations.limited.map(l => `
   <li class="feedback-item">
    <span class="feedback-bullet" style="color:var(--warn);">⚠️</span>
    <span>${l}</span>
   </li>
  `).join('') || '<li class="text-muted" style="color:var(--ok);">No significant operational bottlenecks encountered.</li>';
 }

 if (nextTipsList) {
  nextTipsList.innerHTML = res.explanations.nextTips.map(t => {
   let jumpStep = 0;
   let jumpLabel = 'Step 1';
   const low = t.toLowerCase();
   if (low.includes('antenna') || low.includes('solar') || low.includes('power') || low.includes('battery')) {
    jumpStep = 1; jumpLabel = 'Power & Comms';
   } else if (low.includes('instrument') || low.includes('sensor') || low.includes('camera') || low.includes('spectrometer')) {
    jumpStep = 2; jumpLabel = 'Instruments';
   } else if (low.includes('launcher') || low.includes('orbit') || low.includes('mass') || low.includes('altitude')) {
    jumpStep = 3; jumpLabel = 'Launch & Orbit';
   } else {
    jumpStep = 0; jumpLabel = 'Spacecraft Chassis';
   }

   return `
    <li class="feedback-item" style="flex-direction:column; align-items:flex-start;">
     <div style="display:flex; gap:8px;">
      <span class="feedback-bullet" style="color:var(--accent);">💡</span>
      <span>${t}</span>
     </div>
     <button class="report-action-chip" data-jump-step="${jumpStep}">
      Apply in ${jumpLabel} &rarr;
     </button>
    </li>
   `;
  }).join('');
 }

 if (realMissionCard) {
  realMissionCard.innerHTML = `
   <div class="card" style="margin-top: var(--space-5); text-align: left;">
    <span class="badge" style="color:var(--cyan); margin-bottom: 6px;">Real-World Aerospace Analogue</span>
    <h3>${res.matchedMission.name}</h3>
        <p class="text-muted" style="margin-top: 6px; font-size: 0.92rem;">${res.matchedMission.desc}</p>
    <p class="text-dim" style="font-size:0.8rem; margin-top:8px; font-style:italic;">Real missions are far more complex than this model.</p>
   </div>
  `;
 }
}

function renderRadarChartSVG(res) {
 const w = 280;
 const h = 250;
 const cx = 140;
 const cy = 125;
 const R = 78;

 const objNorm = Math.min(1, Math.max(0, res.objectiveScore / 40));
 const sciNorm = Math.min(1, Math.max(0, res.scienceScore / 25));
 const effNorm = Math.min(1, Math.max(0, res.efficiencyScore / 20));
 const relNorm = Math.min(1, Math.max(0, res.reliabilityScore / 15));

 const p0 = `${cx},${cy - R * objNorm}`;
 const p1 = `${cx + R * sciNorm},${cy}`;
 const p2 = `${cx},${cy + R * effNorm}`;
 const p3 = `${cx - R * relNorm},${cy}`;

 const gridDiamonds = [0.25, 0.5, 0.75, 1.0].map(s => {
  const r = R * s;
  return `<polygon points="${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}" fill="none" stroke="#0A0D12" stroke-opacity="0.2" stroke-width="1"/>`;
 }).join('');

 return `
  <svg class="radar-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
   <defs>
    <radialGradient id="radarFillGrad" cx="50%" cy="50%" r="50%">
     <stop offset="0%" stop-color="#0A0D12" stop-opacity="0.25"/>
     <stop offset="100%" stop-color="#0A0D12" stop-opacity="0.08"/>
    </radialGradient>
   </defs>

   <!-- Concentric Grid Polygons -->
   ${gridDiamonds}

   <!-- Axis Cross Lines -->
   <line x1="${cx - R}" y1="${cy}" x2="${cx + R}" y2="${cy}" stroke="#0A0D12" stroke-opacity="0.3" stroke-width="1" stroke-dasharray="3 3"/>
   <line x1="${cx}" y1="${cy - R}" x2="${cx}" y2="${cy + R}" stroke="#0A0D12" stroke-opacity="0.3" stroke-width="1" stroke-dasharray="3 3"/>

   <!-- Player Score Polygon Area -->
   <polygon points="${p0} ${p1} ${p2} ${p3}" fill="url(#radarFillGrad)" stroke="#0A0D12" stroke-width="2.5"/>

   <!-- Vertex Points -->
   <circle cx="${cx}" cy="${cy - R * objNorm}" r="4" fill="#0A0D12" stroke="#FFFFFF" stroke-width="1.5"/>
   <circle cx="${cx + R * sciNorm}" cy="${cy}" r="4" fill="#0A0D12" stroke="#FFFFFF" stroke-width="1.5"/>
   <circle cx="${cx}" cy="${cy + R * effNorm}" r="4" fill="#0A0D12" stroke="#FFFFFF" stroke-width="1.5"/>
   <circle cx="${cx - R * relNorm}" cy="${cy}" r="4" fill="#0A0D12" stroke="#FFFFFF" stroke-width="1.5"/>

   <!-- Axis Labels -->
   <text x="${cx}" y="${cy - R - 8}" fill="#0A0D12" font-size="9" font-weight="700" text-anchor="middle">OBJECTIVES (${res.objectiveScore}/40)</text>
   <text x="${cx + R + 6}" y="${cy + 4}" fill="#0A0D12" font-size="9" font-weight="700" text-anchor="start">SCIENCE (${res.scienceScore}/25)</text>
   <text x="${cx}" y="${cy + R + 14}" fill="#0A0D12" font-size="9" font-weight="700" text-anchor="middle">EFFICIENCY (${res.efficiencyScore}/20)</text>
   <text x="${cx - R - 6}" y="${cy + 4}" fill="#0A0D12" font-size="9" font-weight="700" text-anchor="end">RELIABILITY (${res.reliabilityScore}/15)</text>
  </svg>
 `;
}

function triggerConfettiBurst() {
 const container = document.getElementById('confetti-container');
 if (!container) return;
 container.innerHTML = '';

 const colors = ['#38D5FF', '#4D7CFF', '#8B5CFF', '#35E0A1', '#FFB547', '#FF4FD8', '#FFFFFF'];
 const count = 45;

 for (let i = 0; i < count; i++) {
  const el = document.createElement('div');
  el.className = 'confetti-piece';
  el.style.left = `${Math.random() * 100}vw`;
  el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
  el.style.animationDelay = `${Math.random() * 0.7}s`;
  el.style.animationDuration = `${2.2 + Math.random() * 1.5}s`;
  el.style.transform = `scale(${0.6 + Math.random() * 0.8})`;
  container.appendChild(el);
 }

 setTimeout(() => {
  if (container) container.innerHTML = '';
 }, 4500);
}

function drawCurvedText(ctx, text, cx, cy, radius, startAngle, isTop) {
 ctx.save();
 ctx.textAlign = 'center';
 ctx.textBaseline = 'middle';
 const charWidth = 14;
 const totalAngle = (text.length * charWidth) / radius;
 let angle = isTop ? startAngle - totalAngle / 2 : startAngle + totalAngle / 2;

 for (let i = 0; i < text.length; i++) {
  const char = text[i];
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.translate(0, isTop ? -radius : radius);
  if (!isTop) ctx.rotate(Math.PI);
  ctx.fillText(char, 0, 0);
  ctx.restore();
  angle += isTop ? totalAngle / text.length : -totalAngle / text.length;
 }
 ctx.restore();
}

function downloadMissionPatch() {
 const res = state.result;
 if (!res) return;

 const canvas = document.createElement('canvas');
 canvas.width = 440;
 canvas.height = 440;
 const ctx = canvas.getContext('2d');
 if (!ctx) return;

 const cx = 220;
 const cy = 220;
 const R = 200;

 // 1. Clip outer circle
 ctx.save();
 ctx.beginPath();
 ctx.arc(cx, cy, R, 0, Math.PI * 2);
 ctx.clip();

 // Space background
 const bg = ctx.createRadialGradient(cx, cy - 30, 20, cx, cy, R);
 bg.addColorStop(0, '#0E1C38');
 bg.addColorStop(0.65, '#070D1E');
 bg.addColorStop(1, '#02050E');
 ctx.fillStyle = bg;
 ctx.fillRect(0, 0, 440, 440);

 // Background stars
 ctx.fillStyle = '#FFFFFF';
 for (let i = 0; i < 60; i++) {
  const sx = (i * 179.3) % 440;
  const sy = (i * 283.7) % 440;
  ctx.fillRect(sx, sy, (i % 3 === 0 ? 2 : 1.2), (i % 3 === 0 ? 2 : 1.2));
 }

 // Destination planet
 const dest = res.mission.destKey;
 const pRadius = 65;
 const px = cx;
 const py = cy + 40;

 // Planet glow
 const pGlow = ctx.createRadialGradient(px, py, pRadius, px, py, pRadius + 25);
 pGlow.addColorStop(0, dest === 'mars' ? 'rgba(255, 100, 50, 0.45)' : 'rgba(56, 213, 255, 0.45)');
 pGlow.addColorStop(1, 'rgba(0,0,0,0)');
 ctx.fillStyle = pGlow;
 ctx.beginPath();
 ctx.arc(px, py, pRadius + 25, 0, Math.PI * 2);
 ctx.fill();

 // Planet body
 const pGrad = ctx.createRadialGradient(px - 25, py - 25, 10, px, py, pRadius);
 if (dest === 'mars') {
  pGrad.addColorStop(0, '#FB923C');
  pGrad.addColorStop(0.6, '#C2410C');
  pGrad.addColorStop(1, '#1A0602');
 } else if (dest === 'moon') {
  pGrad.addColorStop(0, '#F1F5F9');
  pGrad.addColorStop(0.6, '#94A3B8');
  pGrad.addColorStop(1, '#0F172A');
 } else {
  pGrad.addColorStop(0, '#38BDF8');
  pGrad.addColorStop(0.6, '#0284C7');
  pGrad.addColorStop(1, '#051026');
 }
 ctx.fillStyle = pGrad;
 ctx.beginPath();
 ctx.arc(px, py, pRadius, 0, Math.PI * 2);
 ctx.fill();

 // Orbit ring
 ctx.beginPath();
 ctx.ellipse(cx, cy, 140, 75, -Math.PI / 10, 0, Math.PI * 2);
 ctx.strokeStyle = 'rgba(56, 213, 255, 0.5)';
 ctx.lineWidth = 2;
 ctx.setLineDash([6, 6]);
 ctx.stroke();
 ctx.setLineDash([]);

 // Spacecraft silhouette
 ctx.save();
 ctx.translate(cx, cy - 55);
 // Satellite Body
 ctx.fillStyle = '#FFFFFF';
 ctx.fillRect(-14, -14, 28, 28);
 // Wings
 ctx.fillStyle = '#38D5FF';
 ctx.fillRect(-48, -10, 30, 20);
 ctx.fillRect(18, -10, 30, 20);
 // Antenna Dish
 ctx.beginPath();
 ctx.arc(0, -18, 9, Math.PI, 0);
 ctx.strokeStyle = '#FFFFFF';
 ctx.lineWidth = 2.5;
 ctx.stroke();
 ctx.restore();

 ctx.restore(); // Restore unclipped

 // 2. Embroidered Patch Outer Border & Stitching
 ctx.save();
 // Outer metallic gold ring
 ctx.beginPath();
 ctx.arc(cx, cy, R - 6, 0, Math.PI * 2);
 ctx.strokeStyle = '#FFB547';
 ctx.lineWidth = 14;
 ctx.stroke();

 // Cyan inner accent ring
 ctx.beginPath();
 ctx.arc(cx, cy, R - 14, 0, Math.PI * 2);
 ctx.strokeStyle = '#38D5FF';
 ctx.lineWidth = 3;
 ctx.stroke();

 // Embroidered stitch markings
 ctx.beginPath();
 ctx.arc(cx, cy, R - 6, 0, Math.PI * 2);
 ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
 ctx.lineWidth = 1.5;
 ctx.setLineDash([4, 6]);
 ctx.stroke();
 ctx.setLineDash([]);

 // 3. Ribbon banner for Grade
 ctx.fillStyle = '#080D1C';
 ctx.strokeStyle = '#FFB547';
 ctx.lineWidth = 2;
 ctx.beginPath();
 ctx.roundRect(cx - 90, cy + 115, 180, 32, 6);
 ctx.fill();
 ctx.stroke();

 ctx.fillStyle = '#FFB547';
 ctx.font = 'bold 15px monospace';
 ctx.textAlign = 'center';
 ctx.textBaseline = 'middle';
 ctx.fillText(`★ GRADE ${res.finalGrade || 'A'} MISSION ★`, cx, cy + 131);

 // 4. Curved Text: "MISSION ARCHITECT" on Top
 ctx.fillStyle = '#EEF3FF';
 ctx.font = 'bold 18px sans-serif';
 drawCurvedText(ctx, '★ MISSION ARCHITECT ★', cx, cy, R - 30, Math.PI * 1.5, true);

 // 5. Curved Text: Mission Name on Bottom
 ctx.fillStyle = '#38D5FF';
 ctx.font = 'bold 16px sans-serif';
 drawCurvedText(ctx, res.mission.name.toUpperCase(), cx, cy, R - 30, Math.PI * 0.5, false);

  // 6. Mandatory AI Assistance Disclosure on Downloaded Patch
 ctx.fillStyle = 'rgba(238, 243, 255, 0.75)';
 ctx.font = '10px monospace';
 ctx.textAlign = 'center';
 ctx.fillText('Made with Mission Architect (AI-assisted)', cx, cy + 185);

 ctx.restore();

 // Download trigger
 const link = document.createElement('a');
 link.download = `${res.mission.id}-mission-patch.png`;
 link.href = canvas.toDataURL('image/png');
 document.body.appendChild(link);
 link.click();
 link.remove();

 sound.playSelect();
 showToast('Mission Patch PNG downloaded successfully!', 'ok');
}

function animateScoreCount(element, targetScore) {
 let current = 0;
 const duration = 1000;
 const startTime = performance.now();

 function update(now) {
  const elapsed = now - startTime;
  const progress = Math.min(1, elapsed / duration);
  const eased = 1 - (1 - progress) * (1 - progress);
  current = Math.round(eased * targetScore);
  element.textContent = current;
  if (progress < 1) {
   requestAnimationFrame(update);
  }
 }

 requestAnimationFrame(update);
}

export function setupEventListeners() {
 // Countdown controls wired via delegated click
 const contentContainer = document.getElementById('build-step-content');
 if (contentContainer) {
  contentContainer.addEventListener('mouseover', (e) => {
   const card = e.target.closest('[data-select-bus], [data-select-panel], [data-select-battery], [data-select-antenna], [data-toggle-instrument], [data-toggle-extra], [data-select-launcher], [data-select-orbit]');
   if (card) showImpactPreview(card);
  });
  contentContainer.addEventListener('mouseout', (e) => {
   const card = e.target.closest('[data-select-bus], [data-select-panel], [data-select-battery], [data-select-antenna], [data-toggle-instrument], [data-toggle-extra], [data-select-launcher], [data-select-orbit]');
   if (card && (!e.relatedTarget || !card.contains(e.relatedTarget))) {
    clearImpactPreview();
   }
  });
 }
 document.addEventListener('click', (e) => {
  const target = e.target;
  const fixBtn = target.closest('.fix-step-btn');
  if (fixBtn && fixBtn.dataset.jumpStep !== undefined) {
   sound.playClick();
   setScreen('build');
   setStep(parseInt(fixBtn.dataset.jumpStep, 10));
   return;
  }

  if (target.id === 'abort-countdown-btn' || target.closest('#abort-countdown-btn')) {
   sound.playClick();
   abortCountdown();
   return;
  }

  if (target.id === 'skip-countdown-btn' || target.closest('#skip-countdown-btn')) {
   skipCountdown();
   return;
  }

  const missionCard = target.closest('[data-mission-id]');
  if (missionCard) {
   setMission(missionCard.dataset.missionId);
   setScreen('build');
   return;
  }

  const diffBtn = target.closest('[data-diff]');
  if (diffBtn) {
   setDifficulty(diffBtn.dataset.diff);
   return;
  }

  if (target.id === 'sandbox-checkbox') {
   setDifficulty(target.checked ? 'sandbox' : 'normal');
   return;
  }

  const busEl = target.closest('[data-select-bus]');
  if (busEl) { selectBus(busEl.dataset.selectBus); return; }

  const panelEl = target.closest('[data-select-panel]');
  if (panelEl) { selectPanel(panelEl.dataset.selectPanel); return; }

  const battEl = target.closest('[data-select-battery]');
  if (battEl) { selectBattery(battEl.dataset.selectBattery); return; }

  const antEl = target.closest('[data-select-antenna]');
  if (antEl) { selectAntenna(antEl.dataset.selectAntenna); return; }

  const lnchEl = target.closest('[data-select-launcher]');
  if (lnchEl && !lnchEl.classList.contains('card-disabled')) {
   selectLauncher(lnchEl.dataset.selectLauncher);
   return;
  }

  const orbEl = target.closest('[data-select-orbit]');
  if (orbEl) { selectOrbit(orbEl.dataset.selectOrbit); return; }

  const instEl = target.closest('[data-toggle-instrument]');
  if (instEl) { toggleInstrument(instEl.dataset.toggleInstrument); return; }

  const extEl = target.closest('[data-toggle-extra]');
  if (extEl) { toggleExtra(extEl.dataset.toggleExtra); return; }

  if (target.id === 'build-next-btn') {
   sound.playClick();
   if (state.isTeamMode) {
    advanceTeamTurn();
   } else {
    if (state.currentStep < 4) setStep(state.currentStep + 1);
   }
   return;
  }

  if (target.id === 'build-back-btn') {
   if (state.currentStep > 0) setStep(state.currentStep - 1);
   else setScreen('mission-select');
   return;
  }

  const stepCircle = target.closest('.step-item');
  if (stepCircle && stepCircle.dataset.stepIndex !== undefined) {
   setStep(parseInt(stepCircle.dataset.stepIndex, 10));
   return;
  }

  if (target.id === 'review-launch-btn') {
   triggerLaunchSequence();
   return;
  }

  if (target.id === 'sim-play-pause-btn') {
   togglePause();
   return;
  }

  const speedBtn = target.closest('[data-sim-speed]');
  if (speedBtn) {
   setSimSpeed(parseInt(speedBtn.dataset.simSpeed, 10));
   return;
  }

  if (target.id === 'sim-skip-btn') {
   skipSimulation();
   return;
  }

  if (target.id === 'download-patch-btn') {
   downloadMissionPatch();
   return;
  }

  const actionChip = target.closest('.report-action-chip');
  if (actionChip) {
   sound.playClick();
   setScreen('build');
   setStep(parseInt(actionChip.dataset.jumpStep, 10));
   return;
  }

  if (target.id === 'report-edit-btn') {
   setScreen('build');
   setStep(0);
   return;
  }

  if (target.id === 'report-new-btn') {
   resetMissionDesign();
   setScreen('mission-select');
   return;
  }

  const catChip = target.closest('.glossary-cat-chip');
  if (catChip) {
   sound.playClick();
   activeGlossaryCat = catChip.dataset.glossaryCat;
   renderGlossaryContent();
   return;
  }

    // About & Credits modal openers & tabs
    if (target.closest('#open-about-btn') || target.closest('#footer-about-btn')) {
      openAboutModal('about');
      return;
    }
    if (target.closest('#footer-scores-btn')) {
      openAboutModal('scores');
      return;
    }
    if (target.closest('#footer-privacy-btn')) {
      openAboutModal('privacy');
      return;
    }
    if (target.closest('#close-about-btn') || target.id === 'about-credits-modal') {
      closeAboutModal();
      return;
    }
    const aboutTab = target.closest('.modal-tab');
    if (aboutTab && aboutTab.dataset.target) {
      switchAboutTab(aboutTab.dataset.target);
      return;
    }

    // Spaceflight Glossary openers & closers
    if (target.closest('#open-glossary-btn') || target.closest('#footer-glossary-btn')) {
      openGlossaryDrawer();
      return;
    }
    if (target.closest('#close-glossary-btn') || target.id === 'glossary-backdrop') {
      closeGlossaryDrawer();
      return;
    }

  const whyBtn = target.closest('[data-why]');
  if (whyBtn) {
   openExplanationModal(whyBtn.dataset.why);
   return;
  }

  if (target.id === 'hero-how-to-play-btn') {
   openHowToPlayModal();
   return;
  }
  if (target.id === 'close-modal-btn' || target.classList.contains('modal-backdrop')) {
   closeModal();
   return;
  }

  if (target.closest('#mobile-dash-toggle-btn') || target.closest('#mobile-dash-summary-text')) {
   const sheet = document.getElementById('mobile-dash-sheet');
   if (sheet) sheet.classList.toggle('open');
   return;
  }

  // Sound toggle
  if (target.closest('#sound-toggle-btn')) {
   const isMuted = sound.toggleMute();
   const icon = document.getElementById('sound-icon');
   if (icon) icon.textContent = isMuted ? '🔇' : '🔊';
   showToast(isMuted ? 'Sound effects muted' : 'Telemetry sound effects enabled', 'info');
   return;
  }

  // Hero buttons
  if (target.id === 'hero-play-solo-btn') {
   sound.playClick();
   state.isTeamMode = false;
   setScreen('mission-select');
   return;
  }

  if (target.id === 'hero-team-mode-btn') {
   sound.playClick();
   setScreen('team-setup');
   return;
  }

  if (target.id === 'hero-how-to-play-btn') {
   sound.playClick();
   const block = document.querySelector('.landing-section-block');
   if (block) {
    block.scrollIntoView({ behavior: 'smooth' });
   }
   return;
  }

  const previewCard = target.closest('.dest-glass-card, .dossier-card, .preview-card');
  if (previewCard && previewCard.dataset.previewDest) {
   sound.playSelect();
   state.isTeamMode = false;
   setMission(previewCard.dataset.previewDest);
   setScreen('build');
   return;
  }

  // Team Setup count buttons
  const teamCountBtn = target.closest('.team-count-btn');
  if (teamCountBtn) {
   sound.playClick();
   selectedTeamCount = parseInt(teamCountBtn.dataset.teamCount, 10);
   renderTeamSetup();
   return;
  }

  // Team Setup Start button
  if (target.id === 'team-start-btn') {
   sound.playSelect();
   const inputs = document.querySelectorAll('.team-player-input');
   const names = Array.from(inputs).map(inp => inp.value.trim() || inp.placeholder);
   initTeamMode(names);
   return;
  }

  // Pass-The-Device Ready button
  if (target.id === 'pass-ready-btn') {
   sound.playSelect();
   confirmPlayerReady();
   return;
  }

  // Team Review Consensus Buttons
  if (target.id === 'team-vote-approve-all-btn') {
   sound.playSelect();
   approveAllCrew();
   showToast('Full crew consensus granted! Ignition unlocked.', 'ok');
   renderBuildScreen(state.result);
   return;
  }

  if (target.id === 'team-vote-approve-btn') {
   sound.playSelect();
   const currentIdx = state.activePlayerIndex || 0;
   const allApproved = submitPlayerVote(currentIdx, true);
   if (allApproved) {
    showToast('All flight crew members have approved! Ignition unlocked.', 'ok');
   } else {
    const nextUnapproved = teamState.players.findIndex((p, idx) => !teamState.approvalVotes[idx] || !teamState.approvalVotes[idx].approved);
    if (nextUnapproved !== -1) {
     state.activePlayerIndex = nextUnapproved;
    }
    showToast(`Vote recorded for ${teamState.players[currentIdx].name}. Next voter: ${teamState.players[state.activePlayerIndex].name}.`, 'info');
   }
   renderBuildScreen(state.result);
   return;
  }

  const quickChangeChip = target.closest('.team-quick-change-chip');
  if (quickChangeChip) {
   sound.playAlert();
   const reason = quickChangeChip.dataset.quickChange;
   const currentIdx = state.activePlayerIndex || 0;
   submitPlayerVote(currentIdx, false, reason);
   showToast(`Engineering change requested by ${teamState.players[currentIdx].name}: ${reason}`, 'warn');
   return;
  }

  if (target.id === 'team-vote-change-btn') {
   sound.playAlert();
   const reasonSelect = document.getElementById('team-change-reason-select');
   const reason = reasonSelect ? reasonSelect.value : 'Re-evaluating engineering margins';
   const currentIdx = state.activePlayerIndex || 0;
   submitPlayerVote(currentIdx, false, reason);
   showToast(`Engineering change requested by ${teamState.players[currentIdx].name}: ${reason}`, 'warn');
   return;
  }

  // Share Design Link
  if (target.id === 'report-share-btn') {
   sound.playClick();
   const hash = exportDesignHash();
   const url = `${window.location.origin}${window.location.pathname}#${hash}`;
   window.location.hash = hash;
   if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
     showToast('Mission design link copied to clipboard!', 'ok');
    }).catch(() => {
     prompt('Copy your mission link:', url);
    });
   } else {
    prompt('Copy your mission link:', url);
   }
   return;
  }

  // Compare Modal
  if (target.id === 'report-compare-btn') {
   sound.playClick();
   openCompareModal();
   return;
  }
  if (target.id === 'close-compare-btn' || target.id === 'compare-modal') {
   closeCompareModal();
   return;
  }
 });

 document.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'team-active-voter-select') {
   state.activePlayerIndex = parseInt(e.target.value, 10);
   renderBuildScreen(state.result);
  }
 });

 document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
   closeModal();
   closeGlossaryDrawer();
  }
  if (e.key === 'Enter' || e.key === ' ') {
   if (document.activeElement && document.activeElement.classList.contains('card-interactive')) {
    document.activeElement.click();
    e.preventDefault();
   }
  }
 });
}

let activeGlossaryCat = 'all';
let glossarySearchQuery = '';

function renderGlossaryContent() {
 const body = document.getElementById('glossary-drawer-body');
 if (!body) return;

 const cats = ['all', 'Orbit', 'Power', 'Comms', 'Science', 'Systems'];

 const filtered = GLOSSARY_TERMS.filter(t => {
  const matchCat = activeGlossaryCat === 'all' || t.category === activeGlossaryCat;
  const q = glossarySearchQuery.toLowerCase().trim();
  const matchQuery = !q || t.term.toLowerCase().includes(q) || t.def.toLowerCase().includes(q) || (t.example && t.example.toLowerCase().includes(q));
  return matchCat && matchQuery;
 });

 const catColors = {
  Orbit: '#38D5FF',
  Power: '#FFB547',
  Comms: '#4D7CFF',
  Science: '#8B5CFF',
  Systems: '#35E0A1'
 };

 body.innerHTML = `
  <!-- Search Bar -->
  <div style="margin-bottom: var(--space-3); position: sticky; top: 0; background: var(--bg-1); z-index: 5; padding-bottom: var(--space-2);">
   <input type="text" id="glossary-search-input" value="${glossarySearchQuery}" placeholder="Search aerospace terms (e.g. orbit, power)..." style="width: 100%; padding: 10px 14px; background: rgba(0,0,0,0.4); border: 1px solid var(--stroke); border-radius: var(--radius-sm); color: #FFF; font-size: 0.92rem;" aria-label="Search glossary terms">
   
   <!-- Category Filter Pills -->
   <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px;">
    ${cats.map(cat => {
     const isActive = activeGlossaryCat === cat;
     return `<button class="btn btn-secondary btn-sm glossary-cat-chip ${isActive ? 'active' : ''}" data-glossary-cat="${cat}" style="font-size: 0.74rem; padding: 3px 8px; ${isActive ? 'background:rgba(56,213,255,0.18); border-color:var(--cyan); color:#FFF;' : 'color:var(--muted);'}">${cat.toUpperCase()}</button>`;
    }).join('')}
   </div>
  </div>

  <!-- Terms List -->
  <div style="display: flex; flex-direction: column; gap: var(--space-3);">
   ${filtered.length === 0 ? `<div class="text-muted" style="text-align: center; padding: var(--space-5);">No aerospace terms match "${glossarySearchQuery}".</div>` : ''}
   ${filtered.map(t => {
    const col = catColors[t.category] || 'var(--cyan)';
    return `
     <div class="card" style="padding: var(--space-4); border-left: 3px solid ${col}; background: var(--grad-card);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
       <h4 style="color: #FFFFFF; font-size: 1.05rem; margin: 0;">${t.term}</h4>
       <span class="badge" style="background: ${col}1a; color: ${col}; border-color: ${col}44; font-size: 0.72rem;">${t.category}</span>
      </div>
      <p style="font-size: 0.88rem; color: var(--text); line-height: 1.5; margin-bottom: 8px;">${t.def}</p>
      ${t.example ? `
       <div style="font-size: 0.8rem; background: rgba(255,255,255,0.03); padding: 5px 8px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.06); color: var(--muted);">
        <strong style="color: var(--cyan);">Real-World Example:</strong> ${t.example}
       </div>
      ` : ''}
     </div>
    `;
   }).join('')}
  </div>
 `;

 // Attach search input listener
 const input = document.getElementById('glossary-search-input');
 if (input) {
  input.addEventListener('input', (e) => {
   glossarySearchQuery = e.target.value;
   renderGlossaryContent();
   const reInput = document.getElementById('glossary-search-input');
   if (reInput) {
    reInput.focus();
    reInput.selectionStart = reInput.selectionEnd = reInput.value.length;
   }
  });
 }
}

function openGlossaryDrawer() {
 const drawer = document.getElementById('glossary-drawer');
 const backdrop = document.getElementById('glossary-backdrop');
 if (!drawer || !backdrop) return;

 renderGlossaryContent();
 drawer.classList.add('open');
 backdrop.classList.add('open');
}
function closeGlossaryDrawer() {
 const drawer = document.getElementById('glossary-drawer');
 const backdrop = document.getElementById('glossary-backdrop');
 if (drawer) drawer.classList.remove('open');
 if (backdrop) backdrop.classList.remove('open');
}

function openExplanationModal(key) {
 const exp = GAUGE_EXPLANATIONS[key];
 if (!exp) return;

 const modal = document.getElementById('info-modal');
 const title = document.getElementById('modal-title');
 const content = document.getElementById('modal-content');
 if (!modal || !title || !content) return;

 title.textContent = exp.title;
 content.innerHTML = `<p style="font-size:1rem; line-height:1.6; color:var(--text);">${exp.desc}</p>`;

 modal.classList.add('open');
}

function openHowToPlayModal() {
 const modal = document.getElementById('info-modal');
 const title = document.getElementById('modal-title');
 const content = document.getElementById('modal-content');
 if (!modal || !title || !content) return;

 title.textContent = 'How to Play Mission Architect';
 content.innerHTML = `
  <div style="display:flex; flex-direction:column; gap:var(--space-4); font-size:0.95rem; line-height:1.6;">
   <div>
    <h4 style="color:var(--accent);">1. Choose Your Destination</h4>
    <p>Pick Earth, Moon, or Mars. Each destination has distinct science targets, budget constraints, and orbital gravity demands.</p>
   </div>
   <div>
    <h4 style="color:var(--accent);">2. Architect Your Spacecraft</h4>
    <p>Select a satellite bus chassis, deploy solar arrays, configure battery storage, and equip an antenna pipe that can clear your daily data stream.</p>
   </div>
   <div>
    <h4 style="color:var(--accent);">3. Choose Payloads & Launch Vehicle</h4>
    <p>Equip instruments relevant to your mission goals. Ensure your launch vehicle possesses sufficient lift capacity for your total wet mass.</p>
   </div>
   <div>
    <h4 style="color:var(--accent);">4. Balance Trade-Offs & Launch</h4>
    <p>Watch the Live Dashboard gauges. Pass all hard constraints to unlock launch and receive an educational post-mission report.</p>
   </div>
  </div>
 `;

 modal.classList.add('open');
}

function closeModal() {
 const modal = document.getElementById('info-modal');
 if (modal) modal.classList.remove('open');
}
