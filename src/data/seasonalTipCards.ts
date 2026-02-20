export interface SeasonalCard {
	id: string;
	title: string;
	image?: string; // emoji or image path
	bullets: string[];
	season?: 'spring' | 'summer' | 'fall' | 'winter';
	riskCategory?: 'water' | 'fire' | 'structural' | 'energy' | 'safety';
	priorityLevel?: 'low' | 'medium' | 'high';
	serviceLevel?: 'basic' | 'moderate' | 'professional';
}

export const tipsDisclaimer = `
Seasonal tips are provided for general informational purposes only. 
Always consult qualified professionals for inspections, repairs, 
or hazardous work.
`;

export const seasonalTipCards: SeasonalCard[] = [
	// --------------------
	// WATER / MOISTURE
	// --------------------
	// Gutters
	{
		id: 'gutters',
		title: 'Inspect Your Gutters',
		image: 'Assets/TipsImages/gutters.png',
		bullets: [
			'Clear visible debris to promote proper drainage',
			'Look for signs of leaks or loose sections',
			'Consider gutter guards to reduce clogging and maintenance',
		],
		season: 'fall',
		serviceLevel: 'moderate',
		riskCategory: 'water',
		priorityLevel: 'high',
	},
	// Grading
	{
		id: 'grading',
		title: 'Check Exterior Drainage & Grading',
		image: 'Assets/TipsImages/drainage.png',
		bullets: [
			'Ensure soil slopes away from the foundation',
			'Extend downspouts away from the home',
			'Look for standing water after rainfall',
		],
		season: 'spring',
		serviceLevel: 'moderate',
		riskCategory: 'water',
		priorityLevel: 'high',
	},
	// Water Leaks
	{
		id: 'waterleak',
		title: 'Check for Hidden Water Leaks',
		image: 'Assets/TipsImages/waterleak.png',
		bullets: [
			'Monitor water bills for unusual increases',
			'Inspect under sinks and around toilets for moisture',
			'Consider installing leak detection devices',
		],
		season: 'spring',
		serviceLevel: 'basic',
		riskCategory: 'water',
		priorityLevel: 'high',
	},
	// Caulking & Seals
	{
		id: 'caulking',
		title: 'Inspect Caulking & Seals',
		image: 'Assets/TipsImages/caulking.png',
		bullets: [
			'Check tubs, showers, and sinks for cracked caulk',
			'Reseal areas showing gaps or discoloration',
			'Address leaks early to reduce moisture damage',
		],
		season: 'fall',
		serviceLevel: 'basic',
		riskCategory: 'water',
		priorityLevel: 'medium',
	},
	// Sump Pump
	{
		id: 'sump',
		title: 'Sump Pump & Basement Check',
		image: 'Assets/TipsImages/sumppump.png',
		bullets: [
			'Test pump operation and backup systems periodically',
			'Look for signs of excess moisture',
			'Seek professional assistance if issues arise',
		],
		season: 'spring',
		serviceLevel: 'moderate',
		riskCategory: 'water',
		priorityLevel: 'high',
	},

	// --------------------
	// FIRE / SAFETY
	// --------------------
	// Smoke & CO Detectors
	{
		id: 'safety',
		title: 'Test Smoke & CO Detectors',
		image: 'Assets/TipsImages/SmokeDetector.jpg',
		bullets: [
			'Test detectors regularly and replace batteries as needed',
			'Ensure units are installed on each level',
			'Keep installation and replacement records',
		],
		season: 'fall',
		serviceLevel: 'basic',
		riskCategory: 'fire',
		priorityLevel: 'high',
	},
	// Dryer Vent
	{
		id: 'dryervent',
		title: 'Dryer Vent Inspection',
		image: 'Assets/TipsImages/Dryer.jpg',
		bullets: [
			'Clean lint traps regularly',
			'Inspect exterior vent for blockages',
			'Schedule professional cleaning if airflow is restricted',
		],
		season: 'winter',
		serviceLevel: 'moderate',
		riskCategory: 'fire',
		priorityLevel: 'high',
	},
	// Chimney & Fireplace
	{
		id: 'chimney',
		title: 'Chimney & Fireplace Service',
		image: 'Assets/TipsImages/Fireplace.jpg',
		bullets: [
			'Have chimney professionally cleaned and inspected annually',
			'Ensure dampers operate properly',
			'Install carbon monoxide detectors nearby',
		],
		season: 'winter',
		serviceLevel: 'professional',
		riskCategory: 'fire',
		priorityLevel: 'high',
	},
	// Electrical System
	{
		id: 'electrical',
		title: 'Electrical System Check',
		image: 'Assets/TipsImages/electrical.png',
		bullets: [
			'Watch for breaker trips or unusual heat',
			'Replace damaged cords',
			'Consult a licensed electrician for concerns',
		],
		season: 'fall',
		serviceLevel: 'professional',
		riskCategory: 'fire',
		priorityLevel: 'high',
	},

	// --------------------
	// STRUCTURAL
	// --------------------
	// Roof Condition
	{
		id: 'roof',
		title: 'Roof Condition Check',
		image: 'Assets/TipsImages/shingles.png',
		bullets: [
			'Visually inspect shingles from the ground',
			'Look for attic moisture or staining',
			'Consult a professional if damage is suspected',
		],
		season: 'winter',
		serviceLevel: 'professional',
		riskCategory: 'structural',
		priorityLevel: 'high',
	},
	// Deck & Porch
	{
		id: 'deck',
		title: 'Deck & Porch Care',
		image: 'Assets/TipsImages/deck.png',
		bullets: [
			'Inspect for rot or loose fasteners',
			'Clean and reseal wood surfaces',
			'Address structural issues with a contractor',
		],
		season: 'spring',
		serviceLevel: 'moderate',
		riskCategory: 'structural',
		priorityLevel: 'medium',
	},
	// Tree & Branch Inspection
	{
		id: 'trees',
		title: 'Tree & Branch Inspection',
		image: 'Assets/TipsImages/branches.png',
		bullets: [
			'Trim weak branches near structures',
			'Remove dead limbs',
			'Consult an arborist for large trees',
		],
		season: 'summer',
		serviceLevel: 'professional',
		riskCategory: 'structural',
		priorityLevel: 'medium',
	},

	// --------------------
	// MECHANICAL SYSTEMS
	// --------------------
	// HVAC System
	{
		id: 'hvac',
		title: 'HVAC System Check',
		image: 'Assets/TipsImages/HVAC.jpg',
		bullets: [
			'Replace or clean air filters',
			'Schedule seasonal professional servicing',
			'Verify thermostat operation',
		],
		season: 'summer',
		serviceLevel: 'professional',
		riskCategory: 'energy',
		priorityLevel: 'high',
	},
	// Water Heater
	{
		id: 'waterheater',
		title: 'Water Heater Maintenance',
		image: 'Assets/TipsImages/waterheater.png',
		bullets: [
			'Check for leaks around the unit',
			'Consider professional flushing',
			'Insulate older tanks if needed',
		],
		season: 'winter',
		serviceLevel: 'professional',
		riskCategory: 'water',
		priorityLevel: 'medium',
	},
	// Appliance Performance Check
	{
		id: 'appliances',
		title: 'Appliance Performance Check',
		image: 'Assets/TipsImages/appliances.png',
		bullets: [
			'Clean refrigerator coils',
			'Inspect washing machine hoses',
			'Replace worn supply lines if needed',
		],
		season: 'summer',
		serviceLevel: 'moderate',
		riskCategory: 'water',
		priorityLevel: 'medium',
	},

	// --------------------
	// WEATHER PREP
	// --------------------
	// Cold Weather Prep
	{
		id: 'freeze',
		title: 'Cold Weather Preparation',
		image: 'Assets/TipsImages/winter.jpg',
		bullets: [
			'Disconnect outdoor hoses',
			'Shut off exterior water lines if applicable',
			'Seal gaps in unheated areas',
		],
		season: 'fall',
		serviceLevel: 'moderate',
		riskCategory: 'water',
		priorityLevel: 'high',
	},

	// --------------------
	// DOCUMENTATION / ADMIN
	// --------------------
	// Insurance & Records
	{
		id: 'documentation',
		title: 'Review Insurance & Home Records',
		image: 'Assets/TipsImages/Home.jpg',
		bullets: [
			'Verify insurance coverage limits',
			'Organize maintenance records',
			'Document major repairs and upgrades',
		],
		season: 'fall',
		serviceLevel: 'basic',
		riskCategory: 'safety',
		priorityLevel: 'medium',
	},
	// Emergency Preparedness
	{
		id: 'emergency',
		title: 'Review Emergency Preparedness',
		image: 'Assets/TipsImages/emergency.png',
		bullets: [
			'Confirm fire extinguishers are accessible',
			'Review evacuation procedures',
			'Store important documents securely',
		],
		season: 'summer',
		serviceLevel: 'basic',
		riskCategory: 'safety',
		priorityLevel: 'medium',
	},
];

export default seasonalTipCards;
