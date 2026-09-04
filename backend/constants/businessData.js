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

const CATEGORY_MARKET_INTELLIGENCE = {
  'Dairy & Milk Products': {
    pricingMatrix: [
      { item: 'Fresh Vacuum-Packed Paneer', unit: '1 kg', cost: 240, price: 380, marginPct: 36.8, competitorPrice: 390, demand: 'High' },
      { item: 'Traditional Desi Ghee (Bilona)', unit: '1 Litre', cost: 560, price: 920, marginPct: 39.1, competitorPrice: 880, demand: 'Very High' },
      { item: 'Spiced Buttermilk (Chaas) Pouches', unit: '200 ml', cost: 6, price: 15, marginPct: 60.0, competitorPrice: 15, demand: 'High (Summer spike)' },
      { item: 'Pasteurized Standard Milk (Fat 4.5%)', unit: '1 Litre', cost: 48, price: 64, marginPct: 25.0, competitorPrice: 62, demand: 'Continuous' },
    ],
    valueAddNiches: [
      {
        title: 'By-Product Processing (Paneer, Ghee & Curd)',
        rawMargin: '12% – 16%',
        valueAddedMargin: '35% – 45%',
        marginJump: '+25%',
        description: 'Convert surplus raw milk into value-added dairy products with 5x longer shelf life and double the profitability.',
        techniques: 'Mini cream-separator, paneer press, and food-grade heat-sealed pouch packaging.',
      },
      {
        title: 'Institutional & Sweet Shop (Halwai) Bulk Supply',
        rawMargin: '10% – 14%',
        valueAddedMargin: '28% – 34%',
        marginJump: '+18%',
        description: 'B2B contracts with local sweet-makers and canteens for daily morning bulk deliveries at premium bulk rates.',
        techniques: 'Fat/SNF purity testing certification provided to commercial buyers.',
      },
    ],
    untappedSegments: ['Local Sweet Shops & Caterers', 'Highway Dhabas & Canteens', 'Residential Morning Milk Subscriptions', 'Weekly Haat Dairy Stalls'],
    proposedEnterprise: {
      modelName: 'Value-Added Dairy Processing & Cold-Chock Hub',
      modelName_hi: 'मूल्य-संवर्धित दुग्ध प्रसंस्करण एवं चिलिंग हब',
      tagline: 'Processed Paneer, Ghee & Milk Hub bypassing raw-milk saturation',
      saturationRationale: 'Standard raw-milk vendors in this radius face evening spoilage and price undercut. The proposed model adds mini-chilling and paneer/ghee processing, lifting margins to 38%+ and securing steady institutional demand.',
      keyDifferentiators: [
        'Zero milk wastage via daily evening conversion into high-margin Ghee & Khoa',
        'Transparent Fat & SNF digital testing creating premium customer trust',
        'Direct supply contracts with 5+ local confectioners and wedding caterers',
      ],
    },
  },
  'Poultry Farming': {
    pricingMatrix: [
      { item: 'Farm-Fresh Brown / Desi Eggs', unit: '1 Crate (30 pcs)', cost: 130, price: 210, marginPct: 38.1, competitorPrice: 220, demand: 'Very High' },
      { item: 'Dressed Country Chicken (Clean Cut)', unit: '1 kg', cost: 140, price: 240, marginPct: 41.7, competitorPrice: 250, demand: 'High' },
      { item: 'Commercial Broiler Live Bird', unit: '1 kg', cost: 92, price: 125, marginPct: 26.4, competitorPrice: 120, demand: 'Steady' },
      { item: 'Organic Poultry Manure (Compost)', unit: '50 kg bag', cost: 60, price: 180, marginPct: 66.7, competitorPrice: 170, demand: 'Seasonal Spike' },
    ],
    valueAddNiches: [
      {
        title: 'Free-Range Desi / Kadaknath Specialty Poultry',
        rawMargin: '14% – 18%',
        valueAddedMargin: '40% – 50%',
        marginJump: '+30%',
        description: 'Rearing premium indigenous birds fetching 2x price per kg compared to standard commercial broilers.',
        techniques: 'Open grazing yard, organic grain feed, and branded leg-band traceability.',
      },
      {
        title: 'Hygienic Clean-Pack Dressed Meat Supply',
        rawMargin: '12% – 15%',
        valueAddedMargin: '30% – 38%',
        marginJump: '+20%',
        description: 'Supply vacuum-packed, chilled dressed meat directly to restaurants and household orders.',
        techniques: 'Defeathering machine, stainless steel butchering bench, cold-box delivery.',
      },
    ],
    untappedSegments: ['Roadside Dhabas & Non-Veg Restaurants', 'Gyms & Protein-Conscious Consumers', 'Weekly Haat Traders', 'Organic Farm-to-Table Buyers'],
    proposedEnterprise: {
      modelName: 'Integrated Free-Range Poultry & Clean-Meat Hub',
      modelName_hi: 'एकीकृत फ्री-रेंज पोल्ट्री एवं स्वच्छ मीट वितरण केंद्र',
      tagline: 'High-margin indigenous bird rearing and hygienic packaging',
      saturationRationale: 'Local commercial broiler supply is commoditised and vulnerable to feed price fluctuations. The proposed model pivots to high-margin Desi/Kadaknath birds and packaged dressed poultry with 40%+ gross margins.',
      keyDifferentiators: [
        'Premium brown eggs and country chicken commanding 50% price premium',
        'Secondary revenue stream from high-nitrogen organic manure for local farmers',
        'Direct pre-order booking via WhatsApp for weekly Sunday deliveries',
      ],
    },
  },
  'Retail Kirana Store': {
    pricingMatrix: [
      { item: 'Self-Branded Cleaned Pulses (Dal)', unit: '1 kg pack', cost: 105, price: 140, marginPct: 25.0, competitorPrice: 145, demand: 'Daily Essential' },
      { item: 'Loose Mustard / Refined Oil (Cold Packed)', unit: '1 Litre pouch', cost: 118, price: 152, marginPct: 22.4, competitorPrice: 155, demand: 'Continuous' },
      { item: 'Fast Moving Spices & Condiments', unit: '100g pack', cost: 22, price: 35, marginPct: 37.1, competitorPrice: 38, demand: 'High' },
      { item: 'Branded FMCG & Soaps / Detergents', unit: 'Per unit', cost: 42, price: 48, marginPct: 12.5, competitorPrice: 48, demand: 'Very High' },
    ],
    valueAddNiches: [
      {
        title: 'Cleaned, Graded & Self-Branded Grain Packets',
        rawMargin: '8% – 12%',
        valueAddedMargin: '22% – 28%',
        marginJump: '+15%',
        description: 'Buy grains in bulk, machine-clean, grade and pack under your village store brand.',
        techniques: 'Manual vibratory cleaner, hand heat-sealer, transparent food-grade poly bags.',
      },
      {
        title: 'Monthly Ration Hamper & Doorstep Subscription',
        rawMargin: '10%',
        valueAddedMargin: '20% – 25%',
        marginJump: '+12%',
        description: 'Pre-assembled monthly kitchen ration kits delivered directly to households with flexible digital payments.',
        techniques: 'WhatsApp order book, consolidated buying discount from city mandi distributors.',
      },
    ],
    untappedSegments: ['Local Village Teachers & Govt Staff Households', 'Small Tea & Snack Stalls (Bulk Grains)', 'Hostels & Ashrams', 'Busy Farm Families'],
    proposedEnterprise: {
      modelName: 'Modern Agri-Retail & Smart Ration Delivery Hub',
      modelName_hi: 'आधुनिक किराना एवं मासिक राशन डिलीवरी केंद्र',
      tagline: 'Packaged essentials & doorstep monthly subscription model',
      saturationRationale: 'Dense presence of traditional small kirana stores creates credit-trap risks. The proposed enterprise introduces transparent self-packaged grains, digital UPI billings, and doorstep monthly grocery baskets.',
      keyDifferentiators: [
        'Pre-packed graded staple grains yielding 25% margin vs 10% on branded FMCG',
        'Zero-credit model backed by monthly subscription discounts',
        'Direct mandi sourcing cutting out two middle layers of brokerage',
      ],
    },
  },
  'Tailoring & Boutique': {
    pricingMatrix: [
      { item: 'Custom Designer Blouse (Padded / Embroidery)', unit: '1 Piece', cost: 180, price: 550, marginPct: 67.3, competitorPrice: 500, demand: 'Very High' },
      { item: 'School & Institutional Uniform Set', unit: '1 Set (Shirt+Pant)', cost: 220, price: 420, marginPct: 47.6, competitorPrice: 450, demand: 'Seasonal Bulk' },
      { item: 'Daily Wear Salwar Suit Stitching', unit: '1 Suit', cost: 90, price: 250, marginPct: 64.0, competitorPrice: 220, demand: 'Continuous' },
      { item: 'Alteration & Fitting Services', unit: 'Per Garment', cost: 15, price: 60, marginPct: 75.0, competitorPrice: 50, demand: 'Daily' },
    ],
    valueAddNiches: [
      {
        title: 'Festive Designer Boutique & Bridal Work',
        rawMargin: '30%',
        valueAddedMargin: '60% – 70%',
        marginJump: '+35%',
        description: 'Specialised bridal embroidery, latkan attachments, and designer cuts for weddings and festivals.',
        techniques: 'Zig-zag pico machine, designer pattern books, sample display rack.',
      },
      {
        title: 'Institutional School & College Uniform Contracting',
        rawMargin: '25%',
        valueAddedMargin: '45% – 52%',
        marginJump: '+22%',
        description: 'Tie-up with local private schools and coaching institutes for seasonal bulk uniform batches.',
        techniques: 'Industrial heavy-duty motor, bulk fabric roll procurement at wholesale Surat/Delhi rates.',
      },
    ],
    untappedSegments: ['Local Private Schools & Colleges', 'Bridal & Festive Event Customers', 'Working Women & Teachers', 'Dance & Cultural Troupe Outfits'],
    proposedEnterprise: {
      modelName: 'Boutique Studio & Institutional Garment Production',
      modelName_hi: 'बुटीक स्टूडियो एवं इंस्टीट्यूशनल गारमेंट निर्माण इकाई',
      tagline: 'High-value designer customisation and school uniform contracting',
      saturationRationale: 'Simple manual tailoring is crowded with unorganised home tailors. The proposed enterprise establishes an electrified semi-industrial unit targeting high-margin bridal wear and bulk school uniforms.',
      keyDifferentiators: [
        'Interlock and motorised stitching for 3x speed and flawless finish',
        'Exclusive fabric catalogues allowing clients to choose fabric and stitching under one roof',
        'Seasonal bulk orders from 2+ local schools assuring predictable cashflow',
      ],
    },
  },
  'Bakery & Confectionery': {
    pricingMatrix: [
      { item: 'Fresh Cream Birthday Cake', unit: '0.5 kg', cost: 110, price: 280, marginPct: 60.7, competitorPrice: 300, demand: 'Very High' },
      { item: 'Tea Rusk (Toast) Packs', unit: '400g pack', cost: 22, price: 45, marginPct: 51.1, competitorPrice: 45, demand: 'Daily Continuous' },
      { item: 'Vegetable / Paneer Patties', unit: '1 Piece', cost: 8, price: 20, marginPct: 60.0, competitorPrice: 20, demand: 'High' },
      { item: 'Specialty Atta & Jaggery Biscuits', unit: '250g box', cost: 28, price: 65, marginPct: 56.9, competitorPrice: 70, demand: 'Growing' },
    ],
    valueAddNiches: [
      {
        title: 'Custom Celebration Cakes & Photo Printing',
        rawMargin: '35%',
        valueAddedMargin: '60% – 68%',
        marginJump: '+30%',
        description: 'Custom anniversary and birthday cakes delivered fresh, which rural customers currently travel 15 km to town to buy.',
        techniques: 'Rotary oven, cold display display counter, whipped cream dispenser.',
      },
      {
        title: 'Healthy Jaggery / Millet Cookies for Tea Stalls',
        rawMargin: '25%',
        valueAddedMargin: '50% – 55%',
        marginJump: '+25%',
        description: 'Produce healthy tea rusk and millet biscuits distributed in bulk to 30+ roadside tea kiosks.',
        techniques: 'Bulk flour & butter mixing, moisture-proof branded pouch sealing.',
      },
    ],
    untappedSegments: ['Village Youth & Birthday Celebrations', '30+ Local Tea Kiosks for Daily Rusks', 'School Canteens', 'Festive Gift Baskets'],
    proposedEnterprise: {
      modelName: 'Artisan Micro-Bakery & Tea-Kiosk Distribution Hub',
      modelName_hi: 'कारीगर माइक्रो-बेकरी एवं टी-स्टॉल आपूर्ति केंद्र',
      tagline: 'Fresh oven celebration cakes and wholesale rusk supply',
      saturationRationale: 'Pre-packaged industrial biscuits dominate local shops but lack fresh taste and customized celebration cakes. This unit captures the untapped celebration market and supplies daily fresh toast to tea stalls.',
      keyDifferentiators: [
        'Local fresh delivery of birthday cakes saving customers town travel costs',
        'B2B wholesale supply of rusks directly to 25+ surrounding tea shops',
        'Healthy millet and whole wheat options catering to health-conscious rural consumers',
      ],
    },
  },
  'Flour Mill': {
    pricingMatrix: [
      { item: 'Fresh Stone-Ground Wheat Atta (Cleaned)', unit: '1 kg', cost: 26, price: 38, marginPct: 31.6, competitorPrice: 40, demand: 'Continuous' },
      { item: 'Multigrain Diabetic Atta (Chana, Jowar, Bajra)', unit: '1 kg', cost: 42, price: 75, marginPct: 44.0, competitorPrice: 85, demand: 'High' },
      { item: 'Pure Besan (Gram Flour)', unit: '1 kg', cost: 65, price: 105, marginPct: 38.1, competitorPrice: 110, demand: 'High' },
      { item: 'Custom Grain Grinding Service', unit: '1 kg grinding', cost: 2.5, price: 7, marginPct: 64.3, competitorPrice: 6, demand: 'Daily' },
    ],
    valueAddNiches: [
      {
        title: 'Packaged Multigrain & Specialty Atta',
        rawMargin: '15%',
        valueAddedMargin: '40% – 48%',
        marginJump: '+28%',
        description: 'Blend wheat with millets (Jowar, Bajra, Ragi) and pulses to package branded multigrain flour.',
        techniques: 'Multi-deck siever, pulveriser with temperature-controlled low-speed grinding to preserve nutrition.',
      },
      {
        title: 'Bulk Spice & Besan Milling for Caterers',
        rawMargin: '20%',
        valueAddedMargin: '42% – 50%',
        marginJump: '+25%',
        description: 'Dedicated processing chamber for grinding spices and gram flour for local restaurants and sweet-makers.',
        techniques: 'Stainless steel hammer mill preventing cross-contamination.',
      },
    ],
    untappedSegments: ['Health-Conscious Households (Multigrain)', 'Sweet Shops & Namkeen Manufacturers', 'Dhabas & Canteens', 'Weekly Haat Flour Stalls'],
    proposedEnterprise: {
      modelName: 'Modern Cold-Milling & Multigrain Flour Enterprise',
      modelName_hi: 'आधुनिक कोल्ड-मिलिंग एवं मल्टीग्रेन आटा उद्यम',
      tagline: 'Nutritious low-heat stone grinding and packaged specialty flours',
      saturationRationale: 'Old single-speed chakkis burn flour nutrients and cause long queues. The proposed enterprise uses modern pulverizers to produce cleaned, stone-ground packaged flour and multigrain health mixes.',
      keyDifferentiators: [
        'Low-heat grinding retaining natural bran and germ nutrition',
        'Zero-wait packaged delivery for busy working households',
        'High-margin specialty flours (Besan, Sattu, Multigrain) yielding 40%+ margins',
      ],
    },
  },
  'Two-Wheeler Repair': {
    pricingMatrix: [
      { item: 'Comprehensive General Service & Oil Change', unit: 'Per Bike', cost: 220, price: 550, marginPct: 60.0, competitorPrice: 500, demand: 'Daily' },
      { item: 'Engine Decarbonizing & Tuning', unit: 'Per Service', cost: 120, price: 400, marginPct: 70.0, competitorPrice: 380, demand: 'High' },
      { item: 'Tyre Replacement & Puncture Vulcanising', unit: 'Per Job', cost: 60, price: 180, marginPct: 66.7, competitorPrice: 160, demand: 'Continuous' },
      { item: 'Electrical & Digital Meter Diagnosis', unit: 'Per Job', cost: 40, price: 160, marginPct: 75.0, competitorPrice: 150, demand: 'Steady' },
    ],
    valueAddNiches: [
      {
        title: 'EV (Electric Scooter) Diagnostic & Battery Care',
        rawMargin: '30%',
        valueAddedMargin: '65% – 75%',
        marginJump: '+40%',
        description: 'Equip workshop to diagnose electric two-wheelers, which traditional mechanics cannot service.',
        techniques: 'Multimeter tester, cell balancer, basic electronics diagnostic scanner.',
      },
      {
        title: 'Annual Maintenance Contract (AMC) for Rural Commuters',
        rawMargin: '25%',
        valueAddedMargin: '55% – 60%',
        marginJump: '+32%',
        description: 'Provide 4 quarterly services + emergency breakdown assistance on call for fixed annual fee.',
        techniques: 'Mobile breakdown kit, roadside assistance on mobile call.',
      },
    ],
    untappedSegments: ['Rural Commuters & Gig Delivery Workers', 'Electric 2-Wheeler Owners', 'Farmers with Motorised Sprayers', 'Local Courier Vans'],
    proposedEnterprise: {
      modelName: 'Multi-Brand & EV-Ready Two-Wheeler Care Centre',
      modelName_hi: 'मल्टी-ब्रांड एवं ईवी-सक्षम टू-व्हीलर सर्विस सेंटर',
      tagline: 'Hydraulic lift, genuine spare parts and EV diagnostic capability',
      saturationRationale: 'Local mechanics use roadside manual tools and lack diagnostic equipment for modern FI engines and electric scooters. This proposed facility bridges that technological gap with rapid turnaround.',
      keyDifferentiators: [
        'Hydraulic ramp cut servicing time by 50%, handling 8+ bikes daily',
        'Capability to service both petrol bikes and emerging electric scooters',
        'Stock of certified genuine lubricants and fast-moving spare parts',
      ],
    },
  },
  'Beauty Parlour': {
    pricingMatrix: [
      { item: 'Bridal Make-up & Hair Styling Package', unit: 'Per Event', cost: 1200, price: 4500, marginPct: 73.3, competitorPrice: 4200, demand: 'Wedding Season' },
      { item: 'Herbal Facial & Skin Rejuvenation', unit: 'Per Session', cost: 180, price: 650, marginPct: 72.3, competitorPrice: 600, demand: 'High' },
      { item: 'Hair Treatment / Smoothing / Spa', unit: 'Per Treatment', cost: 250, price: 900, marginPct: 72.2, competitorPrice: 850, demand: 'Steady' },
      { item: 'Threading, Waxing & Basic Grooming', unit: 'Per Service', cost: 30, price: 150, marginPct: 80.0, competitorPrice: 130, demand: 'Daily' },
    ],
    valueAddNiches: [
      {
        title: 'Complete Bridal & Pre-Wedding Grooming Suites',
        rawMargin: '40%',
        valueAddedMargin: '70% – 80%',
        marginJump: '+35%',
        description: 'High-end package covering mehendi, hairstyling, saree draping and waterproof HD makeup.',
        techniques: 'Airbrush makeup kit, imported skin steamers, hygienic disposable kits.',
      },
      {
        title: 'Ayurvedic & Organic Herbal Hair Care Solutions',
        rawMargin: '30%',
        valueAddedMargin: '65% – 72%',
        marginJump: '+38%',
        description: 'Natural henna, amla-shikakai treatments attracting women wary of harsh chemical bleaching.',
        techniques: 'Chemical-free natural formulations sourced locally.',
      },
    ],
    untappedSegments: ['Bridal Parties & Wedding Families', 'College Students & Working Women', 'Festival Celebration Makeovers', 'Doorstep Home-Service Visits'],
    proposedEnterprise: {
      modelName: 'Modern Wellness Lounge & Bridal Makeover Studio',
      modelName_hi: 'आधुनिक वेलनेस लाउंज एवं ब्राइडल मेकओवर स्टूडियो',
      tagline: 'Private, hygienic beauty care and premium bridal packages',
      saturationRationale: 'Most village beauty parlours are cramped home rooms with limited privacy and generic products. The proposed enterprise offers a dedicated air-conditioned studio with sanitized equipment and bridal packages.',
      keyDifferentiators: [
        'Exclusive bridal cabin offering complete privacy and professional lighting',
        'Use of certified branded cosmetics ensuring skin safety and zero irritation',
        'Seasonal bridal packages generating over ₹60,000 net in peak wedding months',
      ],
    },
  },
  'Papad / Pickle Making': {
    pricingMatrix: [
      { item: 'Traditional Mango / Lemon Pickle in Mustard Oil', unit: '1 kg jar', cost: 85, price: 190, marginPct: 55.3, competitorPrice: 180, demand: 'Continuous' },
      { item: 'Handmade Moong Dal Special Papad', unit: '1 kg pack', cost: 95, price: 210, marginPct: 54.8, competitorPrice: 200, demand: 'Very High' },
      { item: 'Garlic & Chilli Chutney / Pickle', unit: '500g jar', cost: 45, price: 110, marginPct: 59.1, competitorPrice: 105, demand: 'High' },
      { item: 'Crispy Sabudana / Rice Fryums', unit: '500g pouch', cost: 35, price: 80, marginPct: 56.3, competitorPrice: 75, demand: 'Festive' },
    ],
    valueAddNiches: [
      {
        title: 'Preservative-Free Farm-Fresh Recipe in Glass Jars',
        rawMargin: '25%',
        valueAddedMargin: '55% – 62%',
        marginJump: '+32%',
        description: 'Packaging authentic granny-style pickles in sterile glass jars commanding premium pricing in semi-urban markets.',
        techniques: 'Sun-drying racks, cold-pressed mustard oil, tamper-evident heat-shrink neck seals.',
      },
      {
        title: 'Bulk Supply to Dhabas & Catering Contractors',
        rawMargin: '20%',
        valueAddedMargin: '42% – 48%',
        marginJump: '+24%',
        description: 'Supplying 5kg and 10kg buckets of everyday mixed pickles and papads directly to highway dhabas.',
        techniques: 'Food-grade commercial buckets, standardized brine recipes.',
      },
    ],
    untappedSegments: ['Highway Dhabas & Small Hotels', 'Town Organic Food Stores & Exhibitions', 'Household Monthly Pickles', 'Gifting Hampers during Diwali'],
    proposedEnterprise: {
      modelName: 'Traditional Food Processing & Branded Pickles Hub',
      modelName_hi: 'पारंपरिक खाद्य प्रसंस्करण एवं ब्रांडेड अचार-पापड़ निर्माण',
      tagline: 'Hygienic small-batch artisan pickles with FSSAI certification',
      saturationRationale: 'Unorganised unbranded sellers face hygiene doubts and poor shelf life. This enterprise provides FSSAI-licensed, attractively bottled pickles and papads with up to 12 months shelf stability.',
      keyDifferentiators: [
        'FSSAI certification and nutritional labeling unlocking retail supermarket access',
        'Seasonal bulk buying of raw mangoes directly at farm-gate for 40% cost saving',
        'High-margin glass bottle packaging selling at 55%+ gross margin',
      ],
    },
  },
  'Agri-Inputs (Seeds, Fertilizer)': {
    pricingMatrix: [
      { item: 'Hybrid High-Yield Certified Seeds', unit: '1 kg pack', cost: 180, price: 240, marginPct: 25.0, competitorPrice: 245, demand: 'Sowing Season' },
      { item: 'Organic Bio-Fertilizer (Vermicompost / Potash)', unit: '50 kg bag', cost: 280, price: 420, marginPct: 33.3, competitorPrice: 400, demand: 'High' },
      { item: 'Crop Protection Bio-Pesticide', unit: '1 Litre bottle', cost: 320, price: 460, marginPct: 30.4, competitorPrice: 480, demand: 'Crop Cycle' },
      { item: 'Micro-Nutrient & Plant Growth Spray', unit: '500 ml', cost: 140, price: 220, marginPct: 36.4, competitorPrice: 230, demand: 'Continuous' },
    ],
    valueAddNiches: [
      {
        title: 'Integrated Soil-Testing & Custom Nutrition Advisory',
        rawMargin: '12% – 16%',
        valueAddedMargin: '30% – 38%',
        marginJump: '+18%',
        description: 'Offer rapid digital soil testing kits and recommend exact dosage, building unbreakable farmer loyalty.',
        techniques: 'Portable digital soil health test kit, WhatsApp crop calendar.',
      },
      {
        title: 'Bio-Organic Agri-Inputs & Spray Equipment Rental',
        rawMargin: '15%',
        valueAddedMargin: '35% – 42%',
        marginJump: '+22%',
        description: 'Rent battery-operated boom sprayers while selling bio-fertilizers and organic pest deterrents.',
        techniques: 'Rental fleet of 4 battery sprayers, wholesale dealership direct from bio-agri manufacturers.',
      },
    ],
    untappedSegments: ['Commercial Vegetable & Cash-Crop Farmers', 'FPO / SHG Member Clusters', 'Orchard & Horticulture Owners', 'Kitchen Garden Enthusiasts'],
    proposedEnterprise: {
      modelName: 'Smart Krishi Seva Kendra & Soil Care Centre',
      modelName_hi: 'स्मार्ट कृषि सेवा केंद्र एवं मृदा परामर्श केंद्र',
      tagline: 'Scientific advisory-driven certified seeds and bio-inputs',
      saturationRationale: 'Standard dealers simply sell expensive chemicals on credit with high default risk. The proposed enterprise combines certified inputs with soil-testing advisory and equipment rental for sticky farmer partnerships.',
      keyDifferentiators: [
        'Soil-testing based prescription creating 3x higher trust than generic chemical pushers',
        'Focus on high-margin bio-fertilizers and micronutrients yielding 30%+ margins',
        'Equipment rental cashflow stabilizing income during non-sowing months',
      ],
    },
  },
};

function getMarketIntelligence(cat) {
  if (CATEGORY_MARKET_INTELLIGENCE[cat]) {
    return CATEGORY_MARKET_INTELLIGENCE[cat];
  }

  // Dynamic intelligent fallback for any custom/unlisted category
  return {
    pricingMatrix: [
      { item: `Core ${cat} Standard Product`, unit: 'Per unit', cost: 120, price: 180, marginPct: 33.3, competitorPrice: 185, demand: 'High' },
      { item: `Premium Value-Added ${cat} Variant`, unit: 'Per pack', cost: 210, price: 340, marginPct: 38.2, competitorPrice: 350, demand: 'Growing' },
      { item: `Bulk / Wholesale Supply Pack`, unit: 'Per batch', cost: 450, price: 650, marginPct: 30.8, competitorPrice: 670, demand: 'Steady' },
      { item: `Custom Service / Express Delivery`, unit: 'Per job', cost: 50, price: 120, marginPct: 58.3, competitorPrice: 110, demand: 'Continuous' },
    ],
    valueAddNiches: [
      {
        title: `Specialised Value-Addition & Branding for ${cat}`,
        rawMargin: '15% – 18%',
        valueAddedMargin: '35% – 45%',
        marginJump: '+22%',
        description: `Upgrading standard ${cat} offerings with hygienic packaging, brand identity, and customized client specifications.`,
        techniques: 'Precision processing tools, food/commercial grade packaging, digital cataloguing.',
      },
      {
        title: 'B2B Institutional & Doorstep Supply',
        rawMargin: '12%',
        valueAddedMargin: '28% – 35%',
        marginJump: '+18%',
        description: 'Establishing regular delivery contracts with local business establishments and households.',
        techniques: 'Pre-order booking, digital invoicing, quality grading certification.',
      },
    ],
    untappedSegments: ['Nearby Town Commercial Establishments', 'Weekly Rural Haats', 'Direct Household Subscribers', 'Local Institutions & Canteens'],
    proposedEnterprise: {
      modelName: `Specialized Value-Added ${cat} Enterprise`,
      modelName_hi: `विशिष्ट मूल्य-संवर्धित ${cat} उद्यम`,
      tagline: `Differentiated high-margin niche model bypassing local market saturation`,
      saturationRationale: `Standard generic units in this locality face high competitor density and price pressure. The proposed enterprise focuses on specialized high-margin value addition and direct distribution channels to guarantee loan safety and profitability.`,
      keyDifferentiators: [
        'Differentiated value-added product lines delivering 35%+ gross margins',
        'Direct relationship with key buyers cutting out middleman margin loss',
        'Modern processing tools reducing turnaround time and operational cost',
      ],
    },
  };
}

function getSupply(cat) {
  return CATEGORY_SUPPLY[cat] || { raw: [{ item: 'Primary Raw Material', unit: '₹/kg' }, { item: 'Secondary Inputs', unit: '₹/unit' }, { item: 'Consumables', unit: '₹/pack' }], machinery: [{ item: 'Core Equipment', unit: '₹/unit' }, { item: 'Support Tools', unit: '₹/set' }] };
}

const BUSINESS_CATEGORIES = Object.keys(CATEGORY_PROFILE);

const PACKAGING = [{ item: 'Printed Pouches / Cartons', unit: '₹/1000' }, { item: 'Labels & Stickers', unit: '₹/roll' }];
const VENDOR_SURNAMES = ['Traders', 'Enterprises', 'Agencies', 'Suppliers', 'Distributors', 'Udyog', 'Bhandar', 'Stores'];
const VENDOR_FIRST = ['Sri Balaji', 'Maa Durga', 'New Bharat', 'Gopal', 'Krishna', 'Shakti', 'Annapurna', 'Jai Kisan', 'Ganesh', 'Laxmi'];

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
  CATEGORY_MARKET_INTELLIGENCE,
  getMarketIntelligence,
};

