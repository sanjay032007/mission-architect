/**
 * Mission Architect - Core Engine
 * Pure mathematical functions for spacecraft design, validation, scoring, and explanations.
 * NO DOM dependencies - fully unit-testable in Node.js or browser.
 */

import {
  MISSIONS,
  BUSES,
  SOLAR_PANELS,
  BATTERIES,
  ANTENNAS,
  INSTRUMENTS,
  RELEVANCE_MULTIPLIERS,
  EXTRAS,
  LAUNCHERS,
  ORBITS,
  REAL_MISSIONS
} from './data.js';

/**
 * Calculates complete spacecraft metrics and telemetry from a configuration.
 * @param {Object} config
 * @returns {Object} Full mission telemetry and analysis
 */
export function calculateMission(config) {
  const mission = MISSIONS[config.missionId] || MISSIONS.earth;
  const difficulty = config.difficulty || 'normal';
  const isSandbox = difficulty === 'sandbox';

  // Budget adjustment
  const rawBudget = mission.budget;
  const budget = isSandbox ? Infinity : (difficulty === 'hard' ? Math.round(rawBudget * 0.9) : rawBudget);

  const bus = BUSES[config.busId] || null;
  const panel = SOLAR_PANELS[config.panelId] || null;
  const battery = BATTERIES[config.batteryId] || BATTERIES.none;
  const antenna = ANTENNAS[config.antennaId] || null;
  
  const instrumentIds = Array.isArray(config.instrumentIds) ? config.instrumentIds : [];
  const instruments = instrumentIds.map(id => INSTRUMENTS[id]).filter(Boolean);

  const extraIds = Array.isArray(config.extraIds) ? config.extraIds : [];
  const extras = extraIds.map(id => EXTRAS[id]).filter(Boolean);

  const launcher = LAUNCHERS[config.launcherId] || null;
  
  const destOrbits = ORBITS[mission.destKey] || {};
  const orbit = destOrbits[config.orbitId] || null;

  // 1. Mass calculation
  const busMass = bus ? bus.mass : 0;
  const panelMass = panel ? panel.mass : 0;
  const batteryMass = battery ? battery.mass : 0;
  const antennaMass = antenna ? antenna.mass : 0;
  const instrMass = instruments.reduce((sum, inst) => sum + inst.mass, 0);
  const extraMass = extras.reduce((sum, ext) => sum + ext.mass, 0);

  const dryMass = busMass + panelMass + batteryMass + antennaMass + instrMass + extraMass;
  const destMult = mission.destMult;
  const orbitMassMult = orbit ? orbit.massMult : 1.0;
  const launchMass = Math.round(dryMass * destMult * orbitMassMult * 10) / 10;

  // Launcher capacity check
  const launcherCap = (launcher && launcher.capacity && launcher.capacity[mission.destKey] !== undefined)
    ? launcher.capacity[mission.destKey]
    : null;

  // 2. Power calculation
  const sunFraction = orbit ? orbit.sunFraction : 0.85;
  const powerGen = panel ? Math.round(panel.watts * sunFraction * 10) / 10 : 0;
  
  const busBasePower = bus ? bus.basePower : 0;
  const antennaPower = antenna ? antenna.power : 0;
  const instrPower = instruments.reduce((sum, inst) => sum + inst.power, 0);
  const extraPower = extras.reduce((sum, ext) => sum + ext.power, 0);
  const powerUse = busBasePower + antennaPower + instrPower + extraPower;

  const powerBalance = Math.round((powerGen - powerUse) * 10) / 10;
  let powerFactor = 1.0;
  let powerStatus = 'OK';
  if (powerGen < powerUse) {
    if (battery && battery.coversEclipse) {
      powerFactor = 0.75;
      powerStatus = 'Tight';
    } else {
      powerFactor = 0.5;
      powerStatus = 'Over';
    }
  } else if (powerBalance < 20) {
    powerStatus = 'Tight';
  }

  // 3. Data and Communications calculation
  const coverage = orbit ? orbit.coverage : 1.0;
  const contactHours = orbit ? orbit.contactHours : 1.2;
  const rawInstrData = instruments.reduce((sum, inst) => sum + inst.data, 0);
  const dataGenDay = Math.round(rawInstrData * coverage * 10) / 10;

  const antennaRate = antenna ? antenna.rate : 0;
  const downlinkDay = Math.round(antennaRate * contactHours * 10) / 10;
  const dataReturned = Math.min(dataGenDay, downlinkDay);

  let dataFactor = 1.0;
  let dataStatus = 'OK';
  if (dataGenDay > 0) {
    dataFactor = Math.min(1.0, dataReturned / dataGenDay);
    if (dataReturned < dataGenDay) {
      dataStatus = dataFactor >= 0.75 ? 'Tight' : 'Over';
    }
  }

  // 4. Lifetime calculation
  const lifetimeBase = bus ? bus.lifetimeBase : 0;
  const batteryLifetimeBonus = battery ? battery.lifetimeBonus : 0;
  const extrasLifetimeBonus = extras.reduce((sum, ext) => sum + (ext.lifetimeBonus || 0), 0);
  const lifetime = Math.round((lifetimeBase + batteryLifetimeBonus + extrasLifetimeBonus) * 10) / 10;

  // 5. Cost calculation
  const busCost = bus ? bus.cost : 0;
  const panelCost = panel ? panel.cost : 0;
  const batteryCost = battery ? battery.cost : 0;
  const antennaCost = antenna ? antenna.cost : 0;
  const instrCost = instruments.reduce((sum, inst) => sum + inst.cost, 0);
  const extraCost = extras.reduce((sum, ext) => sum + ext.cost, 0);
  const launcherCost = launcher ? launcher.cost : 0;
  const totalCost = busCost + panelCost + batteryCost + antennaCost + instrCost + extraCost + launcherCost;
  const budgetLeft = isSandbox ? Infinity : (budget - totalCost);

  // 6. Hard Constraints & Validation
  const constraints = {
    budget: isSandbox ? true : (totalCost <= budget),
    launcherReaches: launcherCap !== null,
    launchCapacity: launcherCap !== null && launchMass <= launcherCap,
    instrCap: bus ? (instrMass <= bus.instrMassCap) : false,
    hasBus: bus !== null,
    hasPanel: panel !== null,
    hasAntenna: antenna !== null,
    hasInstrument: instruments.length >= 1,
    hasLauncher: launcher !== null,
    hasOrbit: orbit !== null
  };

  const hardFails = [];
  if (!constraints.hasBus) hardFails.push('Select a spacecraft bus.');
  if (!constraints.hasPanel) hardFails.push('Select a solar panel array.');
  if (!constraints.hasAntenna) hardFails.push('Select an antenna for communications.');
  if (!constraints.hasInstrument) hardFails.push('Select at least one scientific instrument.');
  if (!constraints.hasLauncher) hardFails.push('Select a launch vehicle.');
  if (!constraints.hasOrbit) hardFails.push('Select a mission orbit.');
  if (bus && !constraints.instrCap) {
    hardFails.push(`Instrument mass (${instrMass} kg) exceeds ${bus.name} payload limit (${bus.instrMassCap} kg).`);
  }
  if (launcher && !constraints.launcherReaches) {
    hardFails.push(`${launcher.name} cannot reach ${mission.destination}. Choose a larger launcher.`);
  } else if (launcher && launcherCap !== null && !constraints.launchCapacity) {
    hardFails.push(`Launch mass (${launchMass} kg) exceeds ${launcher.name} capacity to ${mission.destination} (${launcherCap} kg).`);
  }
  if (!isSandbox && !constraints.budget) {
    hardFails.push(`Total cost ($${totalCost}M) exceeds mission budget ($${budget}M) by $${totalCost - budget}M.`);
  }

  const canLaunch = hardFails.length === 0;

  // Mass Margin
  let massMarginPct = 0;
  let massStatus = 'OK';
  if (launcherCap !== null && launcherCap > 0) {
    massMarginPct = Math.round(((launcherCap - launchMass) / launcherCap) * 1000) / 10;
    if (launchMass > launcherCap) {
      massStatus = 'Over';
    } else if (massMarginPct < 10) {
      massStatus = 'Tight';
    } else {
      massStatus = 'OK';
    }
  } else {
    massStatus = 'Over';
  }

  // 7. Mission Requirements Check
  const reqDetails = [];
  let reqsMetCount = 0;
  const totalReqsCount = 3;

  // Check 1: Instrument requirement
  let instReqMet = false;
  if (mission.id === 'earth') {
    instReqMet = instruments.some(i => i.id === 'cam' || i.id === 'ir');
    reqDetails.push({
      title: 'Payload Instrument Requirement',
      desc: 'At least 1 imager (Visible Camera or Thermal IR)',
      passed: instReqMet,
      fix: 'Add a Visible Camera or Thermal IR Imager.'
    });
  } else if (mission.id === 'moon') {
    instReqMet = instruments.some(i => ['spec', 'alt', 'rad'].includes(i.id));
    reqDetails.push({
      title: 'Payload Instrument Requirement',
      desc: 'At least 1 of: Spectrometer, Laser Altimeter, or Radar Sounder',
      passed: instReqMet,
      fix: 'Add a Spectrometer, Laser Altimeter, or Radar Sounder.'
    });
  } else if (mission.id === 'mars') {
    instReqMet = instruments.some(i => ['spec', 'cam', 'rad'].includes(i.id));
    reqDetails.push({
      title: 'Payload Instrument Requirement',
      desc: 'At least 1 of: Spectrometer, Visible Camera, or Radar Sounder',
      passed: instReqMet,
      fix: 'Add a Spectrometer, Visible Camera, or Radar Sounder.'
    });
  }
  if (instReqMet) reqsMetCount++;

  // Check 2: Data return
  const minData = mission.reqs.minDataReturn;
  const dataReqMet = dataReturned >= minData;
  reqDetails.push({
    title: 'Downlink Data Return',
    desc: `Minimum data return of ${minData} Gb/day (Current: ${dataReturned} Gb/day)`,
    passed: dataReqMet,
    fix: 'Select a higher-gain antenna or an orbit with longer Earth contact hours.'
  });
  if (dataReqMet) reqsMetCount++;

  // Check 3: Lifetime
  const minLife = mission.reqs.minLifetime;
  const lifeReqMet = lifetime >= minLife;
  reqDetails.push({
    title: 'Operational Lifetime',
    desc: `Minimum mission lifetime of ${minLife} years (Current: ${lifetime} yr)`,
    passed: lifeReqMet,
    fix: 'Choose a larger bus, add a battery pack, or equip radiation-hardened electronics.'
  });
  if (lifeReqMet) reqsMetCount++;

  // 8. Science Points Calculation
  let rawScience = 0;
  instruments.forEach(inst => {
    const rel = (RELEVANCE_MULTIPLIERS[inst.id] && RELEVANCE_MULTIPLIERS[inst.id][mission.destKey]) || 1.0;
    rawScience += inst.science * rel;
  });
  const scienceTotal = Math.round(rawScience * powerFactor * dataFactor * 10) / 10;

  // 9. Scoring Model (0 - 100)
  // Objective (40)
  const reqShare = reqsMetCount / totalReqsCount;
  const objectiveScore = Math.round(40 * reqShare * 10) / 10;

  // Science (25)
  const scienceRatio = mission.scienceTarget > 0 ? Math.min(1.0, scienceTotal / mission.scienceTarget) : 1.0;
  const scienceScore = Math.round(25 * scienceRatio * 10) / 10;

  // Efficiency (20): 10 x budget + 10 x mass-margin quality
  let costScore = 10;
  if (!isSandbox && budget > 0) {
    const budgetLeftFraction = Math.max(0, budgetLeft / budget);
    const scaledBudgetFraction = Math.min(0.4, budgetLeftFraction) / 0.4;
    costScore = Math.round(10 * scaledBudgetFraction * 10) / 10;
  }

  let massQuality = 0;
  if (launcherCap !== null && launchMass <= launcherCap) {
    const marginFrac = (launcherCap - launchMass) / launcherCap;
    if (marginFrac < 0.10) {
      // Too tight (risky)
      massQuality = Math.max(0, marginFrac / 0.10);
    } else if (marginFrac <= 0.25) {
      // Ideal 10% - 25% margin
      massQuality = 1.0;
    } else {
      // Too loose: wastes capacity and money
      const excess = marginFrac - 0.25;
      massQuality = Math.max(0.3, 1.0 - (excess / 0.75) * 0.7);
    }
  }
  const massMarginScore = Math.round(10 * massQuality * 10) / 10;
  const efficiencyScore = Math.round((costScore + massMarginScore) * 10) / 10;

  // Reliability (15): Base 12 + up to 3 for power and comms margin
  let powerBonus = 0;
  if (powerGen >= powerUse) {
    powerBonus = 1.5;
  } else if (battery && battery.coversEclipse) {
    powerBonus = 0.75;
  }

  let commsBonus = 0;
  if (dataGenDay > 0) {
    commsBonus = downlinkDay >= dataGenDay ? 1.5 : 1.5 * Math.min(1.0, downlinkDay / dataGenDay);
  } else {
    commsBonus = 1.5;
  }
  const reliabilityScore = Math.round((12 + powerBonus + commsBonus) * 10) / 10;

  // Final Total Score
  let totalScore = Math.round(objectiveScore + scienceScore + efficiencyScore + reliabilityScore);
  totalScore = Math.max(0, Math.min(100, totalScore));

  // Grade Determination (Strict NASA Space Apps Bands)
  // S: >= 90, A: 80-89, B: 65-79, C: 50-64, Fail: < 50
  let grade = 'Fail';
  const allReqsMet = reqsMetCount === totalReqsCount;
  if (!allReqsMet && totalScore < 50) {
    grade = 'Fail';
  } else if (totalScore >= 90) {
    grade = 'S';
  } else if (totalScore >= 80) {
    grade = 'A';
  } else if (totalScore >= 65) {
    grade = 'B';
  } else if (totalScore >= 50) {
    grade = 'C';
  } else {
    grade = 'Fail';
  }

  // Matching Real Mission
  const matchedMission = matchRealMission(mission.destKey, instruments);

  // Result object
  const result = {
    config,
    mission,
    difficulty,
    isSandbox,
    bus,
    panel,
    battery,
    antenna,
    instruments,
    extras,
    launcher,
    orbit,
    // Metrics
    dryMass,
    launchMass,
    launcherCap,
    massMarginPct,
    massStatus,
    powerGen,
    powerUse,
    powerBalance,
    powerStatus,
    dataGenDay,
    downlinkDay,
    dataReturned,
    dataStatus,
    lifetime,
    totalCost,
    budget,
    budgetLeft,
    // Constraints & reqs
    constraints,
    hardFails,
    canLaunch,
    reqDetails,
    reqsMetCount,
    totalReqsCount,
    allReqsMet,
    // Scores
    scienceTotal,
    objectiveScore,
    scienceScore,
    efficiencyScore,
    costScore,
    massMarginScore,
    reliabilityScore,
    totalScore,
    grade,
    matchedMission
  };

  result.explanations = explain(result);
  return result;
}

/**
 * Generates plain-language feedback explaining why the mission scored high or suffered penalties.
 * @param {Object} res Result from calculateMission
 * @returns {Object} Categorized explanation bullet points
 */
export function explain(res) {
  const wentWell = [];
  const limited = [];
  const nextTips = [];

  // 1. Objectives & Science
  if (res.allReqsMet) {
    wentWell.push(`All ${res.totalReqsCount} core mission requirements satisfied for ${res.mission.name}.`);
  } else {
    limited.push(`Failed ${res.totalReqsCount - res.reqsMetCount} of ${res.totalReqsCount} primary mission criteria.`);
  }

  if (res.scienceTotal >= res.mission.scienceTarget) {
    wentWell.push(`Excellent scientific output (${res.scienceTotal} pts), reaching 100% of the mission benchmark.`);
  } else {
    const pct = Math.round((res.scienceTotal / res.mission.scienceTarget) * 100);
    limited.push(`Science output reached ${pct}% of target (${res.scienceTotal}/${res.mission.scienceTarget} pts).`);
  }

  // 2. Data and Comms
  if (res.dataGenDay > res.downlinkDay) {
    const lost = Math.round((res.dataGenDay - res.downlinkDay) * 10) / 10;
    limited.push(`Telemetry bottleneck: instruments produce ${res.dataGenDay} Gb/day but the antenna can downlink only ${res.downlinkDay} Gb/day (${lost} Gb/day lost).`);
    nextTips.push('Upgrade to a Medium-Gain or High-Gain antenna, or select an orbit with more daily contact hours.');
  } else if (res.dataReturned >= res.mission.reqs.minDataReturn) {
    wentWell.push(`Clean communications pipeline downlinks 100% of generated data (${res.dataReturned} Gb/day).`);
  }

  // 3. Power
  if (res.powerGen < res.powerUse) {
    if (res.battery && res.battery.coversEclipse) {
      limited.push(`Power deficit: Solar array yields ${res.powerGen} W vs ${res.powerUse} W needed. Battery buffer prevented blackout, but science efficiency was reduced by 25%.`);
      nextTips.push('Equip a larger solar array or choose an orbit with higher sunlight fraction.');
    } else {
      limited.push(`Severe power deficit: Solar panels generate ${res.powerGen} W vs ${res.powerUse} W used with no battery storage. Scientific returns slashed by 50%.`);
      nextTips.push('Add at least a Standard Battery pack to protect during planetary eclipses.');
    }
  } else {
    wentWell.push(`Positive power margin (+${res.powerBalance} W) ensures uninterrupted payload operations.`);
  }

  // 4. Mass and Launcher
  if (res.launcherCap !== null) {
    if (res.massMarginPct < 10) {
      limited.push(`Narrow mass margin (${res.massMarginPct}%). Flying so close to launcher limits creates high launch risk.`);
      nextTips.push('Shave payload weight or step up to a higher-capacity launch vehicle.');
    } else if (res.massMarginPct > 25) {
      limited.push(`Excess rocket capacity (${res.massMarginPct}% margin). Carrying excess booster capability lowers overall mission efficiency.`);
      nextTips.push('Consider adding more scientific payload or choosing a more economical launch vehicle.');
    } else {
      wentWell.push(`Ideal mass margin (${res.massMarginPct}%). Fits perfectly in the 10%–25% optimal launch vehicle envelope.`);
    }
  }

  // 5. Budget
  if (!res.isSandbox) {
    if (res.budgetLeft < 5) {
      limited.push(`Budget was very tight (only $${res.budgetLeft}M remaining), limiting your efficiency score.`);
    } else if (res.budgetLeft >= 20) {
      wentWell.push(`Disciplined cost management preserved $${res.budgetLeft}M in contingency reserve.`);
    }
  }

  // 6. Lifetime
  if (res.lifetime >= res.mission.reqs.minLifetime + 1.5) {
    wentWell.push(`Extended operational lifetime (${res.lifetime} years) allows prolonged science campaigns.`);
  }

  if (nextTips.length === 0) {
    nextTips.push('Experiment with different orbit inclinations to balance sunlight and Earth contact window.');
    nextTips.push('Try the mission on Hard difficulty with space weather events enabled.');
  }

  return {
    wentWell,
    limited,
    nextTips
  };
}

/**
 * Matches user instrument configuration with the closest real-world mission.
 * @param {string} destKey 
 * @param {Array} instruments 
 * @returns {Object} Real mission comparison
 */
export function matchRealMission(destKey, instruments) {
  const list = REAL_MISSIONS[destKey] || [];
  if (list.length === 0) {
    return {
      name: 'Generic Scientific Orbiter',
      desc: 'Simplified model for learning; real missions are far more complex.'
    };
  }

  const userIds = new Set(instruments.map(i => i.id));
  let bestMatch = list[0];
  let bestScore = -1;

  for (const m of list) {
    let overlap = 0;
    for (const c of m.matchCriteria) {
      if (userIds.has(c)) overlap++;
    }
    if (overlap > bestScore) {
      bestScore = overlap;
      bestMatch = m;
    }
  }

  return {
    name: bestMatch.name,
    desc: `${bestMatch.desc} (Simplified model for learning; real missions are far more complex.)`
  };
}

/**
 * Simple pseudo-random number generator seeded for reproducible Hard mode events.
 * @param {number} seed
 * @returns {function(): number}
 */
export function createSeededRandom(seed = 12345) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}


/**
 * Generates deterministic space weather and anomaly events for Hard difficulty.
 * @param {Object} config
 * @returns {Array} List of 2 simulated events
 */
export function generateMissionEvents(config) {
  if (config.difficulty !== 'hard') {
    return [];
  }

  // Create deterministic seed from mission design string
  const seedString = `${config.missionId}-${config.busId}-${config.panelId}-${config.batteryId}-${(config.instrumentIds||[]).sort().join('')}-${config.launcherId}-${config.orbitId}`;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = ((hash << 5) - hash) + seedString.charCodeAt(i);
    hash |= 0;
  }
  const rng = createSeededRandom(Math.abs(hash) || 42);

  const isMoonOrMars = config.missionId === 'moon' || config.missionId === 'mars';
  const availableEventPool = [
    'solar_flare',
    'comms_dropout',
    'instrument_fault'
  ];
  if (isMoonOrMars) {
    availableEventPool.push('thermal_swing');
  }

  // Shuffle pool with rng
  const shuffled = [...availableEventPool].sort(() => rng() - 0.5);
  const selectedKeys = shuffled.slice(0, 2);

  const extraIds = new Set(config.extraIds || []);
  const events = [];

  selectedKeys.forEach((key, idx) => {
    // Phase 2 (Commissioning) or Phase 3 (Science Operations)
    const phaseIndex = idx === 0 ? 2 : 3;

    if (key === 'solar_flare') {
      const hasShielding = extraIds.has('rad_hard');
      events.push({
        id: 'solar_flare',
        title: 'Coronal Mass Ejection (Solar Flare)',
        phaseIndex,
        survived: hasShielding,
        mitigationEquipment: 'Radiation-Hardened Electronics',
        desc: hasShielding
          ? 'Intense solar cosmic rays detected. Radiation-hardened avionics absorbed ionization dose without latch-up.'
          : 'Severe solar proton storm bombarded the spacecraft. Voltage fluctuations forced emergency bus reset (-10 reliability, -20% science during phase).',
        scienceFactor: hasShielding ? 1.0 : 0.8,
        preventFix: 'Equip Radiation-Hardened Electronics in extras.'
      });
    } else if (key === 'comms_dropout') {
      const hasHighGain = config.antennaId === 'high';
      events.push({
        id: 'comms_dropout',
        title: 'Deep Space Communications Dropout',
        phaseIndex,
        survived: hasHighGain,
        mitigationEquipment: 'High-Gain Dish',
        desc: hasHighGain
          ? 'Ground station solar scintillation encountered. High-Gain parabolic dish maintained link lock (telemetry loss capped at -10%).'
          : 'Weak signal-to-noise ratio in orbital pass caused data loss (-30% downlink throughput during pass).',
        scienceFactor: hasHighGain ? 0.9 : 0.7,
        preventFix: 'Upgrade to a High-Gain Dish antenna.'
      });
    } else if (key === 'instrument_fault') {
      const hasRedundantComp = extraIds.has('red_comp');
      events.push({
        id: 'instrument_fault',
        title: 'Single-Event Upset / Instrument Glitch',
        phaseIndex,
        survived: hasRedundantComp,
        mitigationEquipment: 'Redundant Computer',
        desc: hasRedundantComp
          ? 'Bit-flip detected in payload telemetry bus. Dual-lockstep redundant flight computer auto-corrected error in 40ms.'
          : 'Instrument controller halted due to memory parity fault. Sensor remained offline until ground command pass.',
        scienceFactor: hasRedundantComp ? 1.0 : 0.75,
        preventFix: 'Install a Redundant Computer subsystem.'
      });
    } else if (key === 'thermal_swing') {
      const hasThermal = extraIds.has('therm_ctrl');
      events.push({
        id: 'thermal_swing',
        title: 'Extreme Planetary Thermal Swing',
        phaseIndex,
        survived: hasThermal,
        mitigationEquipment: 'Thermal Control Kit',
        desc: hasThermal
          ? 'Spacecraft transitioned from deep shadow (-130°C) into full sunlight (+120°C). Thermal louvers and MLI blankets stabilized optics.'
          : 'Rapid thermal expansion warped sensor focal plane and strained solder joints.',
        scienceFactor: hasThermal ? 1.0 : 0.8,
        preventFix: 'Equip the Thermal Control Kit.'
      });
    }
  });

  return events;
}

/**
 * Applies events to the mission result, adjusting science and reliability scores.
 * @param {Object} result
 * @param {Array} events
 * @returns {Object} Updated result
 */
export function applyEventsToResult(result, events) {
  if (!events || events.length === 0) {
    result.events = [];
    return result;
  }

  result.events = events;
  const faced = events.length;
  const survived = events.filter(e => e.survived).length;

  // Reliability (15 pts): 15 * (events survived / faced)
  result.reliabilityScore = Math.round(15 * (survived / faced) * 10) / 10;

  // Apply science multipliers from unmitigated events
  let compositeScienceFactor = 1.0;
  events.forEach(e => {
    compositeScienceFactor *= e.scienceFactor;
  });

  result.scienceTotal = Math.round(result.scienceTotal * compositeScienceFactor * 10) / 10;
  const scienceRatio = result.mission.scienceTarget > 0 ? Math.min(1.0, result.scienceTotal / result.mission.scienceTarget) : 1.0;
  result.scienceScore = Math.round(25 * scienceRatio * 10) / 10;

  // Recalculate total score
  let totalScore = Math.round(result.objectiveScore + result.scienceScore + result.efficiencyScore + result.reliabilityScore);
  result.totalScore = Math.max(0, Math.min(100, totalScore));

  // Recalculate grade
  if (!result.allReqsMet && result.totalScore < 60) {
    result.grade = 'Fail';
  } else if (result.totalScore >= 90) {
    result.grade = 'S';
  } else if (result.totalScore >= 80) {
    result.grade = 'A';
  } else if (result.totalScore >= 65) {
    result.grade = 'B';
  } else if (result.totalScore >= 50) {
    result.grade = 'C';
  } else {
    result.grade = 'Fail';
  }

  // Update explanations
  events.forEach(e => {
    if (e.survived) {
      result.explanations.wentWell.push(`Survived ${e.title}: Protected by ${e.mitigationEquipment}.`);
    } else {
      result.explanations.limited.push(`Suffered damage during ${e.title}: ${e.desc}`);
      result.explanations.nextTips.push(`Next time: ${e.preventFix}`);
    }
  });

  return result;
}
