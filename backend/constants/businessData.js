const CATEGORY_PROFILE = {
  'Dairy & Milk Products': { turnover: 0.28, raw: 0.48, labor: 0.12, inv: 0.05, opex: 0.09, other: 0.04, demand: 5, sector: 'food_processing', isLivestock: true, minProjectCost: 200000, recommendedCost: 600000, minMargin: 20000 },
  'Poultry Farming': { turnover: 0.30, raw: 0.52, labor: 0.10, inv: 0.06, opex: 0.08, other: 0.04, demand: 4, sector: 'livestock', isLivestock: true, minProjectCost: 150000, recommendedCost: 500000, minMargin: 15000 },
  'Goat & Sheep Farming': { turnover: 0.20, raw: 0.42, labor: 0.10, inv: 0.05, opex: 0.07, other: 0.04, demand: 3, sector: 'livestock', isLivestock: true, minProjectCost: 120000, recommendedCost: 400000, minMargin: 12000 },
  'Retail Kirana Store': { turnover: 0.55, raw: 0.72, labor: 0.06, inv: 0.08, opex: 0.06, other: 0.03, demand: 5, sector: 'trading', minProjectCost: 100000, recommendedCost: 350000, minMargin: 10000 },
  'Textiles & Handloom': { turnover: 0.22, raw: 0.46, labor: 0.16, inv: 0.06, opex: 0.08, other: 0.05, demand: 3, sector: 'manufacturing', minProjectCost: 120000, recommendedCost: 400000, minMargin: 12000 },
  'Tailoring & Boutique': { turnover: 0.26, raw: 0.34, labor: 0.22, inv: 0.05, opex: 0.09, other: 0.05, demand: 4, sector: 'service', minProjectCost: 50000, recommendedCost: 150000, minMargin: 5000 },
  'Beauty Parlour': { turnover: 0.30, raw: 0.22, labor: 0.26, inv: 0.05, opex: 0.14, other: 0.06, demand: 4, sector: 'service', minProjectCost: 60000, recommendedCost: 200000, minMargin: 6000 },
  'Mobile Repair & Recharge Shop': { turnover: 0.40, raw: 0.40, labor: 0.14, inv: 0.10, opex: 0.10, other: 0.05, demand: 4, sector: 'service', minProjectCost: 70000, recommendedCost: 200000, minMargin: 7000 },
  'Auto/E-Rickshaw Service': { turnover: 0.24, raw: 0.30, labor: 0.10, inv: 0.04, opex: 0.28, other: 0.06, demand: 4, sector: 'service', minProjectCost: 180000, recommendedCost: 300000, minMargin: 18000 },
  'Bakery & Confectionery': { turnover: 0.32, raw: 0.44, labor: 0.16, inv: 0.05, opex: 0.11, other: 0.05, demand: 4, sector: 'food_processing', isFoodProcessing: true, minProjectCost: 150000, recommendedCost: 450000, minMargin: 15000 },
  'Tea Stall / Snacks': { turnover: 0.45, raw: 0.42, labor: 0.14, inv: 0.05, opex: 0.13, other: 0.05, demand: 5, sector: 'service', minProjectCost: 30000, recommendedCost: 100000, minMargin: 5000 },
  'Vegetable & Fruit Vending': { turnover: 0.60, raw: 0.74, labor: 0.06, inv: 0.06, opex: 0.06, other: 0.03, demand: 5, sector: 'trading', minProjectCost: 25000, recommendedCost: 80000, minMargin: 5000 },
  'Agri-Inputs (Seeds, Fertilizer)': { turnover: 0.38, raw: 0.70, labor: 0.06, inv: 0.10, opex: 0.06, other: 0.03, demand: 4, sector: 'trading', minProjectCost: 150000, recommendedCost: 500000, minMargin: 15000 },
  'Fisheries': { turnover: 0.26, raw: 0.46, labor: 0.12, inv: 0.06, opex: 0.10, other: 0.05, demand: 3, sector: 'food_processing', minProjectCost: 120000, recommendedCost: 400000, minMargin: 12000 },
  'Handicrafts': { turnover: 0.20, raw: 0.32, labor: 0.24, inv: 0.06, opex: 0.08, other: 0.06, demand: 3, sector: 'manufacturing', minProjectCost: 50000, recommendedCost: 150000, minMargin: 5000 },
  'Beekeeping': { turnover: 0.22, raw: 0.28, labor: 0.14, inv: 0.06, opex: 0.09, other: 0.06, demand: 3, sector: 'manufacturing', minProjectCost: 60000, recommendedCost: 180000, minMargin: 6000 },
  'Flour Mill': { turnover: 0.34, raw: 0.58, labor: 0.08, inv: 0.06, opex: 0.12, other: 0.04, demand: 4, sector: 'food_processing', isFoodProcessing: true, minProjectCost: 150000, recommendedCost: 450000, minMargin: 15000 },
  'Papad / Pickle Making': { turnover: 0.28, raw: 0.40, labor: 0.20, inv: 0.06, opex: 0.08, other: 0.05, demand: 4, sector: 'food_processing', isFoodProcessing: true, minProjectCost: 60000, recommendedCost: 180000, minMargin: 6000 },
  'Photocopy & CSC Centre': { turnover: 0.36, raw: 0.20, labor: 0.14, inv: 0.06, opex: 0.16, other: 0.06, demand: 4, sector: 'service', minProjectCost: 80000, recommendedCost: 220000, minMargin: 8000 },
  'Two-Wheeler Repair': { turnover: 0.30, raw: 0.34, labor: 0.20, inv: 0.08, opex: 0.10, other: 0.05, demand: 4, sector: 'service', minProjectCost: 90000, recommendedCost: 250000, minMargin: 9000 },
};

const EXPANSION_TYPES = {
  machinery: {
    id: 'machinery',
    name: 'Machinery & Equipment Modernisation',
    name_hi: 'मशीनरी एवं उपकरण आधुनिकीकरण',
    description: 'Upgrade tools, semi-automatic machinery, cold storage or power backup to boost throughput.',
    cost_multiplier: 0.45,
    growth_multiplier: 0.40,
    margin_boost: 3.5,
  },
  inventory: {
    id: 'inventory',
    name: 'Inventory & Bulk Stock Expansion',
    name_hi: 'थोक इन्वेंटरी एवं कार्यशील पूंजी विस्तार',
    description: 'Procure bulk stock at distributor rates, expand stock variety and reduce replenishment cycles.',
    cost_multiplier: 0.30,
    growth_multiplier: 0.35,
    margin_boost: 2.5,
  },
  branch: {
    id: 'branch',
    name: 'Additional Counter / Mobile Delivery Unit',
    name_hi: 'अतिरिक्त काउंटर / मोबाइल डिलीवरी यूनिट',
    description: 'Open a second service point, purchase transport/delivery vehicle or tap neighbouring weekly haats.',
    cost_multiplier: 0.65,
    growth_multiplier: 0.70,
    margin_boost: 4.0,
  },
  processing: {
    id: 'processing',
    name: 'Value-Addition & Branded Packaging',
    name_hi: 'मूल्य संवर्धन एवं पैकेजिंग यूनिट',
    description: 'Convert basic raw produce into packaged, branded, shelf-stable goods with higher profit margin.',
    cost_multiplier: 0.55,
    growth_multiplier: 0.55,
    margin_boost: 6.0,
  },
};

function getProfile(cat) {
  return CATEGORY_PROFILE[cat] || {
    turnover: 0.30, raw: 0.42, labor: 0.14, inv: 0.06, opex: 0.10, other: 0.05, demand: 3,
    sector: 'service', minProjectCost: 100000, recommendedCost: 300000, minMargin: 10000,
  };
}

const STATE_PPP = {
  Gujarat: 5, Karnataka: 5, 'Tamil Nadu': 5, Maharashtra: 5, Telangana: 4,
  'West Bengal': 3, 'Uttar Pradesh': 3, Bihar: 2,
};

const CATEGORY_SUPPLY = {
  'Dairy & Milk Products': { raw: [{ item: 'Fresh Milk (bulk)', unit: '₹/litre' }, { item: 'Cattle Feed & Fodder', unit: '₹/50kg' }, { item: 'Rennet & Cultures', unit: '₹/kit' }], machinery: [{ item: 'Milk Chilling Unit', unit: '₹/unit' }, { item: 'Cream Separator', unit: '₹/unit' }] },
  'Poultry Farming': { raw: [{ item: 'Day-old Chicks', unit: '₹/chick' }, { item: 'Poultry Feed', unit: '₹/50kg' }, { item: 'Vaccines & Medicines', unit: '₹/dose' }], machinery: [{ item: 'Automatic Feeder & Drinker', unit: '₹/set' }, { item: 'Brooder / Incubator', unit: '₹/unit' }] },
  'Goat & Sheep Farming': { raw: [{ item: 'Goat Kids / Breeding Stock', unit: '₹/head' }, { item: 'Green Fodder', unit: '₹/quintal' }, { item: 'Mineral Mixture & Feed', unit: '₹/50kg' }], machinery: [{ item: 'Chaff Cutter', unit: '₹/unit' }, { item: 'Shed & Fencing Material', unit: '₹/set' }] },
  'Retail Kirana Store': { raw: [{ item: 'FMCG Wholesale Stock', unit: '₹/carton' }, { item: 'Grains & Pulses', unit: '₹/quintal' }, { item: 'Edible Oil', unit: '₹/15L tin' }], machinery: [{ item: 'Display Racks & Shelving', unit: '₹/set' }, { item: 'Digital Weighing Scale', unit: '₹/unit' }] },
  'Textiles & Handloom': { raw: [{ item: 'Cotton / Silk Yarn', unit: '₹/kg' }, { item: 'Dyes & Chemicals', unit: '₹/kg' }, { item: 'Warp & Weft Thread', unit: '₹/cone' }], machinery: [{ item: 'Handloom / Powerloom', unit: '₹/unit' }, { item: 'Warping Drum', unit: '₹/unit' }] },
  'Tailoring & Boutique': { raw: [{ item: 'Fabric Rolls', unit: '₹/metre' }, { item: 'Thread & Trims', unit: '₹/box' }, { item: 'Buttons & Zips', unit: '₹/gross' }], machinery: [{ item: 'Sewing Machine', unit: '₹/unit' }, { item: 'Overlock / Interlock Machine', unit: '₹/unit' }] },
  'Beauty Parlour': { raw: [{ item: 'Cosmetics & Creams', unit: '₹/kit' }, { item: 'Hair Colour & Chemicals', unit: '₹/pack' }, { item: 'Disposables (wax, tissues)', unit: '₹/pack' }], machinery: [{ item: 'Facial & Steamer Unit', unit: '₹/unit' }, { item: 'Hair Dryer & Styling Kit', unit: '₹/set' }] },
  'Mobile Repair & Recharge Shop': { raw: [{ item: 'Spare Parts (screens, batteries)', unit: '₹/unit' }, { item: 'Accessories (covers, chargers)', unit: '₹/piece' }, { item: 'Recharge / SIM Stock', unit: '₹/lot' }], machinery: [{ item: 'Soldering & Rework Station', unit: '₹/unit' }, { item: 'Battery / Display Tester', unit: '₹/unit' }] },
  'Auto/E-Rickshaw Service': { raw: [{ item: 'Battery Charging / Fuel', unit: '₹/month' }, { item: 'Spare Parts & Tyres', unit: '₹/set' }, { item: 'Lubricants', unit: '₹/litre' }], machinery: [{ item: 'E-Rickshaw / Auto Vehicle', unit: '₹/unit' }, { item: 'Battery Charging Setup', unit: '₹/set' }] },
  'Bakery & Confectionery': { raw: [{ item: 'Refined Flour (Maida)', unit: '₹/50kg' }, { item: 'Sugar', unit: '₹/50kg' }, { item: 'Butter & Ghee', unit: '₹/kg' }], machinery: [{ item: 'Rotary Oven', unit: '₹/unit' }, { item: 'Planetary Mixer', unit: '₹/unit' }] },
  'Tea Stall / Snacks': { raw: [{ item: 'Milk & Tea Leaves', unit: '₹/kg' }, { item: 'Sugar & Spices', unit: '₹/kg' }, { item: 'Snack Ingredients (flour, oil)', unit: '₹/kg' }], machinery: [{ item: 'Gas Stove & Burner', unit: '₹/set' }, { item: 'Refrigerator & Display Counter', unit: '₹/unit' }] },
  'Vegetable & Fruit Vending': { raw: [{ item: 'Fresh Vegetables', unit: '₹/quintal' }, { item: 'Seasonal Fruits', unit: '₹/crate' }, { item: 'Crates & Baskets', unit: '₹/dozen' }], machinery: [{ item: 'Handcart / Thela', unit: '₹/unit' }, { item: 'Weighing Scale', unit: '₹/unit' }] },
  'Agri-Inputs (Seeds, Fertilizer)': { raw: [{ item: 'Certified Seeds', unit: '₹/kg' }, { item: 'Fertilizers (Urea/DAP)', unit: '₹/50kg' }, { item: 'Pesticides', unit: '₹/litre' }], machinery: [{ item: 'Storage Racks', unit: '₹/set' }, { item: 'Sprayer Stock', unit: '₹/unit' }] },
  'Fisheries': { raw: [{ item: 'Fish Seed / Fingerlings', unit: '₹/1000' }, { item: 'Fish Feed', unit: '₹/50kg' }, { item: 'Lime & Supplements', unit: '₹/50kg' }], machinery: [{ item: 'Aerator / Water Pump', unit: '₹/unit' }, { item: 'Fishing Nets', unit: '₹/set' }] },
  'Handicrafts': { raw: [{ item: 'Raw Wood / Bamboo / Clay', unit: '₹/kg' }, { item: 'Paints & Polish', unit: '₹/litre' }, { item: 'Beads & Embellishments', unit: '₹/pack' }], machinery: [{ item: 'Hand Tools Set', unit: '₹/set' }, { item: 'Polishing / Carving Machine', unit: '₹/unit' }] },
  'Beekeeping': { raw: [{ item: 'Bee Colonies', unit: '₹/box' }, { item: 'Sugar (feed)', unit: '₹/50kg' }, { item: 'Comb Foundation Sheets', unit: '₹/pack' }], machinery: [{ item: 'Bee Boxes / Hives', unit: '₹/unit' }, { item: 'Honey Extractor', unit: '₹/unit' }] },
  'Flour Mill': { raw: [{ item: 'Wheat / Grains', unit: '₹/quintal' }, { item: 'Gunny Bags', unit: '₹/dozen' }], machinery: [{ item: 'Atta Chakki (Pulveriser)', unit: '₹/unit' }, { item: 'Sieving Machine', unit: '₹/unit' }] },
  'Papad / Pickle Making': { raw: [{ item: 'Pulses / Flour', unit: '₹/50kg' }, { item: 'Oil & Spices', unit: '₹/kg' }, { item: 'Raw Mango / Lemon', unit: '₹/quintal' }], machinery: [{ item: 'Papad Rolling Machine', unit: '₹/unit' }, { item: 'Grinder & Mixer', unit: '₹/unit' }] },
  'Photocopy & CSC Centre': { raw: [{ item: 'A4 Paper', unit: '₹/ream' }, { item: 'Toner & Cartridges', unit: '₹/unit' }, { item: 'Stationery Stock', unit: '₹/lot' }], machinery: [{ item: 'Photocopier / Printer', unit: '₹/unit' }, { item: 'Computer & Scanner', unit: '₹/set' }] },
  'Two-Wheeler Repair': { raw: [{ item: 'Spare Parts', unit: '₹/set' }, { item: 'Engine Oil & Lubricants', unit: '₹/litre' }, { item: 'Tyres & Tubes', unit: '₹/piece' }], machinery: [{ item: 'Air Compressor', unit: '₹/unit' }, { item: 'Tools & Hydraulic Lift', unit: '₹/set' }] },
};

const PACKAGING = [{ item: 'Printed Pouches / Cartons', unit: '₹/1000' }, { item: 'Labels & Stickers', unit: '₹/roll' }];
const VENDOR_SURNAMES = ['Traders', 'Enterprises', 'Agencies', 'Suppliers', 'Distributors', 'Udyog', 'Bhandar', 'Stores'];
const VENDOR_FIRST = ['Sri Balaji', 'Maa Durga', 'New Bharat', 'Gopal', 'Krishna', 'Shakti', 'Annapurna', 'Jai Kisan', 'Ganesh', 'Laxmi'];

function getSupply(cat) {
  return CATEGORY_SUPPLY[cat] || { raw: [{ item: 'Primary Raw Material', unit: '₹/kg' }, { item: 'Secondary Inputs', unit: '₹/unit' }, { item: 'Consumables', unit: '₹/pack' }], machinery: [{ item: 'Core Equipment', unit: '₹/unit' }, { item: 'Support Tools', unit: '₹/set' }] };
}

const BUSINESS_CATEGORIES = Object.keys(CATEGORY_PROFILE);

module.exports = {
  CATEGORY_PROFILE,
  EXPANSION_TYPES,
  getProfile,
  STATE_PPP,
  CATEGORY_SUPPLY,
  getSupply,
  PACKAGING,
  VENDOR_SURNAMES,
  VENDOR_FIRST,
  BUSINESS_CATEGORIES,
};
