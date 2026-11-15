import assert from 'node:assert';
import { calculateMission, matchRealMission, generateMissionEvents, applyEventsToResult } from '../js/engine.js';
import { MISSIONS } from '../js/data.js';

console.log('🧪 Starting Mission Architect Engine Unit Tests...\n');

// 1. Earth Winning Design (Grade A, within budget with Light launcher)
{
  const earthWinningConfig = {
    missionId: 'earth',
    difficulty: 'normal',
    busId: 'small', // mass: 150, cap: 80, power: 40, cost: 30, life: 3
    panelId: 'medium', // 250W, 18kg, $6M
    batteryId: 'standard', // 10kg, $3M, life: +0.5
    antennaId: 'high', // 30kg, 40W, $12M, 6 Gb/h
    instrumentIds: ['cam', 'ir'], // 13kg, 40W, $18M, 14Gb
    extraIds: ['rad_hard'], // 6kg, $5M, life: +0.5
    launcherId: 'light', // cap: 500kg, cost: $10M -> Total: $84M <= $120M
    orbitId: 'sso' // sun: 0.85, contact: 1.2h, cov: 1.0, mult: 1.0
  };

  const res = calculateMission(earthWinningConfig);
  console.log(`✓ Earth Winning Design: Total Score = ${res.totalScore}, Grade = ${res.grade}, Cost = $${res.totalCost}M, Mass = ${res.launchMass}kg`);
  
  assert.strictEqual(res.canLaunch, true, 'Earth winning configuration should pass all hard constraints');
  assert.ok(res.totalScore >= 75, `Expected score >= 75 (Grade A/B), got ${res.totalScore}`);
  assert.ok(['S', 'A', 'B'].includes(res.grade), `Expected Grade S, A, or B, got ${res.grade}`);
  assert.strictEqual(res.allReqsMet, true, 'All 3 Earth requirements should be met');
  assert.strictEqual(res.reqsMetCount, 3, 'Requirement count must be 3');
  assert.ok(res.matchedMission.name.includes('Landsat') || res.matchedMission.name.includes('Terra'), 'Should match Earth mission');
}

// 2. Earth Failing Design (Exceeds Bus Instrument Mass Cap)
{
  const overCapConfig = {
    missionId: 'earth',
    difficulty: 'normal',
    busId: 'cube', // instrMassCap: 12 kg
    panelId: 'small',
    batteryId: 'none',
    antennaId: 'low',
    instrumentIds: ['rad'], // Radar sounder: 40 kg (> 12 kg cap)
    extraIds: [],
    launcherId: 'light',
    orbitId: 'sso'
  };

  const res = calculateMission(overCapConfig);
  console.log(`✓ Instrument Cap Failure: canLaunch = ${res.canLaunch}, fails = ${res.hardFails.length}`);
  assert.strictEqual(res.canLaunch, false, 'Should fail to launch when instrument mass exceeds bus cap');
  assert.ok(res.hardFails.some(f => f.includes('payload limit')), 'Hard fail list must cite payload limit');
}

// 3. Earth Failing Design (Over Budget)
{
  const overBudgetConfig = {
    missionId: 'earth', // Budget: 120
    difficulty: 'normal',
    busId: 'medium', // $90M
    panelId: 'large', // $15M
    batteryId: 'extended', // $8M
    antennaId: 'high', // $12M
    instrumentIds: ['rad'], // $40M -> satellite cost alone: 90+15+8+12+40 = $165M (> 120)
    extraIds: [],
    launcherId: 'medium', // $55M -> Total: $220M
    orbitId: 'sso'
  };

  const res = calculateMission(overBudgetConfig);
  console.log(`✓ Over Budget Failure: Total Cost = $${res.totalCost}M, Budget = $${res.budget}M`);
  assert.strictEqual(res.canLaunch, false, 'Should fail launch when over budget');
  assert.ok(res.hardFails.some(f => f.includes('exceeds mission budget')), 'Hard fail must cite budget');
}

// 4. Moon Winning Design
{
  const moonWinningConfig = {
    missionId: 'moon', // Budget: 250, target: 75, destMult: 1.8
    difficulty: 'normal',
    busId: 'small', // 150kg, cap: 80, $30M, 40W, life: 3
    panelId: 'medium', // 250W, 18kg, $6M
    batteryId: 'standard', // 10kg, $3M, life: +0.5
    antennaId: 'high', // 30kg, 40W, $12M, 6 Gb/h
    instrumentIds: ['alt', 'spec'], // alt: 20kg,45W,$25M,3Gb,30sci; spec: 12kg,30W,$18M,4Gb,35sci -> 32kg (<=80), $43M
    extraIds: ['therm_ctrl', 'rad_hard'], // therm_ctrl: 8kg,$3M; rad_hard: 6kg,$5M,life:+0.5
    launcherId: 'medium', // Moon cap: 1500kg, cost: $55M
    orbitId: 'moon_polar' // sun: 0.8, contact: 3h, cov: 1.0, mult: 1.0
  };

  const res = calculateMission(moonWinningConfig);
  console.log(`✓ Moon Winning Design: Score = ${res.totalScore}, Grade = ${res.grade}, Cost = $${res.totalCost}M, LaunchMass = ${res.launchMass}kg (Cap: ${res.launcherCap}kg)`);
  assert.strictEqual(res.canLaunch, true, 'Moon mission should launch cleanly');
  assert.ok(res.totalScore >= 75, `Expected score >= 75 for moon, got ${res.totalScore}`);
  assert.strictEqual(res.allReqsMet, true, 'All Moon requirements must pass');
  assert.ok(res.matchedMission.name.includes('Lunar Reconnaissance Orbiter') || res.matchedMission.name.includes('Chandrayaan'), 'Should match lunar mission');
}

// 5. Mars Winning Design
{
  const marsWinningConfig = {
    missionId: 'mars', // Budget: 400, target: 80, destMult: 2.5
    difficulty: 'normal',
    busId: 'small', // 150kg, cap: 80, $30M, 40W, life: 3
    panelId: 'medium', // 250W, 18kg, $6M
    batteryId: 'extended', // 25kg, $8M, life: +1.0
    antennaId: 'high', // 30kg, 40W, $12M, 6 Gb/h
    instrumentIds: ['spec', 'cam'], // spec: 12kg,30W,$18M,4Gb,35sci; cam: 5kg,15W,$6M,8Gb,20sci -> 17kg (<=80), $24M
    extraIds: ['therm_ctrl', 'red_comp'], // 8kg,$3M; 4kg,10W,$6M
    launcherId: 'heavy', // Mars cap: 2500kg, cost: $140M -> Total: $229M <= $400M
    orbitId: 'mars_polar' // sun: 0.8, contact: 3.5h, cov: 1.0, mult: 1.0
  };

  const res = calculateMission(marsWinningConfig);
  console.log(`✓ Mars Winning Design: Score = ${res.totalScore}, Grade = ${res.grade}, Cost = $${res.totalCost}M, LaunchMass = ${res.launchMass}kg (Cap: ${res.launcherCap}kg)`);
  assert.strictEqual(res.canLaunch, true, 'Mars mission should launch cleanly');
  assert.ok(res.totalScore >= 70, `Expected score >= 70 for Mars, got ${res.totalScore}`);
  assert.strictEqual(res.allReqsMet, true, 'All Mars requirements must pass');
}

// 6. Launcher Destination Capability Check (Light rocket cannot reach Moon or Mars)
{
  const invalidLauncherConfig = {
    missionId: 'mars',
    difficulty: 'normal',
    busId: 'cube',
    panelId: 'small',
    batteryId: 'none',
    antennaId: 'low',
    instrumentIds: ['cam'],
    extraIds: [],
    launcherId: 'light', // Light rocket cannot reach Mars (capacity: null)
    orbitId: 'mars_polar'
  };

  const res = calculateMission(invalidLauncherConfig);
  console.log(`✓ Launcher Destination Limit: canLaunch = ${res.canLaunch}`);
  assert.strictEqual(res.canLaunch, false, 'Light launcher cannot fly to Mars');
  assert.ok(res.hardFails.some(f => f.includes('cannot reach')), 'Should report launcher cannot reach destination');
}

// 7. Difficulty & Sandbox Budget Check
{
  const earthNormal = calculateMission({
    missionId: 'earth',
    difficulty: 'normal',
    busId: 'cube',
    panelId: 'small',
    batteryId: 'none',
    antennaId: 'low',
    instrumentIds: ['cam'],
    extraIds: [],
    launcherId: 'light',
    orbitId: 'sso'
  });
  assert.strictEqual(earthNormal.budget, 120, 'Normal Earth budget must be 120');

  const earthHard = calculateMission({
    missionId: 'earth',
    difficulty: 'hard',
    busId: 'cube',
    panelId: 'small',
    batteryId: 'none',
    antennaId: 'low',
    instrumentIds: ['cam'],
    extraIds: [],
    launcherId: 'light',
    orbitId: 'sso'
  });
  assert.strictEqual(earthHard.budget, 108, 'Hard Earth budget must be 120 * 0.9 = 108');

  // Sandbox with expensive design that would normally blow budget
  const earthSandbox = calculateMission({
    missionId: 'earth',
    difficulty: 'sandbox',
    busId: 'medium', // $90M
    panelId: 'large', // $15M
    batteryId: 'extended', // $8M
    antennaId: 'high', // $12M
    instrumentIds: ['rad'], // $40M
    extraIds: [],
    launcherId: 'medium', // $55M -> $220M
    orbitId: 'sso'
  });
  assert.strictEqual(earthSandbox.constraints.budget, true, 'Sandbox must bypass budget check');
}

// 8. Soft Limits: Power Deficit Penalties
{
  // Power deficit WITH battery (0.75 penalty factor)
  const withBattery = calculateMission({
    missionId: 'earth',
    difficulty: 'normal',
    busId: 'small', // 40W
    panelId: 'small', // 60W * 0.85 = 51W
    batteryId: 'standard', // covers eclipse
    antennaId: 'med', // 15W -> total power: 40 + 15 + 15 = 70W > 51W
    instrumentIds: ['cam'], // 15W
    extraIds: [],
    launcherId: 'medium',
    orbitId: 'sso'
  });
  assert.strictEqual(withBattery.powerStatus, 'Tight');

  // Power deficit WITHOUT battery (0.5 penalty factor)
  const withoutBattery = calculateMission({
    missionId: 'earth',
    difficulty: 'normal',
    busId: 'small',
    panelId: 'small',
    batteryId: 'none', // NO battery
    antennaId: 'med',
    instrumentIds: ['cam'],
    extraIds: [],
    launcherId: 'medium',
    orbitId: 'sso'
  });
  assert.strictEqual(withoutBattery.powerStatus, 'Over');
  assert.ok(withoutBattery.scienceTotal < withBattery.scienceTotal, 'Without battery should suffer harsher science penalty');
}

// 9. Explanations check
{
  const res = calculateMission({
    missionId: 'earth',
    difficulty: 'normal',
    busId: 'small',
    panelId: 'small',
    batteryId: 'none',
    antennaId: 'low',
    instrumentIds: ['cam'],
    extraIds: [],
    launcherId: 'medium',
    orbitId: 'sso'
  });
  assert.ok(Array.isArray(res.explanations.wentWell), 'wentWell must be array');
  assert.ok(Array.isArray(res.explanations.limited), 'limited must be array');
  assert.ok(Array.isArray(res.explanations.nextTips), 'nextTips must be array');
  assert.ok(res.explanations.limited.length > 0, 'Should have limitations listed');
}


// 10. Hard Mode Space Weather Events Test
{
  const hardConfigNoShield = {
    missionId: 'mars',
    difficulty: 'hard',
    busId: 'small',
    panelId: 'medium',
    batteryId: 'extended',
    antennaId: 'low', // No high-gain antenna
    instrumentIds: ['spec', 'cam'],
    extraIds: [], // No rad_hard, no therm_ctrl, no red_comp
    launcherId: 'heavy',
    orbitId: 'mars_polar'
  };

  const events = generateMissionEvents(hardConfigNoShield);
  console.log(`✓ Hard Mode Events Generated: ${events.length} events faced`);
  assert.strictEqual(events.length, 2, 'Hard mode must generate exactly 2 random events');

  const baseRes = calculateMission(hardConfigNoShield);
  const eventRes = applyEventsToResult(baseRes, events);
  console.log(`✓ Hard Mode Events Applied: Score = ${eventRes.totalScore}, Reliability = ${eventRes.reliabilityScore}`);
  assert.ok(eventRes.events.length === 2, 'Result must retain the 2 events');
  assert.ok(Array.isArray(eventRes.explanations.wentWell), 'Explanations must include event outcomes');
}


// --- Test Suite 8: Score Breakdown Sum and Grade Band Verification ---
console.log('🧪 Testing Score Breakdown Sum and Grade Bands...');
const missionsToTest = ['earth', 'moon', 'mars'];
for (const mId of missionsToTest) {
  const testState = {
    missionId: mId,
    difficulty: 'normal',
    busId: 'small',
    panelId: 'medium',
    batteryId: 'standard',
    antennaId: 'med',
    instrumentIds: ['cam', 'ir'],
    extraIds: ['therm_ctrl'],
    launcherId: 'medium',
    orbitId: mId === 'earth' ? 'sso' : (mId === 'moon' ? 'moon_polar' : 'mars_polar')
  };
  const res = calculateMission(testState);
  const breakdownSum = Math.min(100, Math.round(res.objectiveScore + res.scienceScore + res.efficiencyScore + res.reliabilityScore));
  assert.strictEqual(
    res.totalScore,
    breakdownSum,
    `Total score (${res.totalScore}) must strictly equal breakdown sum (${breakdownSum}) for mission ${mId}`
  );

  // Grade verification
  let expectedGrade = 'Fail';
  if (res.totalScore >= 90) expectedGrade = 'S';
  else if (res.totalScore >= 80) expectedGrade = 'A';
  else if (res.totalScore >= 65) expectedGrade = 'B';
  else if (res.totalScore >= 50) expectedGrade = 'C';
  else expectedGrade = 'Fail';

  assert.strictEqual(
    res.grade,
    expectedGrade,
    `Grade (${res.grade}) must match total score (${res.totalScore}) expected band (${expectedGrade})`
  );
}
console.log('✓ Score Breakdown Sum and Grade Bands Verified across all missions');

console.log('\n🎉 All Engine Unit Tests Passed Successfully!');
