/**
 * NIC 5-digit code mappings for each Grameen Udyog business category.
 *
 * The MSME Udyam API does not support server-side Activity/NIC filtering.
 * We fetch all enterprises in a district and match Activities in-process.
 *
 * Each category entry has:
 *   nicCodes  – array of exact NIC 5-digit IDs (string) to match
 *   keywords  – fallback lowercase keywords matched against Activity Description
 */
const NIC_MAPPING = {
  'Dairy & Milk Products': {
    nicCodes: ['01410', '01421', '01499', '10501', '10502', '10503', '10504', '10505', '10509', '47214'],
    keywords: ['dairy', 'milk', 'curd', 'paneer', 'ghee', 'cream', 'butter', 'cheese', 'cattle'],
  },
  'Poultry Farming': {
    nicCodes: ['01461', '01462', '01463', '01464', '01469', '01470', '10121', '10122', '47221'],
    keywords: ['poultry', 'chicken', 'broiler', 'egg', 'layer', 'hatchery', 'fowl'],
  },
  'Goat & Sheep Farming': {
    nicCodes: ['01422', '01423', '01429', '10111', '10112', '10113', '10119'],
    keywords: ['goat', 'sheep', 'mutton', 'wool', 'livestock', 'animal husbandry'],
  },
  'Retail Kirana Store': {
    nicCodes: ['47110', '47191', '47199', '47211', '47212', '47213', '47220', '47230', '47240', '47290', '47300'],
    keywords: ['kirana', 'grocery', 'retail', 'general store', 'provision', 'supermarket', 'convenience'],
  },
  'Textiles & Handloom': {
    nicCodes: ['13111', '13112', '13113', '13114', '13191', '13192', '13193', '13194', '13199', '13910', '13920', '13930', '13990', '14101', '14102', '14109'],
    keywords: ['textile', 'handloom', 'weaving', 'yarn', 'fabric', 'cloth', 'cotton', 'silk', 'khadi', 'loom'],
  },
  'Tailoring & Boutique': {
    nicCodes: ['14101', '14102', '14109', '14111', '14112', '14119', '14120', '14130', '96012', '96019'],
    keywords: ['tailor', 'boutique', 'garment', 'stitching', 'dressmaking', 'apparel', 'clothing'],
  },
  'Beauty Parlour': {
    nicCodes: ['96011', '96012', '96019'],
    keywords: ['beauty', 'parlour', 'salon', 'hair', 'cosmetic', 'grooming', 'spa', 'facial', 'makeup'],
  },
  'Mobile Repair & Recharge Shop': {
    nicCodes: ['95110', '47430', '47690'],
    keywords: ['mobile', 'phone', 'repair', 'recharge', 'telecom', 'electronics repair', 'smartphone'],
  },
  'Auto/E-Rickshaw Service': {
    nicCodes: ['49310', '49320', '49390', '45201', '45202', '45209'],
    keywords: ['auto', 'rickshaw', 'e-rickshaw', 'taxi', 'transport', 'passenger', 'vehicle hire'],
  },
  'Bakery & Confectionery': {
    nicCodes: ['10711', '10712', '10719', '10720', '10731', '10739', '10740', '10750', '10790', '47241', '47242', '47249'],
    keywords: ['bakery', 'bread', 'biscuit', 'cake', 'confectionery', 'pastry', 'rusk', 'sweet'],
  },
  'Tea Stall / Snacks': {
    nicCodes: ['56101', '56102', '56103', '56210', '56290', '56301', '56302', '56303'],
    keywords: ['tea', 'chai', 'snack', 'tiffin', 'hotel', 'dhaba', 'restaurant', 'canteen', 'food stall', 'refreshment'],
  },
  'Vegetable & Fruit Vending': {
    nicCodes: ['47215', '47216', '47217', '47218', '47219', '01110', '01120', '01131', '01132', '01139'],
    keywords: ['vegetable', 'fruit', 'sabzi', 'vending', 'market', 'greengrocer', 'fresh produce'],
  },
  'Agri-Inputs (Seeds, Fertilizer)': {
    nicCodes: ['46210', '46610', '47591', '77310', '01611', '01612', '01619'],
    keywords: ['seed', 'fertilizer', 'pesticide', 'agri', 'agricultural input', 'krishi', 'nursery'],
  },
  'Fisheries': {
    nicCodes: ['03111', '03112', '03113', '03119', '03121', '03122', '03210', '03220', '10201', '10202', '10209', '47221'],
    keywords: ['fish', 'fisheries', 'aquaculture', 'prawn', 'seafood', 'fishing'],
  },
  'Handicrafts': {
    nicCodes: ['32111', '32112', '32191', '32192', '32193', '32199', '23910', '23920', '16291', '16292', '16299'],
    keywords: ['handicraft', 'handmade', 'craft', 'artisan', 'pottery', 'bamboo', 'wood carving', 'terracotta', 'embroidery'],
  },
  'Beekeeping': {
    nicCodes: ['01490', '10891', '10892', '10899'],
    keywords: ['bee', 'honey', 'apiary', 'beekeeping', 'wax'],
  },
  'Flour Mill': {
    nicCodes: ['10611', '10612', '10613', '10614', '10619', '10620'],
    keywords: ['flour', 'mill', 'chakki', 'atta', 'grinding', 'grain processing', 'rice mill'],
  },
  'Papad / Pickle Making': {
    nicCodes: ['10310', '10390', '10794', '10795', '10799'],
    keywords: ['papad', 'pickle', 'achar', 'condiment', 'spice', 'food processing', 'masala'],
  },
  'Photocopy & CSC Centre': {
    nicCodes: ['82190', '62090', '63990', '91020', '47691'],
    keywords: ['photocopy', 'xerox', 'csc', 'common service', 'printing', 'stationery', 'cyber'],
  },
  'Two-Wheeler Repair': {
    nicCodes: ['45401', '45402', '45403', '95120'],
    keywords: ['two-wheeler', 'bike', 'motorcycle', 'scooter', 'bicycle', 'puncture', 'mechanic', 'auto repair'],
  },
};

/**
 * Returns true if the enterprise's Activities array matches the given category.
 * @param {Array} activities - Parsed activities array from MSME record
 * @param {string} category  - Business category name
 */
function matchesCategory(activities, category) {
  const mapping = NIC_MAPPING[category];
  if (!mapping || !Array.isArray(activities) || activities.length === 0) return false;

  const { nicCodes, keywords } = mapping;
  const nicSet = new Set(nicCodes);
  const nic4Set = new Set(nicCodes.map((c) => c.slice(0, 4)));

  for (const act of activities) {
    const nic = String(act.NIC5DigitId || '').trim();
    // Check exact NIC code match
    if (nicSet.has(nic)) return true;
    // Check 4-digit class match (standard NIC 4-digit sub-class)
    if (nic.length >= 4 && nic4Set.has(nic.slice(0, 4))) return true;
    // Whole-word keyword match in description
    const desc = (act.Description || '').toLowerCase();
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw.toLowerCase()}\\b`, 'i');
      if (regex.test(desc)) return true;
    }
  }
  return false;
}

module.exports = { NIC_MAPPING, matchesCategory };
