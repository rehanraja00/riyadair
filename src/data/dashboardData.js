export const lastUpdated = '2026-06-03';

export const sourceLinks = [
  {
    id: 'gaca-aviation-programme',
    label: 'Saudi Aviation Programme - passenger, destination and cargo targets',
    url: 'https://gaca.gov.sa/en/aviation-programme',
    owner: 'GACA',
    refreshCadence: 'Quarterly'
  },
  {
    id: 'pif-ksia',
    label: 'King Salman International Airport masterplan and capacity targets',
    url: 'https://www.pif.gov.sa/en/news-and-insights/press-releases/2022/king-salman-international-airport/',
    owner: 'PIF',
    refreshCadence: 'Quarterly'
  },
  {
    id: 'riyadhair-787',
    label: 'Riyadh Air Boeing 787-9 order announcement',
    url: 'https://www.riyadhair.com/en/media-hub/riyadh-air-announces-first-fleet-order-of-72-boeing-787-9-dreaml',
    owner: 'Riyadh Air',
    refreshCadence: 'Event-based'
  },
  {
    id: 'riyadhair-a321',
    label: 'Riyadh Air Airbus A321neo-family order announcement',
    url: 'https://www.riyadhair.com/en/media-hub/riyadh-air-orders-60-next-generation-airbus-a321-aircraft--power',
    owner: 'Riyadh Air',
    refreshCadence: 'Event-based'
  },
  {
    id: 'airbus-a350',
    label: 'Riyadh Air Airbus A350-1000 firm order announcement',
    url: 'https://www.airbus.com/en/newsroom/press-releases/2025-06-riyadh-air-places-firm-order-for-25-airbus-a350-1000-aircraft',
    owner: 'Airbus',
    refreshCadence: 'Event-based'
  },
  {
    id: 'qatar-airways-financial',
    label: 'Qatar Airways FY2025/26 financial and operational performance',
    url: 'https://www.qatarairways.com/press-releases/en-WW/265838-qatar-airways-group-delivers-robust-financial-performance-despite-global-economic-instability/',
    owner: 'Qatar Airways',
    refreshCadence: 'Annual'
  },
  {
    id: 'hia-2025',
    label: 'Hamad International Airport 2025 operational performance',
    url: 'https://dohahamadairport.com/press-releases/news/2025-operational-performance',
    owner: 'Hamad International Airport',
    refreshCadence: 'Annual'
  },
];

export const executiveKpis = [
  {
    id: 'saudi-passenger-target',
    label: 'Saudi Aviation Target',
    value: 330,
    unit: 'M passengers',
    period: '2030 target',
    status: 'watch',
    trend: '+ strategic build-out',
    sourceId: 'gaca-aviation-programme'
  },
  {
    id: 'ksia-2050-capacity',
    label: 'KSIA Planned Capacity',
    value: 185,
    unit: 'M passengers',
    period: '2050 target',
    status: 'high',
    trend: 'mega-hub scale',
    sourceId: 'pif-ksia'
  },
  {
    id: 'riyadh-air-orderbook',
    label: 'Riyadh Air Order Book',
    value: 182,
    unit: 'aircraft potential',
    period: 'firm + options/rights',
    status: 'high',
    trend: 'widebody + narrowbody',
    sourceId: 'riyadhair-787'
  },
  {
    id: 'qatar-airways-passengers',
    label: 'Qatar Airways Passengers',
    value: 41.8,
    unit: 'M passengers',
    period: 'FY2025/26',
    status: 'stable',
    trend: 'mature network',
    sourceId: 'qatar-airways-financial'
  },
  {
    id: 'hia-passengers',
    label: 'HIA Throughput',
    value: 54.3,
    unit: 'M passengers',
    period: '2025',
    status: 'stable',
    trend: 'hub scale',
    sourceId: 'hia-2025'
  }
];

export const fleetOrders = [
  {
    airline: 'Riyadh Air',
    aircraftType: 'Airbus A321neo family',
    firmOrders: 60,
    options: 0,
    totalPotential: 60,
    role: 'Regional and medium-haul feeder routes',
    routeExamples: ['Doha', 'Jeddah', 'Cairo', 'Istanbul', 'Mumbai', 'Delhi'],
    strategicMeaning: 'Creates regional feed for long-haul Riyadh hub operations and Doha competition.',
    sourceId: 'riyadhair-a321'
  },
  {
    airline: 'Riyadh Air',
    aircraftType: 'Boeing 787-9 Dreamliner',
    firmOrders: 39,
    options: 33,
    totalPotential: 72,
    role: 'Long-haul premium and thinner intercontinental routes',
    routeExamples: ['London', 'Paris', 'Frankfurt', 'Singapore', 'Bangkok', 'Tokyo', 'New York'],
    strategicMeaning: 'Allows Riyadh Air to challenge long-haul one-stop flows through Doha.',
    sourceId: 'riyadhair-787'
  },
  {
    airline: 'Riyadh Air',
    aircraftType: 'Airbus A350-1000',
    firmOrders: 25,
    options: 25,
    totalPotential: 50,
    role: 'High-capacity long-haul and ultra-long-haul flagship routes',
    routeExamples: ['New York', 'Los Angeles', 'Toronto', 'Sydney', 'Shanghai', 'São Paulo'],
    strategicMeaning: 'Targets premium high-yield long-haul routes served by Qatar Airways.',
    sourceId: 'airbus-a350'
  }
];

export const airlineProfiles = [
  {
    airline: 'Riyadh Air',
    hub: 'Riyadh / King Salman International Airport',
    passengerMetric: null,
    passengerPeriod: 'Pre-scale operations',
    destinations: null,
    cargoTonnes: null,
    strengths: ['Saudi domestic scale', 'PIF backing', 'new fleet', 'Vision 2030 alignment'],
    vulnerabilities: ['execution risk', 'route launch risk', 'delivery risk', 'brand maturity']
  },
  {
    airline: 'Qatar Airways',
    hub: 'Doha / Hamad International Airport',
    passengerMetric: 41.8,
    passengerPeriod: 'FY2025/26 passengers',
    destinations: 183,
    cargoTonnes: 1.43,
    strengths: ['premium brand', 'Oneworld position', 'HIA efficiency', 'cargo scale'],
    vulnerabilities: ['transfer exposure', 'small domestic market', 'Saudi demand diversion']
  },
];

export const threatAssessment = [
  {
    id: 'transfer-diversion',
    threatArea: 'Transfer Traffic Diversion',
    category: 'Network',
    qatarExposure: 5,
    trigger: 'Riyadh Air launches competitive one-stop corridors between Europe, Asia, Africa and North America.',
    leadingIndicators: ['new Riyadh long-haul routes', 'fare discounting', 'codeshares', 'loyalty campaign'],
    recommendedAction: 'Monitor route launches and compare fare/schedule competitiveness on top O&D corridors.'
  },
  {
    id: 'saudi-origin-demand',
    threatArea: 'Saudi-Origin Demand Capture',
    category: 'Market',
    qatarExposure: 5,
    trigger: 'Saudi passengers increasingly use Riyadh Air rather than connecting through Doha.',
    leadingIndicators: ['Saudi corporate contracts', 'government travel policy', 'loyalty enrollment', 'Riyadh frequency growth'],
    recommendedAction: 'Track Saudi-origin passengers and premium yield on routes touching Saudi demand.'
  },
  {
    id: 'premium-passenger',
    threatArea: 'Premium Passenger Competition',
    category: 'Commercial',
    qatarExposure: 5,
    trigger: 'Riyadh Air launches competitive business-class product and premium loyalty offering.',
    leadingIndicators: ['cabin reveal', 'corporate contracts', 'business-class fare positioning', 'high-value route launch'],
    recommendedAction: 'Benchmark premium product, corporate account wins and yield pressure on overlapping corridors.'
  },
  {
    id: 'cargo-logistics',
    threatArea: 'Cargo and Logistics Diversion',
    category: 'Cargo',
    qatarExposure: 4,
    trigger: 'Riyadh hub integrates cargo with industrial zones, e-commerce, land bridge and logistics platforms.',
    leadingIndicators: ['cargo terminal milestones', 'freighter announcements', 'integrator partnerships', 'customs process changes'],
    recommendedAction: 'Create cargo corridor watchlist and monitor shipment diversion risk by commodity group.'
  },
  {
    id: 'tourism-demand',
    threatArea: 'Saudi Tourism Pull',
    category: 'Tourism',
    qatarExposure: 3,
    trigger: 'Saudi leisure destinations begin capturing traffic previously routed through or stopping in Doha.',
    leadingIndicators: ['tourism arrivals', 'event calendar', 'hotel pipeline', 'destination marketing'],
    recommendedAction: 'Monitor tourism air demand and stopover package competitiveness.'
  },
  {
    id: 'airport-scale',
    threatArea: 'Riyadh Mega-Hub Scale',
    category: 'Infrastructure',
    qatarExposure: 3,
    trigger: 'KSIA delivery creates capacity to compete structurally with Doha.',
    leadingIndicators: ['construction progress', 'terminal opening dates', 'runway capacity', 'airport retail/logistics concessions'],
    recommendedAction: 'Track airport milestones against route and fleet delivery timeline.'
  }
];

export const routeCorridors = [
  {
    corridor: 'Europe ↔ South Asia',
    currentHubStrength: 'Doha strong',
    threatLevel: 'High',
    riyadhAircraft: 'A321neo feed + 787-9 / A350-1000 long-haul',
    watchMetrics: ['Riyadh-London', 'Riyadh-Delhi', 'Riyadh-Mumbai', 'one-stop fare spread']
  },
  {
    corridor: 'Europe ↔ Southeast Asia',
    currentHubStrength: 'Doha strong',
    threatLevel: 'High',
    riyadhAircraft: '787-9 / A350-1000',
    watchMetrics: ['Riyadh-Singapore', 'Riyadh-Bangkok', 'Riyadh-Kuala Lumpur', 'corporate demand']
  },
  {
    corridor: 'Saudi Arabia ↔ North America',
    currentHubStrength: 'Doha intermediate',
    threatLevel: 'High',
    riyadhAircraft: '787-9 / A350-1000',
    watchMetrics: ['Riyadh-New York', 'Riyadh-Los Angeles', 'codeshares', 'premium loads']
  },
  {
    corridor: 'GCC ↔ Europe',
    currentHubStrength: 'Doha strong',
    threatLevel: 'Medium',
    riyadhAircraft: 'A321neo + 787-9',
    watchMetrics: ['frequency growth', 'business-class pricing', 'Saudi corporate accounts']
  },
  {
    corridor: 'Africa ↔ Asia',
    currentHubStrength: 'Doha strong',
    threatLevel: 'Medium',
    riyadhAircraft: 'A321neo feed + 787-9',
    watchMetrics: ['East Africa routes', 'India feed', 'cargo belly capacity']
  }
];

export const actionRegister = [
  {
    id: 'A-001',
    action: 'Build monthly route launch tracker for Riyadh Air and Qatar Airways.',
    owner: 'Aviation Strategy',
    priority: 'High',
    due: '2026-07-15',
    status: 'In Progress',
    linkedThreat: 'Transfer Traffic Diversion'
  },
  {
    id: 'A-002',
    action: 'Create fare and schedule benchmark for the top 25 overlapping one-stop corridors.',
    owner: 'Commercial Analytics',
    priority: 'High',
    due: '2026-08-01',
    status: 'Not Started',
    linkedThreat: 'Premium Passenger Competition'
  },
  {
    id: 'A-003',
    action: 'Track King Salman International Airport construction and terminal readiness milestones.',
    owner: 'Infrastructure Watch',
    priority: 'Medium',
    due: '2026-09-01',
    status: 'In Progress',
    linkedThreat: 'Riyadh Mega-Hub Scale'
  },
  {
    id: 'A-004',
    action: 'Monitor cargo partnership announcements, freighter strategy and logistics zone integration.',
    owner: 'Cargo Strategy',
    priority: 'Medium',
    due: '2026-08-20',
    status: 'Not Started',
    linkedThreat: 'Cargo and Logistics Diversion'
  },
  {
    id: 'A-005',
    action: 'Prepare executive monthly brief on Riyadh aviation threat movement.',
    owner: 'Executive Insights',
    priority: 'High',
    due: '2026-07-31',
    status: 'Not Started',
    linkedThreat: 'All'
  }
];

export const metricTracker = [
  {
    metric: 'Saudi aviation passenger target',
    entity: 'Saudi Aviation Programme',
    baseline: 330,
    unit: 'M passengers by 2030',
    direction: 'Higher means higher competitive pressure',
    status: 'Watch',
    sourceId: 'gaca-aviation-programme'
  },
  {
    metric: 'King Salman International Airport capacity',
    entity: 'KSIA',
    baseline: 185,
    unit: 'M passengers by 2050',
    direction: 'Higher means higher structural hub pressure',
    status: 'High',
    sourceId: 'pif-ksia'
  },
  {
    metric: 'Riyadh Air total aircraft potential',
    entity: 'Riyadh Air',
    baseline: 182,
    unit: 'aircraft',
    direction: 'Higher means faster network build-out potential',
    status: 'High',
    sourceId: 'riyadhair-787'
  },
  {
    metric: 'Qatar Airways passengers',
    entity: 'Qatar Airways',
    baseline: 41.8,
    unit: 'M passengers FY2025/26',
    direction: 'Higher means stronger current competitive base',
    status: 'Stable',
    sourceId: 'qatar-airways-financial'
  },
  {
    metric: 'Hamad International Airport passengers',
    entity: 'HIA',
    baseline: 54.3,
    unit: 'M passengers 2025',
    direction: 'Higher means stronger hub scale',
    status: 'Stable',
    sourceId: 'hia-2025'
  }
];
