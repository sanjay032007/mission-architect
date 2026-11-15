# 🛰️ MISSION ARCHITECT
### Space Mission Design Game &bull; NASA Space Apps Challenge 2026

An educational aerospace mission design and orbital flight simulation game. Players engineer scientific missions to Earth orbit, the Moon, or Mars by balancing mass, electrical power, capital budget, telemetry communications, and mission lifetime.

---

## 📋 1. Project Information & Challenge Submission

| Submission Item | Details |
| :--- | :--- |
| **Challenge** | **NASA Space Apps Challenge 2026** |
| **Challenge Category** | *Space Mission Design Game* |
| **Team Name** | **[TEAM NAME]** |
| **Project Lead & Builder** | **[YOUR NAME]** |
| **Live Interactive Application** | **[PUBLIC URL]** |
| **Source Code Repository** | NASA Space Apps Submission Worktree |
| **Architecture Stack** | Plain HTML5, Modern CSS3, Vanilla JavaScript (ES Modules), HTML5 Canvas 2D, Web Audio API |
| **Dependencies / Frameworks** | **Zero external dependencies, zero frameworks, zero build step** |

---

## 🎯 2. What the Project Is

**Mission Architect** is a single-page browser simulation game where players design, launch, and manage real scientific space exploration missions to **Earth orbit**, the **Moon**, or **Mars**.

### Core Gameplay Mechanics:
- **Modular CAD Configuration**: Players select from modular chassis buses (CubeSat, SmallSat, Heavy ESPA), deployable solar panel arrays, lithium-ion battery storage banks, RF communication antennas (Low-Gain, Medium-Gain, High-Gain dishes), scientific sensor payload instruments, and redundant spacecraft extras.
- **Trajectory & Rocket Selection**: Match total wet mass and payload envelopes against three rocket classes (Light-Lift, Medium-Lift, Heavy-Lift) and specific orbit targets (Low Earth Orbit, Sun-Synchronous LEO, Geostationary, Lunar Polar, or Areocentric Low Mars Orbit).
- **6 Real-Time Telemetry Gauges**: Live dashboard tracks structural **mass**, electrical **power** (generation vs consumption), **capital budget**, **data volume generation**, **ground contact bandwidth**, and **mission design life**.
- **Cinematic 2D Orbital Simulation**: Runs orbital flight across 5 operational phases (Launch & Ascent, Orbit Insertion, System Commissioning, Science Operations, and End-of-Mission Disposal) with authentic day/night eclipse shadow cycles, radio carrier beam pulses, and real-time sparkline telemetry.
- **Flight Readiness Review (GO / NO-GO)**: Real-time pre-flight interlock verifies that all engineering margins, launch mass limits, power balances, and science sensor criteria are GO before terminal countdown authorization.
- **Scientific Debriefing & Why-Engine**: Every completed flight provides an objective scorecard across four aerospace disciplines, itemizes operational bottlenecks, gives actionable redesign tips, and compares your architecture to real-world NASA and international space agency missions.

### Game Modes:
- **Solo Flight Director**: Design and launch missions across three calibrated difficulty tiers:
 - *Standard / Easy*: Generous budget reserves, forgiving power margins, and benign space weather.
 - *Nominal / Normal*: Authentic aerospace trade-offs, standard NASA flight rules, and nominal radiation decay.
 - *High-Stress / Hard*: 10% budget reductions, +20% elevated cosmic radiation, strict sensor criteria, and dynamic space weather anomalies (solar flares, micrometeorite strikes, sensor calibration drift, battery degradation).
 - *Sandbox / Unrestricted*: Unlimited capital, all subsystem hardware unlocked, and unrestricted experimentation.
- **Team Mode (Flight Crew 2–4 Roles)**: Pass-the-device collaborative engineering mode on a single shared device. Players take on dedicated specialist roles (**Mission Planner**, **Systems Engineer**, **Science Lead**, **Comms Lead**), manage competing priorities, conduct a pre-flight consensus review round, and unlock a **Team Sync Bonus** (+10 pts) for unanimous engineering alignment.

---

## ⚖️ 3. Accuracy & Data Disclosure

> **"Mission Architect is a simplified educational model. Mission structure, subsystems and trade-offs were informed by the NASA resources listed below. Part specifications, costs, orbit values and scores are simplified, illustrative numbers created for learning. They are not NASA datasets and not real mission data."**

*Notice*: Mission Architect contains illustrative educational approximations designed to teach trade-off mechanics. It does not use live NASA telemetry streams or real orbital physics solvers. Real spaceflight missions are far more complex than this model.

---

## 📚 4. Credited NASA Resources & Educational References

Mission concepts, trade-off relationships, subsystem requirements, and flight lifecycles were informed by the following open NASA publications and projects:

| Link Text | Description & Purpose | URL |
| :--- | :--- | :--- |
| **NASA: Design and Develop Science Missions** | Core mission lifecycle principles, Phase A–F engineering, and instrument trade-off modeling. | [https://www.nasa.gov/wp-content/uploads/2025/04/250323-design-and-develop-science-mission.pdf?emrc=a454cf](https://www.nasa.gov/wp-content/uploads/2025/04/250323-design-and-develop-science-mission.pdf?emrc=a454cf) |
| **NASA Goddard Mission Design Lab** | Concurrent engineering methodologies and rapid instrument-to-bus integration workflows. | [https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/mission-design-lab/](https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/mission-design-lab/) |
| **NASA CubeSat 101: Basic Concepts and Processes** | Small satellite mass margins, solar array sizing, deployer mechanical interfaces, and operational lifetimes. | [https://www3.nasa.gov/sites/default/files/atoms/files/nasa_csli_cubesat_101_508.pdf](https://www3.nasa.gov/sites/default/files/atoms/files/nasa_csli_cubesat_101_508.pdf) |
| **NASA Webb: Build It Yourself** | Telescope architecture game used as inspiration for the modular spacecraft subsystem design concept. | [https://science.nasa.gov/mission/webb/game-build-it-yourself/](https://science.nasa.gov/mission/webb/game-build-it-yourself/) |

---

## 🤖 5. Artificial Intelligence (AI) Assistance Disclosure

In compliance with the **NASA Space Apps Challenge 2026** rules regarding Super Intelligence and AI transparency:

- **AI Assistance Statement**:
 > *"Code and illustrations created with AI assistance. Simplified educational model. Not endorsed by NASA."*
- **How This Was Made**:
 > *"Mission Architect was designed by [YOUR NAME] / [TEAM NAME] and built with AI-assisted coding. Spacecraft, planet and mission patch artwork are original SVG and canvas drawings generated as code with AI assistance. Sound effects are synthesized in the browser with the Web Audio API. The game contains no AI model and makes no AI calls while running."*
- **In-Game Visibility**:
 - Visible HTML header comment at Line 1 of `index.html`: `<!-- Built with AI assistance for the NASA Space Apps Challenge 2026 -->`
 - HTML metadata generator tag: `<meta name="generator" content="Built with AI assistance ">`
 - Universal educational footer on every game screen.
 - Downloadable mission patch PNG includes the visible watermark line: `"Made with Mission Architect (AI-assisted)"`.
 - Accessible "About and Credits" modal tab containing full transparency documentation.

---

## ⚖️ 6. Originality & Legal Hygiene

- **Zero NASA Trademarks**: No official NASA insignia, "meatball" logo, or "worm" wordmark are used. All logos, badges, and vectors are original SVG artwork created specifically for this project.
- **No Fictional Characters or Media References**: No character names, dialogue, or quotes from commercial films, television, or literature (e.g., no *Interstellar*, *The Martian*, *Apollo 13*, or fictional astronaut names).
- **Generic Rocket Nomenclature**: All launch vehicles use generic aerospace classifications:
 - *Light-Lift Rocket* (Low mass payload capacity)
 - *Medium-Lift Rocket* (Standard orbital insertion capacity)
 - *Heavy-Lift Rocket* (Deep space escape and heavy lunar payload capacity)
- **Authentic Agency Attributions**: Real-world mission comparisons in the debriefing report are accurately attributed:
 - *Landsat 9* — NASA and USGS
 - *Terra* — NASA
 - *Lunar Reconnaissance Orbiter (LRO)* — NASA
 - *Chandrayaan-2 orbiter* — ISRO (India, not NASA)
 - *MAVEN* — NASA
 - *Mars Reconnaissance Orbiter (MRO)* — NASA
 - All comparisons explicitly state: *"Real missions are far more complex than this model."*

---

## 🎮 7. How to Play: Solo Flight Director

1. **Select Operational Target Dossier**:
  - Choose **Earth Observer (MA-01)** (Introductory), **Lunar Scout (MA-02)** (Intermediate), or **Mars Explorer (MA-03)** (Advanced).
  - Select your simulation flight profile difficulty: *Easy*, *Normal*, *Hard*, or *Sandbox*.
2. **Step 1 — Chassis Bus**:
  - Select a structural bus (`CubeSat 12U`, `SmallSat ESPA`, or `Heavy Flagship`). Each bus dictates base dry mass, structural capital cost, and maximum instrument payload capacity.
3. **Step 2 — Power & Communications**:
  - Size your solar array (`Small 60W`, `Medium 250W`, `Large 900W`). Remember that solar flux drops to 43% at Mars (1.52 AU).
  - Size your battery energy storage bank (`No Battery`, `Standard Pack`, `Extended Pack`) to survive orbital eclipse shadows.
  - Choose your communications antenna (`Low-Gain`, `Medium-Gain`, `High-Gain Dish`) to close the RF link with Earth ground stations.
4. **Step 3 — Science Payload & Extras**:
  - Install sensor instruments: *Visible Light Camera*, *Magnetometer*, *Thermal Infrared Imager*, *Radiation Sensor*, *Spectrometer*, or *Laser Altimeter*.
  - Add mission extras: *Redundant Flight Computer*, *Thermal Control Kit*, or *Radiation-Hardened Electronics*.
5. **Step 4 — Launch Vehicle & Orbit Trajectory**:
  - Match your spacecraft wet mass against launch vehicle lift capacity (`Light-Lift`, `Medium-Lift`, `Heavy-Lift Rocket`).
  - Select target orbit profile (e.g., *Sun-Synchronous LEO*, *Low Lunar Polar 100 km*, or *Areocentric Low Mars Orbit*).
6. **Step 5 — Flight Readiness Review & Launch**:
  - Audit the 4 flight consoles (`FLIGHT PLANNER`, `CHIEF ENGINEER`, `PAYLOAD SCIENTIST`, `TELEMETRY & COMMS`).
  - If any constraint fails (NO-GO), click the quick-fix button to resolve the deficit.
  - Once all 4 report GO, authorize the terminal countdown sequencer (`TERM-01`) and liftoff into simulation!
7. **Simulation & Debriefing**:
  - Monitor real-time telemetry sparklines as your spacecraft enters orbit.
  - In Hard mode, resolve random space-weather anomalies (solar particle events, battery thermal degradation).
  - Review your final score, download your custom embroidered Mission Patch PNG, or share your build via URL.

---

## 👥 8. How to Play: Team Crew Mode (2–4 Players)

Team mode provides a collaborative "pass-the-device" multiplayer experience on a single computer, tablet, or phone without requiring internet connectivity:

1. **Crew Setup**: Select 2, 3, or 4 players and assign crew member names.
2. **Specialized Crew Roles**:
  - **Mission Planner**: Owns budget allocation, launch vehicle selection, and orbit profile matching.
  - **Systems Engineer**: Owns spacecraft chassis selection, structural mass limits, and solar/battery power balance.
  - **Science Lead**: Owns scientific instrument suite selection and target science objective fulfillment.
  - **Comms Lead**: Owns ground station RF link closure, antenna sizing, and daily data downlink volume.
3. **Pass-the-Device Workflow**:
  - Before each subsystem step, a privacy interstitial prompts the team to hand the device to the active specialist.
  - The specialist receives their confidential strategic priority and makes subsystem hardware commitments.
4. **Pre-Flight Consensus Review**:
  - All crew members review the assembled flight hardware and vote on mission authorization.
  - If unanimous consensus is reached, the team earns a **+10 point Team Sync Bonus** on their final flight evaluation.

---

## 📊 9. Scientific Scoring & Trade-Off System

The scoring engine (`js/engine.js`) is pure, deterministic math with zero random fuzzing. Every flight is scored out of **100 base points**:

$$	ext{Final Score} = 	ext{Objectives (40)} + 	ext{Science (25)} + 	ext{Efficiency (20)} + 	ext{Reliability (15)} + 	ext{Team Sync Bonus (0–10)}$$
*(Note: Final score is capped at 100 maximum)*

### Evaluation Pillars:
1. **Mission Objectives (40 Points Max)**:
  - Orbit Profile Match: 15 pts (Did the spacecraft reach the required planetary altitude and inclination?)
  - Required Primary Instruments: 15 pts (Are the destination's mandatory sensor suites installed?)
  - Mission Design Lifetime: 10 pts (Does the bus and battery sizing meet or exceed the target mission duration?)
2. **Science Return (25 Points Max)**:
  - Sensor Output Accumulation: 15 pts (Proportional to data gathered by installed payloads).
  - RF Downlink Link Closure: 10 pts (Ratio of daily downlink capacity vs daily sensor generation rate).
3. **Engineering Efficiency (20 Points Max)**:
  - Rocket Payload Mass Margin: 8 pts (Optimal wet mass utilizing 40%–85% of rocket lift capacity).
  - Capital Budget Headroom: 7 pts (Remaining financial reserves without exceeding budget caps).
  - Electrical Power Margin: 5 pts (Power generation surplus above baseline spacecraft draw).
4. **Subsystem Reliability (15 Points Max)**:
  - Redundancy & Hardening: 10 pts (Avionics computer redundancy, thermal loops, radiation shielding).
  - Space Weather Anomaly Survival: 5 pts (Recovering from random flare or impact events).
5. **Team Sync Bonus (+10 Points Max)**:
  - Awarded in Team Mode when all specialist roles achieve consensus without engineering vetoes.

### Performance Grade Bands:
- **Grade S (90–100 Pts)**: Exceptional Flight Architecture &bull; Flawless aerospace execution.
- **Grade A (80–89 Pts)**: Nominal Mission Success &bull; Complete science return within safe margins.
- **Grade B (65–79 Pts)**: Degraded Operations &bull; Minor payload or power compromises.
- **Grade C (50–64 Pts)**: Minimal Viable Mission &bull; Significant bottlenecks encountered.
- **Grade FAIL (<50 Pts)**: Catastrophic Mission Loss &bull; Critical subsystem failure or unverified launch.

---

## 🏗️ 10. Technology Architecture

Mission Architect was intentionally designed with zero third-party framework overhead, enabling instant load times and long-term archival reliability:

- **Frontend**: Semantic HTML5 with ARIA landmark accessibility.
- **Styling**: Vanilla CSS3 using custom properties, CSS Grid, Flexbox, and hardware-accelerated transforms.
- **State Architecture**: Custom reactive pub/sub state machine (`js/state.js`) with URL hash encoding for instant design sharing.
- **Calculation Engine**: Modular pure JavaScript functions (`js/engine.js`) decoupled from DOM manipulation for deterministic unit testing.
- **Visuals & Animation**: Procedural HTML5 Canvas 2D orbital simulation running at up to 60fps with automatic tab-pause optimization.
- **Audio Synthesizer**: Procedural browser sound engine built on the Web Audio API (`js/audio.js`), generating retro-futuristic telemetry beeps and thruster rumble with zero external MP3/WAV files.
- **Data Persistence**: Offline-first HTML5 `localStorage` wrapped in defensive `try/catch` blocks for flight history and comparison.

---

## 🔒 11. Privacy Policy & Zero-Tracking Guarantee

- **100% Client-Side Execution**: All game logic, simulation steps, and scoring formulas execute strictly inside the player's web browser.
- **Zero Third-Party Analytics**: No Google Analytics, no tracking pixels, and no telemetry beacons.
- **No Cookies or Fingerprinting**: The application does not read, write, or transmit HTTP cookies or persistent browser fingerprint identifiers.
- **Local Storage Only**: Flight scores and iteration histories are saved exclusively on your local device storage and are never uploaded to any remote server.

---

## 📜 12. Credits, Attributions & Open Source Licenses

- **Visual Design**: Inspired by classic aerospace drafting schematics, retro flight-control telemetry terminals, and mid-century pen-and-ink space art.
- **Typography**:
 - *Space Grotesk* (Display headings) — Licensed under the [SIL Open Font License 1.1](https://openfontlicense.org).
 - *Barlow Condensed* (Telemetry racks) — Licensed under the [SIL Open Font License 1.1](https://openfontlicense.org).
 - *IBM Plex Sans* & *IBM Plex Mono* (Interface labels and telemetry numbers) — Licensed under the [SIL Open Font License 1.1](https://openfontlicense.org).
- **Artwork & Graphics**: 100% original SVG and HTML5 Canvas vectors authored specifically for Mission Architect. Zero external copyrighted images, NASA logos, or commercial assets.

---

## 💻 13. Running Locally & Development Instructions

Mission Architect requires no Node package manager, no compilation step, and no build pipeline.

### Prerequisites:
Any modern web browser (Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge) supporting ES modules.

### Option A: Standard Local Python Server (Recommended)
```bash
# 1. Clone or extract the mission-architect directory
cd mission-architect

# 2. Start a local static file server
python -m http.server 8080

# 3. Open in your browser
http://localhost:8080
```

### Option B: Node.js Static Server
```bash
npx serve -p 8080 mission-architect
```

---

## 🚀 14. Deployment Instructions

Because Mission Architect is a pure client-side static application, it can be deployed to any static web hosting platform in seconds:

- **GitHub Pages**:
 1. Commit the `mission-architect` files to a repository branch (e.g., `main`).
 2. Navigate to **Settings &rarr; Pages**.
 3. Under *Branch*, select `main` and root `/`, then click **Save**.
- **Vercel / Netlify**:
 - Drag and drop the `mission-architect` directory into the Vercel or Netlify dashboard for instant zero-configuration deployment.
- **Cloudflare Pages / AWS S3**:
 - Upload the contents of `mission-architect` as a static bucket or project root.

---

## 🧪 15. Automated Verification & Unit Test Suite

Mission Architect includes a comprehensive Node.js unit test suite in `tests/engine.test.mjs` verifying the physics calculations, budget caps, mass thresholds, hard mode events, and score breakdowns:

### Running the Test Suite:
```bash
node tests/engine.test.mjs
```

### Verified Test Cases:
1. `✓ Earth Winning Design`: Evaluates nominal Earth orbit build achieving Grade A ($84M cost, 227 kg mass).
2. `✓ Instrument Cap Failure`: Verifies that exceeding chassis payload volume blocks launch authorization (`canLaunch = false`).
3. `✓ Over Budget Failure`: Verifies that exceeding the financial budget cap blocks launch authorization.
4. `✓ Moon Winning Design`: Evaluates lunar polar orbit build achieving Grade S (95 pts).
5. `✓ Mars Winning Design`: Evaluates deep space Mars build achieving Grade S (90 pts).
6. `✓ Launcher Lift Limit`: Verifies that heavy wet mass exceeding rocket capacity triggers a launch interlock failure.
7. `✓ Hard Mode Space Weather`: Verifies dynamic anomaly generation (solar flares, micrometeorites).
8. `✓ Score Breakdown Sum & Grade Bands`: Verifies that individual category scores strictly equal total score and match grade band thresholds across all missions.

---

## ⚠️ 16. Known Educational Simplifications & Limitations

1. **Simplified Orbital Dynamics**: Orbital trajectories are modeled using simplified 2D conic sections rather than full n-body numerical integration.
2. **Discrete Subsystem Blocks**: Subsystems use representative discretized performance tiers (e.g., 60W, 250W, 900W solar arrays) to focus player cognitive load on trade-offs rather than low-level component engineering.
3. **Illustrative Financial Metrics**: Subsystem costs ($M) are calibrated for gameplay balancing and do not reflect real-world aerospace procurement contracts.
4. **Deterministic Space Weather**: In Easy and Normal modes, space weather is benign; in Hard mode, random anomalies are simulated via controlled pseudo-random events.
