/**
 * Mission Architect - Interactive Simulation Engine
 * Cinematic 2D Orbital Timeline Canvas, Space Weather Events, Telemetry Stream, Sparklines, and Animation Loop.
 */

import { state, setScreen, recordCurrentScore } from './state.js';
import { calculateMission, generateMissionEvents, applyEventsToResult } from './engine.js';
import { sound } from './audio.js';

let animFrameId = null;
let lastTimestamp = 0;

export const simState = {
  active: false,
  paused: false,
  speed: 1, // 1x, 2x, 4x
  elapsed: 0, // In seconds
  totalDuration: 25, // 25 seconds at 1x
  phaseIndex: 0, // 0..4
  phaseProgress: 0,
  events: [],
  activeEvent: null,
  eventShownMap: {},
  particles: [],
  trail: [],
  packetOffset: 0,
  shake: 0,
  history: {
    alt: [],
    power: [],
    data: [],
    sci: []
  },
  lastHistoryTime: 0,
  orbitAngle: 0,
  scienceGathered: 0,
  logs: []
};

const PHASES = [
  { name: 'Launch & Ascent', duration: 5 },
  { name: 'Transit & Orbit Insertion', duration: 5 },
  { name: 'Commissioning & Deployment', duration: 5 },
  { name: 'Science Operations', duration: 6 },
  { name: 'Mission Life & Decommissioning', duration: 4 }
];

let resizeObserver = null;

function setupCanvasResize(canvas) {
  const updateSize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if (rect.width > 0 && rect.height > 0) {
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      simState.dpr = dpr;
      simState.cssWidth = rect.width;
      simState.cssHeight = rect.height;
    }
  };

  updateSize();

  if (typeof ResizeObserver !== 'undefined') {
    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(canvas);
  }
}

export function startSimulation() {
  state.result = calculateMission(state);
  if (!state.result.canLaunch) {
    console.warn('Cannot launch mission with unmet hard constraints');
    return false;
  }

  // Generate deterministic Hard mode events
  simState.events = generateMissionEvents(state);
  simState.eventShownMap = {};
  simState.activeEvent = null;

  // Reset simulation timer and telemetry
  simState.active = true;
  simState.paused = false;
  simState.speed = 1;
  simState.elapsed = 0;
  simState.phaseIndex = 0;
  simState.phaseProgress = 0;
  simState.orbitAngle = -Math.PI / 2;
  simState.scienceGathered = 0;
  simState.particles = [];
  simState.trail = [];
  simState.packetOffset = 0;
  simState.shake = 0;
  simState.history = { alt: [], power: [], data: [], sci: [] };
  simState.lastHistoryTime = 0;
  simState.logs = [];

  // Switch to Simulation Screen
  setScreen('sim');

  // Initialize UI indicators
  updateSimUIStatic();
  addLogMessage('T+ 00:00', `Flight Director console active. Launch vehicle ignition sequence initiated.`);

  // Setup Canvas and start RAF loop
  const canvas = document.getElementById('sim-canvas');
  if (canvas) {
    setupCanvasResize(canvas);
  }

  lastTimestamp = performance.now();
  if (animFrameId) cancelAnimationFrame(animFrameId);
  animFrameId = requestAnimationFrame(simAnimationLoop);

  return true;
}

export function stopSimulation() {
  simState.active = false;
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
}

export function togglePause() {
  simState.paused = !simState.paused;
  const btn = document.getElementById('sim-play-pause-btn');
  if (btn) {
    btn.textContent = simState.paused ? '▶ Resume' : '⏸ Pause';
  }
}

export function setSimSpeed(speed) {
  simState.speed = speed;
  document.querySelectorAll('.sim-speed-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.simSpeed, 10) === speed);
  });
}

export function skipSimulation() {
  finishSimulation();
}

function finishSimulation() {
  stopSimulation();

  // Apply Hard mode event outcomes to final scoring
  if (simState.events.length > 0) {
    applyEventsToResult(state.result, simState.events);
  }

  recordCurrentScore();
  setScreen('report');
}

function updateSimUIStatic() {
  const title = document.getElementById('sim-subtitle');
  if (title) {
    title.textContent = `${state.result.mission.name} (${state.result.mission.destination}) • ${state.result.bus.name} • ${state.difficulty.toUpperCase()} Mode`;
  }
}

function addLogMessage(timestamp, text) {
  simState.logs.push({ time: timestamp, text });
  const logBox = document.getElementById('sim-log-box');
  if (!logBox) return;

  const line = document.createElement('div');
  line.className = 'sim-log-line';
  line.innerHTML = `<span class="sim-log-time">[${timestamp}]</span> ${text}`;
  logBox.appendChild(line);
  logBox.scrollTop = logBox.scrollHeight;
}

function simAnimationLoop(now) {
  if (!simState.active) return;

  const delta = (now - lastTimestamp) / 1000;
  lastTimestamp = now;

  if (!simState.paused && document.visibilityState !== 'hidden') {
    updateSimPhysics(delta * simState.speed);
  }

  renderSimCanvas();
  updateSimTelemetryMeters();

  if (simState.phaseIndex >= 5) {
    finishSimulation();
    return;
  }

  animFrameId = requestAnimationFrame(simAnimationLoop);
}

function updateSimPhysics(dt) {
  simState.elapsed += dt;

  // Calculate current phase
  let accumulated = 0;
  let currentIdx = 0;
  for (let i = 0; i < PHASES.length; i++) {
    if (simState.elapsed < accumulated + PHASES[i].duration) {
      currentIdx = i;
      simState.phaseProgress = (simState.elapsed - accumulated) / PHASES[i].duration;
      break;
    }
    accumulated += PHASES[i].duration;
    if (i === PHASES.length - 1) {
      currentIdx = 5; // Finished
    }
  }

  // Phase transition detection
  if (currentIdx !== simState.phaseIndex && currentIdx < 5) {
    simState.phaseIndex = currentIdx;
    handlePhaseTransition(currentIdx);
  } else if (currentIdx >= 5) {
    simState.phaseIndex = 5;
    return;
  }

  // Update orbit angle
  const orbitalSpeed = (Math.PI * 2) / 8; // Revolution every 8 seconds
  simState.orbitAngle += orbitalSpeed * dt;

  // Animate radio packet movement
  simState.packetOffset = (simState.packetOffset + dt * 0.8) % 1;

  // Decay screen shake
  if (simState.shake > 0.05) {
    simState.shake *= Math.pow(0.85, dt * 60);
  } else {
    simState.shake = 0;
  }

  // Accumulate science points dynamically
  const targetSci = state.result.scienceTotal;
  const sciProgress = Math.min(1, simState.elapsed / simState.totalDuration);
  simState.scienceGathered = Math.round(targetSci * sciProgress * 10) / 10;

  // Sample history every 0.25s for sparklines
  if (simState.elapsed - simState.lastHistoryTime >= 0.25) {
    simState.lastHistoryTime = simState.elapsed;
    const inEclipse = Math.cos(simState.orbitAngle) > 0.35 && Math.abs(Math.sin(simState.orbitAngle)) < 0.6;
    
    // Altitude value
    let altVal = 300;
    if (simState.phaseIndex === 0) altVal = Math.round(simState.phaseProgress * 300);
    else if (state.result.orbit) altVal = state.result.orbit.altitudeKm || 700;

    const pwrVal = inEclipse ? 0 : state.result.powerGen;
    const dataVal = simState.phaseIndex >= 3 ? state.result.dataReturned : 0;
    const sciVal = simState.scienceGathered;

    pushHistory('alt', altVal);
    pushHistory('power', pwrVal);
    pushHistory('data', dataVal);
    pushHistory('sci', sciVal);
  }

  // Check for space weather events in Hard Mode
  checkSimEvents();

  // Particle updates (exhaust flames during thrusting)
  if (simState.phaseIndex === 0 || simState.phaseIndex === 1) {
    spawnExhaustParticles();
  }
  updateParticles(dt);
}

function pushHistory(key, val) {
  const arr = simState.history[key];
  arr.push(val);
  if (arr.length > 25) arr.shift();
}

function handlePhaseTransition(idx) {
  const formatTime = `T+ 00:${Math.round(simState.elapsed).toString().padStart(2, '0')}`;
  
  if (idx === 1) {
    addLogMessage(formatTime, `Main engine cutoff (MECO). Trans-${state.result.mission.destKey} injection burn confirmed.`);
    sound.playLaunch();
  } else if (idx === 2) {
    addLogMessage(formatTime, `Orbit circularized. Solar array wings unfurled; batteries on float charge.`);
    sound.playSelect();
  } else if (idx === 3) {
    addLogMessage(formatTime, `Payload sensors online. Science downlink lock established with ground station.`);
    sound.playSelect();
  } else if (idx === 4) {
    addLogMessage(formatTime, `Primary mission campaign complete. Commencing final flight telemetry analysis.`);
    sound.playClick();
  }

  // Update timeline stepper dots
  for (let i = 0; i < 5; i++) {
    const node = document.getElementById(`sim-phase-node-${i}`);
    if (!node) continue;
    node.classList.remove('active', 'completed');
    if (i === idx) node.classList.add('active');
    else if (i < idx) node.classList.add('completed');
  }

  const progressBar = document.getElementById('sim-timeline-progress');
  if (progressBar) {
    progressBar.style.width = `${(idx / 4) * 100}%`;
  }
}

function checkSimEvents() {
  if (simState.events.length === 0) return;

  simState.events.forEach((evt, idx) => {
    if (evt.phaseIndex === simState.phaseIndex && !simState.eventShownMap[idx]) {
      simState.eventShownMap[idx] = true;
      triggerEventPopup(evt);
    }
  });
}

function triggerEventPopup(evt) {
  const container = document.getElementById('sim-event-popup-container');
  if (!container) return;

  const timeStr = `T+ 00:${Math.round(simState.elapsed).toString().padStart(2, '0')}`;
  addLogMessage(timeStr, `ALERT: ${evt.title} encountered!`);

  // Screen shake on event!
  simState.shake = 10;
  sound.playWarning();

  container.style.display = 'block';
  container.innerHTML = `
    <div class="sim-event-popup ${evt.survived ? 'survived' : 'danger-event'}">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span class="status-chip ${evt.survived ? 'ok' : 'warn'}">
          ${evt.survived ? 'SHIELDED / MITIGATED' : 'ANOMALY DETECTED'}
        </span>
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('sim-event-popup-container').style.display='none'">✕</button>
      </div>
      <h4 style="color:${evt.survived ? 'var(--ok)' : 'var(--danger)'}; margin-bottom:4px; font-size:1.05rem;">${evt.title}</h4>
      <p style="font-size:0.88rem; line-height:1.5; color:var(--text);">${evt.desc}</p>
      <div style="margin-top:8px; font-size:0.82rem; color:var(--muted); display:flex; justify-content:space-between;">
        <span><strong>Mitigation:</strong> ${evt.mitigationEquipment}</span>
        <span style="color:${evt.survived ? 'var(--ok)' : 'var(--warn)'}; font-weight:600;">${evt.survived ? '✓ Operational' : '⚠️ Unprotected (-10 pts)'}</span>
      </div>
    </div>
  `;

  // Auto-dismiss after 6 seconds
  setTimeout(() => {
    if (container) container.style.display = 'none';
  }, 6000);
}

function spawnExhaustParticles() {
  for (let i = 0; i < 2; i++) {
    simState.particles.push({
      x: 0,
      y: 0,
      vx: (Math.random() - 0.5) * 20,
      vy: Math.random() * 40 + 20,
      life: 0.5,
      maxLife: 0.5,
      size: Math.random() * 3 + 2
    });
  }
}

function updateParticles(dt) {
  for (let i = simState.particles.length - 1; i >= 0; i--) {
    const p = simState.particles[i];
    p.life -= dt;
    p.y += p.vy * dt;
    p.x += p.vx * dt;
    if (p.life <= 0) {
      simState.particles.splice(i, 1);
    }
  }
}

function renderSimCanvas() {
  const canvas = document.getElementById('sim-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = simState.dpr || window.devicePixelRatio || 1;
  const w = simState.cssWidth || (canvas.width / dpr) || 800;
  const h = simState.cssHeight || (canvas.height / dpr) || 380;

  ctx.save();
  ctx.scale(dpr, dpr);

  // Apply subtle canvas screen-shake if active
  if (simState.shake > 0.05) {
    const shakeX = (Math.random() - 0.5) * simState.shake;
    const shakeY = (Math.random() - 0.5) * simState.shake;
    ctx.translate(shakeX, shakeY);
  }

  ctx.clearRect(0, 0, w, h);

  // 1. Cosmic Deep Ink Background (Retro Dribbble Space)
  ctx.fillStyle = '#0A0D12';
  ctx.fillRect(0, 0, w, h);

  // Subtle engraved starfield stipples & crosshairs
  ctx.fillStyle = 'rgba(250, 249, 245, 0.75)';
  for (let i = 0; i < 55; i++) {
    const sx = (i * 137.5) % w;
    const sy = (i * 269.3) % h;
    const size = (i % 5 === 0) ? 2 : 1;
    ctx.fillRect(sx, sy, size, size);
    
    // Occasional 4-point diamond star spark
    if (i % 11 === 0) {
      ctx.strokeStyle = 'rgba(250, 249, 245, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx - 3, sy); ctx.lineTo(sx + 3, sy);
      ctx.moveTo(sx, sy - 3); ctx.lineTo(sx, sy + 3);
      ctx.stroke();
    }
  }

  const cx = w / 2 + 30; // Centered orbital focus
  const cy = h / 2;
  const destKey = state.result.mission.destKey;

  // 2. Vintage Engraved Celestial Sun on Left Edge
  const sunX = -30;
  const sunY = cy;
  const shimmer = Math.sin(simState.elapsed * 3) * 6;
  
  // Outer concentric engraved aura rings
  ctx.save();
  ctx.strokeStyle = 'rgba(250, 249, 245, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(sunX, sunY, 120 + shimmer, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(sunX, sunY, 190 + shimmer, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(sunX, sunY, 260 + shimmer, 0, Math.PI * 2); ctx.stroke();

  // Subtle solar light rays projecting toward right
  ctx.strokeStyle = 'rgba(255, 178, 36, 0.15)';
  ctx.lineWidth = 1.2;
  for (let a = -0.45; a <= 0.45; a += 0.09) {
    ctx.beginPath();
    ctx.moveTo(sunX + 35, sunY);
    ctx.lineTo(w, cy + Math.tan(a) * (w - sunX));
    ctx.stroke();
  }

  // Solid cream sun disk on the left
  ctx.fillStyle = '#FAF9F5';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 70, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#FFB224';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 73, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 3. Crisp Astronomical Shadow Cone (Planetary Eclipse)
  const planetRadius = 48;
  const shadowCone = ctx.createLinearGradient(cx, cy, w + 40, cy);
  shadowCone.addColorStop(0, 'rgba(10, 13, 18, 0.95)');
  shadowCone.addColorStop(0.5, 'rgba(10, 13, 18, 0.85)');
  shadowCone.addColorStop(1, 'rgba(10, 13, 18, 0.4)');

  ctx.beginPath();
  ctx.moveTo(cx, cy - planetRadius);
  ctx.lineTo(w + 40, cy - (planetRadius * 2.6));
  ctx.lineTo(w + 40, cy + (planetRadius * 2.6));
  ctx.lineTo(cx, cy + planetRadius);
  ctx.closePath();
  ctx.fillStyle = shadowCone;
  ctx.fill();

  // Fine boundary stroke on shadow cone
  ctx.strokeStyle = 'rgba(250, 249, 245, 0.15)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(cx, cy - planetRadius); ctx.lineTo(w + 40, cy - (planetRadius * 2.6));
  ctx.moveTo(cx, cy + planetRadius); ctx.lineTo(w + 40, cy + (planetRadius * 2.6));
  ctx.stroke();
  ctx.setLineDash([]);

  // 4. Orbit Ellipse Ring: Crisp Cream Dashed Line
  const orbitRadiusX = Math.min(250, (w / 2) - 60);
  const orbitRadiusY = Math.min(125, (h / 2) - 35);

  ctx.beginPath();
  ctx.ellipse(cx, cy, orbitRadiusX, orbitRadiusY, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(250, 249, 245, 0.45)';
  ctx.lineWidth = 1.6;
  ctx.setLineDash([6, 6]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Calculate current spacecraft coordinates
  let satX = cx + Math.cos(simState.orbitAngle) * orbitRadiusX;
  let satY = cy + Math.sin(simState.orbitAngle) * orbitRadiusY;

  // During Launch phase (Phase 0), spacecraft ascends from surface
  if (simState.phaseIndex === 0) {
    const launchRatio = simState.phaseProgress;
    satX = cx + (Math.cos(-Math.PI / 2) * orbitRadiusX) * launchRatio;
    satY = (cy - 45) - (orbitRadiusY - 45) * launchRatio;
  }

  // Update orbit trail history
  if (!simState.paused && simState.phaseIndex > 0) {
    simState.trail.push({ x: satX, y: satY });
    if (simState.trail.length > 28) simState.trail.shift();
  }

  // 5. Draw Fading Orbit Trail behind Spacecraft
  if (simState.trail.length > 1) {
    ctx.save();
    for (let i = 1; i < simState.trail.length; i++) {
      const p1 = simState.trail[i - 1];
      const p2 = simState.trail[i];
      const alpha = (i / simState.trail.length) * 0.75;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = `rgba(255, 178, 36, ${alpha})`;
      ctx.lineWidth = 1.5 + (i / simState.trail.length) * 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  // 6. Draw Center Planet with Astronomical Engraving
  drawPlanet(ctx, cx, cy, destKey);

  // 7. Communications Radio Beams & Data Packets
  const inEclipse = Math.cos(simState.orbitAngle) > 0.35 && Math.abs(Math.sin(simState.orbitAngle)) < 0.6;
  if (simState.phaseIndex >= 2 && !inEclipse) {
    drawCommunicationsLink(ctx, satX, satY, cx, cy);
  }

  // 8. Draw Rocket (Phase 0) or Spacecraft (Phases 1..4)
  if (simState.phaseIndex === 0) {
    // Realistic multi-stage launch vehicle during liftoff & ascent
    drawRealisticRocketLaunch(ctx, satX, satY, simState.phaseProgress, state.launcherId);

    // Dynamic Rocket Exhaust Particles
    if (!simState.paused) {
      spawnExhaustParticles(true);
    }
    ctx.save();
    ctx.translate(satX, satY);
    const pitchAngle = -Math.PI / 2 + (simState.phaseProgress * 1.3);
    ctx.rotate(pitchAngle + Math.PI / 2);
    for (const p of simState.particles) {
      const alpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y + 36, p.size, 0, Math.PI * 2);
      if (p.isSmoke) {
        ctx.fillStyle = `rgba(220, 225, 235, ${alpha * 0.45})`;
      } else {
        ctx.fillStyle = `rgba(255, 120, 20, ${alpha * 0.9})`;
      }
      ctx.fill();
    }
    ctx.restore();
  } else {
    // Realistic scientific satellite in orbit
    drawSpacecraft(ctx, satX, satY, simState.orbitAngle, inEclipse);

    // In-space thruster firing during orbit transit / insertion burn (Phase 1)
    if (simState.phaseIndex === 1) {
      if (!simState.paused) {
        spawnExhaustParticles(false);
      }
      ctx.save();
      ctx.translate(satX, satY);
      for (const p of simState.particles) {
        const alpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y + 14, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 160, 40, ${alpha * 0.8})`;
        ctx.fill();
      }
      ctx.restore();
    }
  }

  ctx.restore();
}

function drawCommunicationsLink(ctx, satX, satY, planetX, planetY) {
  ctx.save();

  // Dotted carrier line in retro cream
  ctx.beginPath();
  ctx.moveTo(satX, satY);
  ctx.lineTo(planetX, planetY);
  ctx.strokeStyle = 'rgba(250, 249, 245, 0.4)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([3, 5]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Traveling golden amber data packets
  const dx = planetX - satX;
  const dy = planetY - satY;
  
  for (let i = 0; i < 3; i++) {
    const t = (simState.packetOffset + i * 0.33) % 1;
    const px = satX + dx * t;
    const py = satY + dy * t;
    
    // Golden packet dot with crisp black ink outline
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#FFB224';
    ctx.fill();
    ctx.strokeStyle = '#0A0D12';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();
}

function drawPlanet(ctx, x, y, destKey) {
  ctx.save();
  const radius = 48;

  if (destKey === 'earth') {
    // 1. Atmospheric Limb Glow (Soft Blue Haze)
    const haze = ctx.createRadialGradient(x, y, radius - 2, x, y, radius + 18);
    haze.addColorStop(0, 'rgba(56, 213, 255, 0.55)');
    haze.addColorStop(0.5, 'rgba(14, 165, 233, 0.2)');
    haze.addColorStop(1, 'rgba(56, 213, 255, 0)');
    ctx.fillStyle = haze;
    ctx.beginPath();
    ctx.arc(x, y, radius + 18, 0, Math.PI * 2);
    ctx.fill();

    // 2. Earth Ocean Base (Luminous Blue Sphere)
    const oceanGrad = ctx.createRadialGradient(x - 20, y - 5, 8, x, y, radius);
    oceanGrad.addColorStop(0, '#38BDF8');
    oceanGrad.addColorStop(0.35, '#0284C7');
    oceanGrad.addColorStop(0.85, '#0369A1');
    oceanGrad.addColorStop(1, '#0C2340');
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = oceanGrad;
    ctx.fill();
    ctx.strokeStyle = '#0A0D12';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // 3. Continents & Clouds (Clipped inside disc)
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();

    // Vibrant Green Continents (North America / Eurasia / Africa shapes)
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.ellipse(x - 14, y - 12, 17, 13, -0.2, 0, Math.PI * 2);
    ctx.ellipse(x + 6, y + 15, 19, 14, 0.35, 0, Math.PI * 2);
    ctx.ellipse(x - 22, y + 10, 11, 8, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Topographical green/emerald accents
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.arc(x - 12, y - 10, 8, 0, Math.PI * 2);
    ctx.arc(x + 8, y + 16, 9, 0, Math.PI * 2);
    ctx.fill();

    // Swirling Cloud Formations (Translucent White)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(x - 6, y - 20, 22, 0.2, 2.0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 2, y + 8, 26, 0.5, 2.5);
    ctx.stroke();

    // Natural Day/Night Terminator (Sun is on left)
    const termGrad = ctx.createLinearGradient(x - 8, y, x + radius, y);
    termGrad.addColorStop(0, 'rgba(10, 13, 18, 0)');
    termGrad.addColorStop(0.35, 'rgba(10, 13, 18, 0.55)');
    termGrad.addColorStop(0.8, 'rgba(10, 13, 18, 0.92)');
    termGrad.addColorStop(1, '#0A0D12');
    ctx.fillStyle = termGrad;
    ctx.fillRect(x - 8, y - radius, radius + 12, radius * 2);

    ctx.restore();

  } else if (destKey === 'moon') {
    // Moon (Lunar Grey with authentic Maria and Craters)
    const lunarGrad = ctx.createRadialGradient(x - 20, y - 5, 8, x, y, radius);
    lunarGrad.addColorStop(0, '#F1F5F9');
    lunarGrad.addColorStop(0.4, '#CBD5E1');
    lunarGrad.addColorStop(0.85, '#94A3B8');
    lunarGrad.addColorStop(1, '#334155');
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = lunarGrad;
    ctx.fill();
    ctx.strokeStyle = '#0A0D12';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();

    // Dark Basaltic Maria
    ctx.fillStyle = 'rgba(71, 85, 105, 0.65)';
    ctx.beginPath();
    ctx.ellipse(x - 14, y - 10, 14, 10, -0.3, 0, Math.PI * 2);
    ctx.ellipse(x + 8, y + 12, 16, 12, 0.2, 0, Math.PI * 2);
    ctx.ellipse(x - 4, y + 18, 9, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Distinct Craters with Rims
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x - 15, y - 12, 10, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 10, y + 8, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 6, y + 18, 6, 0, Math.PI * 2); ctx.stroke();

    // Terminator
    const termGrad = ctx.createLinearGradient(x - 8, y, x + radius, y);
    termGrad.addColorStop(0, 'rgba(10, 13, 18, 0)');
    termGrad.addColorStop(0.4, 'rgba(10, 13, 18, 0.6)');
    termGrad.addColorStop(0.85, 'rgba(10, 13, 18, 0.94)');
    termGrad.addColorStop(1, '#0A0D12');
    ctx.fillStyle = termGrad;
    ctx.fillRect(x - 8, y - radius, radius + 12, radius * 2);

    ctx.restore();

  } else {
    // Mars (Red Planet with Polar Ice Cap and Canyon)
    const marsHaze = ctx.createRadialGradient(x, y, radius - 2, x, y, radius + 16);
    marsHaze.addColorStop(0, 'rgba(251, 146, 60, 0.45)');
    marsHaze.addColorStop(0.5, 'rgba(234, 88, 12, 0.15)');
    marsHaze.addColorStop(1, 'rgba(251, 146, 60, 0)');
    ctx.fillStyle = marsHaze;
    ctx.beginPath();
    ctx.arc(x, y, radius + 16, 0, Math.PI * 2);
    ctx.fill();

    const marsGrad = ctx.createRadialGradient(x - 20, y - 5, 8, x, y, radius);
    marsGrad.addColorStop(0, '#FB923C');
    marsGrad.addColorStop(0.35, '#EA580C');
    marsGrad.addColorStop(0.85, '#C2410C');
    marsGrad.addColorStop(1, '#431407');
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = marsGrad;
    ctx.fill();
    ctx.strokeStyle = '#0A0D12';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();

    // Dark Martian Volcanic Terrain (Syrtis Major)
    ctx.fillStyle = 'rgba(67, 20, 7, 0.65)';
    ctx.beginPath();
    ctx.ellipse(x + 4, y + 10, 22, 12, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Valles Marineris Canyon
    ctx.strokeStyle = '#270803';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 22, y + 3);
    ctx.lineTo(x + 18, y + 8);
    ctx.stroke();

    // Brilliant White Polar Ice Cap (North Pole)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(x - 4, y - radius + 7, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#C2410C';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Terminator
    const termGrad = ctx.createLinearGradient(x - 8, y, x + radius, y);
    termGrad.addColorStop(0, 'rgba(10, 13, 18, 0)');
    termGrad.addColorStop(0.35, 'rgba(10, 13, 18, 0.6)');
    termGrad.addColorStop(0.85, 'rgba(10, 13, 18, 0.94)');
    termGrad.addColorStop(1, '#0A0D12');
    ctx.fillStyle = termGrad;
    ctx.fillRect(x - 8, y - radius, radius + 12, radius * 2);

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draws an authentic, realistic multi-stage rocket ascending during Phase 0 (Launch)
 */
function drawRealisticRocketLaunch(ctx, x, y, progress, launcherId) {
  ctx.save();
  ctx.translate(x, y);

  // Gravity turn pitch: starts nearly vertical (-PI/2), smoothly pitches to ~ -0.25 rad
  const pitchAngle = -Math.PI / 2 + (progress * 1.3);
  ctx.rotate(pitchAngle + Math.PI / 2);

  const isLight = launcherId === 'light';
  const isHeavy = launcherId === 'heavy';
  const isStaged = progress >= 0.72; // Fairing separation & staging point

  // Rocket scales
  const rocketW = isLight ? 12 : (isHeavy ? 36 : 18);
  const rocketH = isLight ? 54 : 68;

  // 1. If staged, draw fairing halves tumbling away & satellite emerging
  if (isStaged) {
    const stageProgress = (progress - 0.72) / 0.28;
    const fairingDist = stageProgress * 32;
    const fairingRot = stageProgress * 0.9;

    // Left Fairing Half tumbling outward
    ctx.save();
    ctx.translate(-fairingDist, -rocketH/2 - 8);
    ctx.rotate(-fairingRot);
    ctx.fillStyle = '#FAF9F5';
    ctx.strokeStyle = '#0A0D12';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.quadraticCurveTo(-8, -4, -6, 12);
    ctx.lineTo(0, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Right Fairing Half tumbling outward
    ctx.save();
    ctx.translate(fairingDist, -rocketH/2 - 8);
    ctx.rotate(fairingRot);
    ctx.fillStyle = '#FAF9F5';
    ctx.strokeStyle = '#0A0D12';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.quadraticCurveTo(8, -4, 6, 12);
    ctx.lineTo(0, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Revealed Satellite at the payload mount
    ctx.save();
    ctx.translate(0, -rocketH/2 - 4);
    drawSpacecraft(ctx, 0, 0, -Math.PI / 2, false);
    ctx.restore();

    // Second Stage Vacuum Engine Burn (clean violet/cyan plume)
    const flicker = 0.9 + Math.sin(simState.elapsed * 45) * 0.15;
    ctx.save();
    ctx.translate(0, -rocketH/2 + 20);
    // Vacuum engine nozzle
    ctx.fillStyle = '#1A1E26';
    ctx.beginPath();
    ctx.moveTo(-4, 0); ctx.lineTo(-7, 10); ctx.lineTo(7, 10); ctx.lineTo(4, 0);
    ctx.closePath();
    ctx.fill();

    // Transparent vacuum plume
    const vacGrad = ctx.createRadialGradient(0, 14, 2, 0, 24, 22);
    vacGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    vacGrad.addColorStop(0.3, 'rgba(120, 215, 255, 0.85)');
    vacGrad.addColorStop(0.7, 'rgba(168, 85, 247, 0.4)');
    vacGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = vacGrad;
    ctx.beginPath();
    ctx.ellipse(0, 24 * flicker, 14 * flicker, 20 * flicker, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
    return;
  }

  // 2. Full Launch Vehicle Rocket Body (Pre-Staging Ascent)
  // Left and Right Strap-on Boosters if Heavy
  if (isHeavy) {
    [-15, 15].forEach(boosterX => {
      ctx.save();
      ctx.translate(boosterX, 0);
      // Aerodynamic nosecone
      ctx.fillStyle = '#FAF9F5';
      ctx.strokeStyle = '#0A0D12';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -rocketH/2 + 10);
      ctx.lineTo(-5, -rocketH/2 + 18);
      ctx.lineTo(5, -rocketH/2 + 18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Booster cylinder body
      ctx.fillStyle = '#FAF9F5';
      ctx.beginPath();
      ctx.roundRect(-5, -rocketH/2 + 18, 10, rocketH - 18, 1);
      ctx.fill();
      ctx.stroke();

      // Attachment struts to center core
      ctx.fillStyle = '#0A0D12';
      ctx.fillRect(boosterX < 0 ? 5 : -7, -rocketH/2 + 28, 2, 3);
      ctx.fillRect(boosterX < 0 ? 5 : -7, rocketH/2 - 12, 2, 3);

      // Booster engine bells
      ctx.beginPath();
      ctx.moveTo(-4, rocketH/2);
      ctx.lineTo(-6, rocketH/2 + 6);
      ctx.lineTo(6, rocketH/2 + 6);
      ctx.lineTo(4, rocketH/2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  }

  // Center Core Main Rocket Body
  const coreW = isLight ? 12 : 16;
  const halfCore = coreW / 2;

  // Payload Fairing (Aerodynamic Ogive Nosecone)
  ctx.fillStyle = '#FAF9F5';
  ctx.strokeStyle = '#0A0D12';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, -rocketH/2 - 14);
  ctx.quadraticCurveTo(-halfCore - 2, -rocketH/2 - 4, -halfCore, -rocketH/2 + 4);
  ctx.lineTo(halfCore, -rocketH/2 + 4);
  ctx.quadraticCurveTo(halfCore + 2, -rocketH/2 - 4, 0, -rocketH/2 - 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Fairing separation line
  ctx.strokeStyle = '#0A0D12';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(0, -rocketH/2 - 12);
  ctx.lineTo(0, -rocketH/2 + 4);
  ctx.stroke();
  ctx.setLineDash([]);

  // Second Stage
  ctx.fillStyle = '#FAF9F5';
  ctx.strokeStyle = '#0A0D12';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.rect(-halfCore, -rocketH/2 + 4, coreW, 16);
  ctx.fill();
  ctx.stroke();

  // Interstage lattice ring
  ctx.fillStyle = '#1A1E26';
  ctx.fillRect(-halfCore, -rocketH/2 + 20, coreW, 6);

  // Hypersonic Titanium Grid Fins (on medium/heavy)
  if (!isLight) {
    ctx.fillStyle = '#FAF9F5';
    ctx.strokeStyle = '#0A0D12';
    ctx.lineWidth = 1.2;
    ctx.fillRect(-halfCore - 5, -rocketH/2 + 20, 5, 5);
    ctx.strokeRect(-halfCore - 5, -rocketH/2 + 20, 5, 5);
    ctx.fillRect(halfCore, -rocketH/2 + 20, 5, 5);
    ctx.strokeRect(halfCore, -rocketH/2 + 20, 5, 5);
  }

  // First Stage Main Booster Body
  ctx.fillStyle = '#FAF9F5';
  ctx.strokeStyle = '#0A0D12';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.rect(-halfCore, -rocketH/2 + 26, coreW, rocketH - 26);
  ctx.fill();
  ctx.stroke();

  // Vertical avionics conduit raceway
  ctx.strokeStyle = '#0A0D12';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-halfCore + 2.5, -rocketH/2 + 26);
  ctx.lineTo(-halfCore + 2.5, rocketH/2);
  ctx.stroke();

  // Engine Bells at Base
  ctx.fillStyle = '#0A0D12';
  ctx.beginPath();
  ctx.moveTo(-halfCore + 2, rocketH/2);
  ctx.lineTo(-halfCore, rocketH/2 + 6);
  ctx.lineTo(halfCore, rocketH/2 + 6);
  ctx.lineTo(halfCore - 2, rocketH/2);
  ctx.closePath();
  ctx.fill();

  // 3. Supersonic Rocket Exhaust Plume & Shock Diamonds
  const flicker = 0.85 + Math.sin(simState.elapsed * 55) * 0.18;
  const flameH = (isHeavy ? 54 : (isLight ? 36 : 46)) * flicker;
  const flameW = (isHeavy ? 28 : (isLight ? 14 : 18)) * flicker;
  const flameY = rocketH / 2 + 5;

  // Outer turbulent fiery exhaust (Orange/Red)
  const outerGrad = ctx.createLinearGradient(0, flameY, 0, flameY + flameH);
  outerGrad.addColorStop(0, 'rgba(255, 230, 80, 0.95)');
  outerGrad.addColorStop(0.3, 'rgba(255, 130, 20, 0.9)');
  outerGrad.addColorStop(0.7, 'rgba(235, 60, 20, 0.7)');
  outerGrad.addColorStop(1, 'rgba(235, 60, 20, 0)');

  ctx.fillStyle = outerGrad;
  ctx.beginPath();
  ctx.moveTo(-flameW / 2, flameY);
  ctx.quadraticCurveTo(-flameW * 0.8, flameY + flameH * 0.5, 0, flameY + flameH);
  ctx.quadraticCurveTo(flameW * 0.8, flameY + flameH * 0.5, flameW / 2, flameY);
  ctx.closePath();
  ctx.fill();

  // Inner blazing plasma core (White / Pale Yellow)
  const innerGrad = ctx.createLinearGradient(0, flameY, 0, flameY + flameH * 0.6);
  innerGrad.addColorStop(0, '#FFFFFF');
  innerGrad.addColorStop(0.5, '#FFE259');
  innerGrad.addColorStop(1, 'rgba(255, 180, 40, 0)');

  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.moveTo(-flameW * 0.35, flameY);
  ctx.lineTo(0, flameY + flameH * 0.6);
  ctx.lineTo(flameW * 0.35, flameY);
  ctx.closePath();
  ctx.fill();

  // Supersonic Shock Diamond Discs
  ctx.fillStyle = '#FFFFFF';
  for (let d = 1; d <= 3; d++) {
    const dy = flameY + (d * 9 * flicker);
    ctx.beginPath();
    ctx.ellipse(0, dy, 3.5, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draws a realistic scientific satellite with detailed MLI foil, solar panels, and sensors
 */
function drawSpacecraft(ctx, x, y, angle, inEclipse) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2);

  const busId = (state && state.busId) ? state.busId : 'small';
  const panelId = (state && state.panelId) ? state.panelId : 'medium';
  const antennaId = (state && state.antennaId) ? state.antennaId : 'dish_small';
  const instrumentIds = (state && state.instrumentIds) ? state.instrumentIds : [];

  // 1. Central Bus Structure with Gold MLI (Multi-Layer Insulation) Foil
  const isCube = busId === 'cube';
  const isHeavy = busId === 'heavy';
  const busW = isCube ? 14 : (isHeavy ? 26 : 20);
  const busH = isCube ? 14 : (isHeavy ? 26 : 20);

  // MLI Blanket texture
  const foilGrad = ctx.createLinearGradient(-busW/2, -busH/2, busW/2, busH/2);
  if (inEclipse) {
    foilGrad.addColorStop(0, '#A39E93');
    foilGrad.addColorStop(0.5, '#7C776D');
    foilGrad.addColorStop(1, '#5A564E');
  } else {
    foilGrad.addColorStop(0, '#F6D365');
    foilGrad.addColorStop(0.4, '#FDA085');
    foilGrad.addColorStop(0.7, '#F6D365');
    foilGrad.addColorStop(1, '#D97706');
  }

  // Bus chassis body
  ctx.fillStyle = foilGrad;
  ctx.strokeStyle = '#0A0D12';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(-busW/2, -busH/2, busW, busH, isHeavy ? 4 : 2);
  ctx.fill();
  ctx.stroke();

  // MLI Quilted seams / foil ribs
  ctx.strokeStyle = inEclipse ? '#4A463F' : 'rgba(10, 13, 18, 0.4)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-busW/2 + 4, -busH/2); ctx.lineTo(-busW/2 + 4, busH/2);
  ctx.moveTo(busW/2 - 4, -busH/2); ctx.lineTo(busW/2 - 4, busH/2);
  ctx.moveTo(-busW/2, 0); ctx.lineTo(busW/2, 0);
  ctx.stroke();

  // Attitude Control Thruster (RCS) Pods on corners
  ctx.fillStyle = '#0A0D12';
  ctx.fillRect(-busW/2 - 1.5, -busH/2 - 1.5, 3, 3);
  ctx.fillRect(busW/2 - 1.5, -busH/2 - 1.5, 3, 3);
  ctx.fillRect(-busW/2 - 1.5, busH/2 - 1.5, 3, 3);
  ctx.fillRect(busW/2 - 1.5, busH/2 - 1.5, 3, 3);

  // Optical sensor aperture lens on top face
  ctx.fillStyle = '#0A0D12';
  ctx.beginPath();
  ctx.arc(0, -busH/2 + 4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = inEclipse ? '#60A5FA' : '#38BDF8';
  ctx.beginPath();
  ctx.arc(0, -busH/2 + 4, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // 2. Realistic Solar Arrays / Power Source
  if (panelId === 'rtg') {
    // Cylindrical RTG Unit with Heat Radiator Fins
    ctx.save();
    ctx.translate(-busW/2 - 8, 0);
    ctx.fillStyle = inEclipse ? '#6B7280' : '#1F2937';
    ctx.strokeStyle = '#0A0D12';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-4, -8, 8, 16, 2);
    ctx.fill();
    ctx.stroke();
    // Cooling radiator fins
    ctx.strokeStyle = inEclipse ? '#9CA3AF' : '#F59E0B';
    ctx.lineWidth = 1;
    for (let f = -6; f <= 6; f += 3) {
      ctx.beginPath();
      ctx.moveTo(-7, f); ctx.lineTo(7, f);
      ctx.stroke();
    }
    // Thermal emitter core
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // Realistic Photovoltaic Multi-Junction Solar Wings
    const wingWidth = panelId === 'medium' ? 32 : (panelId === 'small' ? 16 : 24);
    const wingHeight = panelId === 'medium' ? 18 : 14;
    const cellColor = inEclipse ? '#374151' : '#1E3A8A'; // Deep space blue cells
    const cellBorder = inEclipse ? '#4B5563' : '#F59E0B'; // Gold busbars

    // Left Solar Wing
    ctx.save();
    ctx.translate(-busW/2, 0);
    // Hinge strut
    ctx.strokeStyle = '#0A0D12';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-4, 0); ctx.stroke();

    // Wing panel
    ctx.fillStyle = cellColor;
    ctx.strokeStyle = '#0A0D12';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-4 - wingWidth, -wingHeight/2, wingWidth, wingHeight, 1.5);
    ctx.fill();
    ctx.stroke();

    // Gold solar cell gridlines
    ctx.strokeStyle = cellBorder;
    ctx.lineWidth = 0.9;
    const cols = panelId === 'medium' ? 4 : 2;
    for (let c = 1; c < cols; c++) {
      const gx = -4 - (c * (wingWidth / cols));
      ctx.beginPath();
      ctx.moveTo(gx, -wingHeight/2); ctx.lineTo(gx, wingHeight/2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-4 - wingWidth, 0); ctx.lineTo(-4, 0);
    ctx.stroke();
    ctx.restore();

    // Right Solar Wing
    ctx.save();
    ctx.translate(busW/2, 0);
    // Hinge strut
    ctx.strokeStyle = '#0A0D12';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(4, 0); ctx.stroke();

    // Wing panel
    ctx.fillStyle = cellColor;
    ctx.strokeStyle = '#0A0D12';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(4, -wingHeight/2, wingWidth, wingHeight, 1.5);
    ctx.fill();
    ctx.stroke();

    // Gold solar cell gridlines
    ctx.strokeStyle = cellBorder;
    ctx.lineWidth = 0.9;
    for (let c = 1; c < cols; c++) {
      const gx = 4 + (c * (wingWidth / cols));
      ctx.beginPath();
      ctx.moveTo(gx, -wingHeight/2); ctx.lineTo(gx, wingHeight/2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(4, 0); ctx.lineTo(4 + wingWidth, 0);
    ctx.stroke();
    ctx.restore();
  }

  // 3. Realistic Communications Antenna
  if (antennaId === 'high') {
    // Large High-Gain Parabolic Cassegrain Dish
    ctx.save();
    ctx.translate(0, -busH/2 - 2);
    // Dish Gimbal Boom
    ctx.strokeStyle = '#0A0D12';
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(0, -5); ctx.stroke();
    // Parabolic Reflector (Gold Mesh)
    ctx.fillStyle = inEclipse ? '#9CA3AF' : '#FCD34D';
    ctx.strokeStyle = '#0A0D12';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, -11, 9, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Subreflector Feedhorn Tripod
    ctx.strokeStyle = '#0A0D12';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-5, -11); ctx.lineTo(0, -16);
    ctx.moveTo(5, -11); ctx.lineTo(0, -16);
    ctx.stroke();
    ctx.fillStyle = inEclipse ? '#F59E0B' : '#10B981';
    ctx.beginPath(); ctx.arc(0, -16, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else if (antennaId === 'low') {
    // Helical / Dual Whip Antenna
    ctx.save();
    ctx.translate(0, -busH/2);
    ctx.strokeStyle = '#0A0D12';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-4, 0); ctx.lineTo(-7, -10);
    ctx.moveTo(4, 0); ctx.lineTo(7, -10);
    ctx.stroke();
    ctx.fillStyle = inEclipse ? '#F59E0B' : '#10B981';
    ctx.beginPath();
    ctx.arc(-7, -10, 1.5, 0, Math.PI * 2);
    ctx.arc(7, -10, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // Medium Steerable Parabolic Dish
    ctx.save();
    ctx.translate(0, -busH/2);
    ctx.beginPath();
    ctx.arc(0, -8, 6, Math.PI, 0);
    ctx.fillStyle = inEclipse ? '#D1D5DB' : '#FAF9F5';
    ctx.fill();
    ctx.strokeStyle = '#0A0D12';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    // Feedhorn & Active Beacon
    ctx.fillStyle = inEclipse ? '#F59E0B' : '#10B981';
    ctx.beginPath();
    ctx.arc(0, -12, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0A0D12';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  // 4. Extended Scientific Instrument Booms
  if (instrumentIds.includes('mag')) {
    // Deployable Magnetometer Boom extending diagonally downward
    ctx.save();
    ctx.translate(busW/2 - 2, busH/2 - 2);
    ctx.strokeStyle = '#0A0D12';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(12, 12);
    ctx.stroke();
    // Fluxgate sensor heads
    ctx.fillStyle = '#FFB224';
    ctx.beginPath(); ctx.arc(12, 12, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function updateSimTelemetryMeters() {
  const met = document.getElementById('sim-met-timer');
  if (met) {
    const sec = Math.floor(simState.elapsed);
    met.textContent = `MET: T+ 00:${sec.toString().padStart(2, '0')}`;
  }

  const altMeter = document.getElementById('sim-meter-alt');
  const phaseTag = document.getElementById('sim-meter-phase-tag');
  if (altMeter) {
    if (simState.phaseIndex === 0) {
      altMeter.textContent = `${Math.round(simState.phaseProgress * 300)} km (Ascent)`;
      if (phaseTag) phaseTag.textContent = 'BOOST';
    } else {
      altMeter.textContent = `${state.result.orbit ? state.result.orbit.name : 'Stable Orbit'}`;
      if (phaseTag) phaseTag.textContent = 'INSERTION COMPLETE';
    }
  }

  const powerMeter = document.getElementById('sim-meter-power');
  const pwrTag = document.getElementById('sim-meter-power-tag');
  const inEclipse = Math.cos(simState.orbitAngle) > 0.35 && Math.abs(Math.sin(simState.orbitAngle)) < 0.6;
  
  if (powerMeter) {
    if (inEclipse) {
      powerMeter.innerHTML = `
        <span style="display:inline-flex; align-items:center; gap:4px; color:var(--warn); font-weight:600;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          In eclipse (battery active)
        </span>
        <span style="font-size:0.82rem; color:var(--muted); margin-left:6px;">${state.result.powerUse} W drawn</span>
      `;
      if (pwrTag) {
        pwrTag.textContent = 'BATTERY DRAIN';
        pwrTag.style.color = 'var(--warn)';
      }
    } else {
      powerMeter.textContent = `${state.result.powerGen} W generated / ${state.result.powerUse} W used`;
      powerMeter.style.color = state.result.powerGen >= state.result.powerUse ? 'var(--ok)' : 'var(--warn)';
      if (pwrTag) {
        pwrTag.textContent = 'SOLAR POSITIVE';
        pwrTag.style.color = 'var(--ok)';
      }
    }
  }

  const dataMeter = document.getElementById('sim-meter-data');
  const dataTag = document.getElementById('sim-meter-data-tag');
  if (dataMeter) {
    if (simState.phaseIndex >= 3) {
      dataMeter.textContent = `${state.result.dataReturned} Gb/d downlink`;
      if (dataTag) {
        dataTag.textContent = 'TRANSMITTING';
        dataTag.style.color = 'var(--cyan)';
      }
    } else {
      dataMeter.textContent = `Standby (Orbit Insertion)`;
      if (dataTag) {
        dataTag.textContent = 'STANDBY';
        dataTag.style.color = 'var(--muted)';
      }
    }
  }

  const sciMeter = document.getElementById('sim-meter-science');
  if (sciMeter) {
    sciMeter.textContent = `${simState.scienceGathered} / ${state.result.scienceTotal} pts`;
  }

  // Draw real-time sparkline curves
  renderSparkline('sparkline-alt', simState.history.alt, '#38D5FF');
  renderSparkline('sparkline-power', simState.history.power, inEclipse ? '#FFB547' : '#35E0A1');
  renderSparkline('sparkline-data', simState.history.data, '#4D7CFF');
  renderSparkline('sparkline-sci', simState.history.sci, '#8B5CFF');
}

function renderSparkline(canvasId, dataArr, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || dataArr.length < 2) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const min = Math.min(...dataArr);
  const max = Math.max(...dataArr) || 1;
  const range = max - min || 1;

  ctx.save();
  ctx.beginPath();

  dataArr.forEach((v, i) => {
    const x = (i / (dataArr.length - 1)) * (w - 6) + 3;
    const y = h - 4 - ((v - min) / range) * (h - 8);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Latest point dot
  const lastX = w - 3;
  const lastY = h - 4 - ((dataArr[dataArr.length - 1] - min) / range) * (h - 8);
  ctx.beginPath();
  ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.restore();
}

// Global pause on visibilitychange
document.addEventListener('visibilitychange', () => {
  if (document.hidden && simState.active) {
    simState.paused = true;
  }
});
