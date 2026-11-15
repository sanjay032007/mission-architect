/**
 * Mission Architect - Game Data
 * Specification constants for NASA Space Apps Challenge 2026.
 */

export const MISSIONS = {
  earth: {
    id: 'earth',
    name: 'Earth Observer',
    destination: 'Earth orbit',
    destKey: 'earth',
    destMult: 1.0,
    budget: 120,
    scienceTarget: 60,
    objective: 'Monitor wildfires, floods and crops',
    requiredDesc: 'At least 1 imager (camera or thermal IR); data return at least 6 Gb/day; lifetime at least 2 yr',
    reqs: {
      hasImager: true,
      minDataReturn: 6,
      minLifetime: 2
    },
    difficultyTag: 'Introductory'
  },
  moon: {
    id: 'moon',
    name: 'Lunar Scout',
    destination: 'Lunar orbit',
    destKey: 'moon',
    destMult: 1.8,
    budget: 250,
    scienceTarget: 75,
    objective: "Map the Moon's surface and find ice-rich regions",
    requiredDesc: 'At least 1 of (spectrometer, laser altimeter, radar); data return at least 5 Gb/day; lifetime at least 2 yr',
    reqs: {
      instrumentsAnyOf: ['spec', 'alt', 'rad'],
      minDataReturn: 5,
      minLifetime: 2
    },
    difficultyTag: 'Intermediate'
  },
  mars: {
    id: 'mars',
    name: 'Mars Explorer',
    destination: 'Mars orbit',
    destKey: 'mars',
    destMult: 2.5,
    budget: 400,
    scienceTarget: 80,
    objective: "Study Mars's atmosphere and surface changes",
    requiredDesc: 'At least 1 of (spectrometer, camera, radar); data return at least 4 Gb/day; lifetime at least 3 yr',
    reqs: {
      instrumentsAnyOf: ['spec', 'cam', 'rad'],
      minDataReturn: 4,
      minLifetime: 3
    },
    difficultyTag: 'Advanced'
  }
};

export const BUSES = {
  cube: {
    id: 'cube',
    name: 'CubeSat',
    mass: 15,
    basePower: 8,
    cost: 4,
    instrMassCap: 12,
    lifetimeBase: 1.5,
    easyMode: true,
    desc: 'Standardized nanosatellite bus. Low cost and mass, with 12 kg instrument cap and 1.5 yr base lifetime.'
  },
  small: {
    id: 'small',
    name: 'SmallSat',
    mass: 150,
    basePower: 40,
    cost: 30,
    instrMassCap: 80,
    lifetimeBase: 3,
    easyMode: true,
    desc: 'Workhorse small satellite bus. Supports 80 kg of scientific instruments with 3 yr base design life.'
  },
  medium: {
    id: 'medium',
    name: 'Medium Satellite',
    mass: 600,
    basePower: 120,
    cost: 90,
    instrMassCap: 250,
    lifetimeBase: 5,
    easyMode: true,
    desc: 'Heavy scientific orbiter bus. High payload capacity (250 kg) and 5 yr baseline endurance.'
  }
};

export const SOLAR_PANELS = {
  small: {
    id: 'small',
    name: 'Small Solar Array',
    watts: 60,
    mass: 4,
    cost: 2,
    desc: 'Compact deployable solar arrays providing 60 W at full sunlight.'
  },
  medium: {
    id: 'medium',
    name: 'Medium Solar Array',
    watts: 250,
    mass: 18,
    cost: 6,
    desc: 'Articulated tracking wings generating 250 W. Great for multi-instrument platforms.'
  },
  large: {
    id: 'large',
    name: 'Large Solar Array',
    watts: 900,
    mass: 65,
    cost: 15,
    desc: 'High-power dual arrays delivering 900 W for active sensors and radar sounders.'
  }
};

export const BATTERIES = {
  none: {
    id: 'none',
    name: 'No Battery Storage',
    mass: 0,
    cost: 0,
    coversEclipse: false,
    lifetimeBonus: 0,
    desc: 'No electrical storage. Systems undergo emergency shutdown during planetary shadow.'
  },
  standard: {
    id: 'standard',
    name: 'Standard Battery Pack',
    mass: 10,
    cost: 3,
    coversEclipse: true,
    lifetimeBonus: 0.5,
    desc: 'Lithium-ion pack. Powers critical avionics in eclipse and extends mission lifetime by +0.5 yr.'
  },
  extended: {
    id: 'extended',
    name: 'Extended Battery Pack',
    mass: 25,
    cost: 8,
    coversEclipse: true,
    lifetimeBonus: 1.0,
    desc: 'High-density battery array. Powers continuous science in eclipse and adds +1.0 yr lifetime.'
  }
};

export const ANTENNAS = {
  low: {
    id: 'low',
    name: 'Low-Gain Antenna',
    mass: 3,
    power: 5,
    cost: 1,
    rate: 0.4, // Gb per contact hour
    desc: 'Omnidirectional patch antenna (0.4 Gb/h). Lightweight, but downlinks data slowly.'
  },
  med: {
    id: 'med',
    name: 'Medium-Gain Antenna',
    mass: 10,
    power: 15,
    cost: 4,
    rate: 1.5, // Gb per contact hour
    desc: 'Steerable horn antenna (1.5 Gb/h). Balanced throughput for standard science.'
  },
  high: {
    id: 'high',
    name: 'High-Gain Dish',
    mass: 30,
    power: 40,
    cost: 12,
    rate: 6.0, // Gb per contact hour
    desc: 'Parabolic reflector dish (6.0 Gb/h). Rapidly returns large telemetry and sensor datasets.'
  }
};

export const INSTRUMENTS = {
  cam: {
    id: 'cam',
    name: 'Visible Camera',
    type: 'imager',
    mass: 5,
    power: 15,
    cost: 6,
    data: 8,
    science: 20,
    desc: 'High-resolution multispectral framing camera for terrain mapping and feature detection.'
  },
  ir: {
    id: 'ir',
    name: 'Thermal IR Imager',
    type: 'imager',
    mass: 8,
    power: 25,
    cost: 12,
    data: 6,
    science: 25,
    desc: 'Infrared radiometer detecting heat variations, thermal inertia, and water ice.'
  },
  spec: {
    id: 'spec',
    name: 'Spectrometer',
    type: 'spectrometer',
    mass: 12,
    power: 30,
    cost: 18,
    data: 4,
    science: 35,
    desc: 'Reflectance spectrometer mapping mineralogy, atmospheric gases, and volatiles.'
  },
  rad: {
    id: 'rad',
    name: 'Radar Sounder',
    type: 'radar',
    mass: 40,
    power: 120,
    cost: 40,
    data: 10,
    science: 45,
    desc: 'Synthetic aperture radar sounder penetrating surface dust to probe sub-surface ice layers.'
  },
  mag: {
    id: 'mag',
    name: 'Magnetometer',
    type: 'fields',
    mass: 3,
    power: 5,
    cost: 4,
    data: 0.5,
    science: 12,
    desc: 'Boom sensor mapping remanent crustal magnetic fields and solar wind interaction.'
  },
  alt: {
    id: 'alt',
    name: 'Laser Altimeter',
    type: 'altimeter',
    mass: 20,
    power: 45,
    cost: 25,
    data: 3,
    science: 30,
    desc: 'Precision pulsed LIDAR yielding ultra-accurate global digital elevation maps.'
  }
};

export const RELEVANCE_MULTIPLIERS = {
  cam:  { earth: 1.0, moon: 0.9, mars: 1.0 },
  ir:   { earth: 1.2, moon: 0.7, mars: 0.8 },
  spec: { earth: 1.0, moon: 1.2, mars: 1.2 },
  rad:  { earth: 0.8, moon: 1.1, mars: 1.1 },
  mag:  { earth: 0.2, moon: 0.5, mars: 0.7 },
  alt:  { earth: 0.5, moon: 1.2, mars: 1.0 }
};

export const EXTRAS = {
  rad_hard: {
    id: 'rad_hard',
    name: 'Radiation-Hardened Electronics',
    mass: 6,
    power: 0,
    cost: 5,
    lifetimeBonus: 0.5,
    desc: 'Shielded chips and latch-up protection. Immunizes avionics against solar flares (+0.5 yr).'
  },
  red_comp: {
    id: 'red_comp',
    name: 'Redundant Computer',
    mass: 4,
    power: 10,
    cost: 6,
    lifetimeBonus: 0,
    desc: 'Dual-fault tolerant flight processor. Prevents instrument fault events.'
  },
  therm_ctrl: {
    id: 'therm_ctrl',
    name: 'Thermal Control Kit',
    mass: 8,
    power: 0,
    cost: 3,
    lifetimeBonus: 0,
    desc: 'Active louvers and multi-layer insulation blankets. Prevents thermal swing degradation.'
  }
};

export const LAUNCHERS = {
  light: {
    id: 'light',
    name: 'Light-Lift Rocket',
    capacity: {
      earth: 500,
      moon: null,
      mars: null
    },
    cost: 10,
    desc: 'Small dedicated rocket. 500 kg payload capacity to Low Earth Orbit; cannot reach Moon or Mars.'
  },
  medium: {
    id: 'medium',
    name: 'Medium-Lift Rocket',
    capacity: {
      earth: 6000,
      moon: 1500,
      mars: 600
    },
    cost: 55,
    desc: 'Multi-stage workhorse. Lifts 6,000 kg to Earth orbit, 1,500 kg to Moon, or 600 kg to Mars.'
  },
  heavy: {
    id: 'heavy',
    name: 'Heavy-Lift Rocket',
    capacity: {
      earth: 20000,
      moon: 5000,
      mars: 2500
    },
    cost: 140,
    desc: 'High-capacity heavy booster: 20,000 kg to Earth, 5,000 kg to Moon, or 2,500 kg to Mars.'
  }
};

export const ORBITS = {
  earth: {
    sso: {
      id: 'sso',
      name: 'Sun-synchronous LEO',
      sunFraction: 0.85,
      contactHours: 1.2,
      coverage: 1.0,
      massMult: 1.0,
      note: 'Passes over the same local time each day; great for comparing images'
    },
    eq_leo: {
      id: 'eq_leo',
      name: 'Equatorial LEO',
      sunFraction: 0.65,
      contactHours: 2.0,
      coverage: 0.8,
      massMult: 1.0,
      note: 'Sees the tropics often; more time in eclipse'
    },
    geo: {
      id: 'geo',
      name: 'Geostationary',
      sunFraction: 0.99,
      contactHours: 24.0,
      coverage: 0.6,
      massMult: 2.2,
      note: 'Always sees one region and always talks to Earth, but far away and expensive to reach'
    }
  },
  moon: {
    moon_polar: {
      id: 'moon_polar',
      name: 'Low polar orbit',
      sunFraction: 0.80,
      contactHours: 3.0,
      coverage: 1.0,
      massMult: 1.0,
      note: 'Sees the whole Moon over time'
    },
    moon_elliptical: {
      id: 'moon_elliptical',
      name: 'Elliptical orbit',
      sunFraction: 0.90,
      contactHours: 5.0,
      coverage: 0.85,
      massMult: 1.1,
      note: 'Slower over the south pole, more communications time'
    },
    moon_nrho: {
      id: 'moon_nrho',
      name: 'Near-rectilinear halo',
      sunFraction: 0.98,
      contactHours: 10.0,
      coverage: 0.6,
      massMult: 1.4,
      note: 'Great communications and power, less detailed surface coverage'
    }
  },
  mars: {
    mars_polar: {
      id: 'mars_polar',
      name: 'Low polar orbit',
      sunFraction: 0.80,
      contactHours: 3.5,
      coverage: 1.0,
      massMult: 1.0,
      note: 'Best surface coverage'
    },
    mars_elliptical: {
      id: 'mars_elliptical',
      name: 'Elliptical orbit',
      sunFraction: 0.90,
      contactHours: 6.0,
      coverage: 0.85,
      massMult: 1.2,
      note: 'More contact time, less detail'
    },
    mars_areo: {
      id: 'mars_areo',
      name: 'Areostationary',
      sunFraction: 0.97,
      contactHours: 24.0,
      coverage: 0.55,
      massMult: 1.8,
      note: 'Constant view of one region, costly to reach'
    }
  }
};

export const REAL_MISSIONS = {
  earth: [
    {
      name: 'Landsat 9 (NASA and USGS)',
      matchCriteria: ['cam', 'ir'],
      desc: 'NASA/USGS Earth observation flagship carrying the Operational Land Imager and Thermal Infrared Sensor 2.'
    },
    {
      name: 'Terra (NASA)',
      matchCriteria: ['ir', 'spec', 'rad'],
      desc: 'Multi-national flagship satellite monitoring global environmental dynamics with five advanced sensors.'
    }
  ],
  moon: [
    {
      name: 'Lunar Reconnaissance Orbiter (NASA)',
      matchCriteria: ['alt', 'cam', 'rad'],
      desc: "NASA's premier lunar orbiter using LOLA laser altimetry and Mini-RF radar to map polar ice."
    },
    {
      name: 'Chandrayaan-2 orbiter (ISRO, India, not NASA)',
      matchCriteria: ['spec', 'rad', 'ir'],
      desc: "ISRO's high-resolution lunar explorer equipped with infrared spectrometers and dual-frequency radar."
    }
  ],
  mars: [
    {
      name: 'Mars Reconnaissance Orbiter (NASA)',
      matchCriteria: ['cam', 'spec', 'rad'],
      desc: 'Ultra-high-resolution explorer featuring HiRISE optical imaging and the SHARAD subsurface radar sounder.'
    },
    {
      name: 'MAVEN (NASA)',
      matchCriteria: ['spec', 'mag'],
      desc: "NASA orbiter studying the loss of Mars's atmospheric volatiles to space through magnetic and solar wind sensors."
    }
  ]
};
