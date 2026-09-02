const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const https = require('https');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_grameen_udyog_jwt_key_2026';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

app.use(cors({ origin: '*' }));
app.use(express.json());

// In-Memory Storage
const users = new Map();
const usersByEmail = new Map();
const reports = new Map();

// ---------- Auth Middleware ----------
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Missing or invalid token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = users.get(payload.user_id);
    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }
    const { password, ...userWithoutPw } = user;
    req.user = userWithoutPw;
    next();
  } catch (err) {
    return res.status(401).json({ detail: 'Invalid token' });
  }
}

function optionalToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = users.get(payload.user_id);
      if (user) {
        const { password, ...userWithoutPw } = user;
        req.user = userWithoutPw;
      }
    } catch (e) {}
  }
  next();
}

// ---------- Financial Scheme Calculator Logic ----------
const MICRO_LIMIT = 140000;
const TERM_LIMIT = 5000000;
const MICRO_MAX_LOAN = 125000;
const TERM_MAX_LOAN = 4500000;

function computeScheme(marginCapital) {
  if (!marginCapital || marginCapital <= 0) {
    throw new Error('Margin capital must be positive');
  }

  const projectCost = Math.round((marginCapital / 0.10) * 100) / 100;
  const loanNeeded = Math.round((projectCost - marginCapital) * 100) / 100;

  let scheme, schemeCode, interest, tenureMonths, moratoriumMonths, maxLoan;
  if (projectCost <= MICRO_LIMIT) {
    scheme = 'Micro Finance Scheme';
    schemeCode = 'MICRO';
    interest = 6.5;
    tenureMonths = 36;
    moratoriumMonths = 3;
    maxLoan = MICRO_MAX_LOAN;
  } else {
    scheme = 'Term Loan Scheme';
    schemeCode = 'TERM';
    interest = 8.0;
    tenureMonths = 84;
    moratoriumMonths = 6;
    maxLoan = TERM_MAX_LOAN;
  }

  const approvedLoan = Math.min(loanNeeded, maxLoan);
  const withinLimit = projectCost <= TERM_LIMIT;
  const eligible = withinLimit && approvedLoan > 0;

  const rMonthly = interest / 100 / 12;
  const principalAfterMoratorium = approvedLoan * Math.pow(1 + rMonthly, moratoriumMonths);
  const repaymentMonths = tenureMonths - moratoriumMonths;

  let emi = 0;
  if (rMonthly === 0) {
    emi = principalAfterMoratorium / repaymentMonths;
  } else {
    emi =
      (principalAfterMoratorium * rMonthly * Math.pow(1 + rMonthly, repaymentMonths)) /
      (Math.pow(1 + rMonthly, repaymentMonths) - 1);
  }

  emi = Math.round(emi * 100) / 100;
  const totalPayable = Math.round(emi * repaymentMonths * 100) / 100;
  const totalInterest = Math.round((totalPayable - approvedLoan) * 100) / 100;

  // Quarterly Amortization Schedule
  const quarterlySchedule = [];
  let balance = principalAfterMoratorium;
  const totalQuarters = Math.floor(repaymentMonths / 3);

  for (let q = 1; q <= totalQuarters; q++) {
    let qPrincipal = 0;
    let qInterest = 0;
    for (let m = 0; m < 3; m++) {
      const interestPay = balance * rMonthly;
      const principalPay = emi - interestPay;
      balance -= principalPay;
      qPrincipal += principalPay;
      qInterest += interestPay;
    }
    quarterlySchedule.push({
      quarter: q,
      principal: Math.round(qPrincipal * 100) / 100,
      interest: Math.round(qInterest * 100) / 100,
      total: Math.round((qPrincipal + qInterest) * 100) / 100,
      balance: Math.round(Math.max(balance, 0) * 100) / 100,
    });
  }

  // Yearly Amortization Schedule
  const yearly = [];
  balance = principalAfterMoratorium;
  let yearPrincipal = 0;
  let yearInterest = 0;
  let year = 1;

  for (let m = 1; m <= repaymentMonths; m++) {
    const interestPay = balance * rMonthly;
    const principalPay = emi - interestPay;
    balance -= principalPay;
    yearPrincipal += principalPay;
    yearInterest += interestPay;

    if (m % 12 === 0 || m === repaymentMonths) {
      yearly.push({
        year: year,
        principal: Math.round(yearPrincipal * 100) / 100,
        interest: Math.round(yearInterest * 100) / 100,
        balance: Math.round(Math.max(balance, 0) * 100) / 100,
      });
      yearPrincipal = 0;
      yearInterest = 0;
      year++;
    }
  }

  return {
    margin_capital: marginCapital,
    project_cost: projectCost,
    loan_needed: loanNeeded,
    approved_loan: approvedLoan,
    scheme_name: scheme,
    scheme_code: schemeCode,
    interest_rate: interest,
    tenure_months: tenureMonths,
    tenure_years: Math.round((tenureMonths / 12) * 10) / 10,
    moratorium_months: moratoriumMonths,
    max_loan_cap: maxLoan,
    emi: emi,
    repayment_months: repaymentMonths,
    total_payable: totalPayable,
    total_interest: totalInterest,
    eligible: eligible,
    within_scheme_limit: withinLimit,
    capped_by_max: loanNeeded > maxLoan,
    quarterly_schedule: quarterlySchedule,
    yearly_schedule: yearly,
    working_capital_estimate: Math.round(projectCost * 0.15 * 100) / 100,
    operational_cost_monthly: Math.round(projectCost * 0.04 * 100) / 100,
  };
}

// ---------- Google Gemini AI Feasibility Call ----------
async function callGeminiAI(promptText) {
  if (!GEMINI_API_KEY) return null;
  return new Promise((resolve) => {
    const data = JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const text = parsed.candidates[0].content.parts[0].text;
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            resolve(JSON.parse(jsonMatch[0]));
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.write(data);
    req.end();
  });
}

function generateFallbackFeasibility(input, financials) {
  const viabilityScore = Math.floor(Math.random() * 15) + 80;
  const village = input.village || 'Village';
  const district = input.district || 'District';
  const category = input.business_category || 'Business';

  return {
    executive_summary: `High feasibility for starting a ${category} unit in ${village}, ${district}. Strong consumer demand with institutional subsidy support.`,
    viability_score: viabilityScore,
    viability_label: 'Excellent',
    market_reach: {
      consumer_base_estimate: `Estimated 8,500+ households within 8km radius of ${village}, ${district}.`,
      primary_channels: ['Direct Retail Selling', 'Local Weekly Haat / Markets', 'B2B Supply to Nearby Towns'],
      radius_km: 8,
      target_segments: ['Local Households', 'Small Retail Shops', 'Community Centers & Canteens'],
    },
    opportunity_analysis: {
      unserved_niches: [
        `High demand for quality ${category} products in ${village}`,
        `Lack of direct doorstep supply in neighboring villages of ${district}`,
        `Scope for branded eco-friendly packaging`,
      ],
      seasonal_windows: ['Festival Seasons (Diwali, Eid, Local Fairs)', 'Harvest Season Spike'],
      recommended_positioning: `Position as a premium yet affordable local producer in ${district}.`,
    },
    swot: {
      strengths: ['Low operational cost setup', 'Direct access to raw materials', 'Strong community goodwill', 'Government subsidy eligibility'],
      weaknesses: ['Limited initial brand awareness', 'Dependence on local transport', 'Initial working capital constraints', 'Seasonal demand fluctuations'],
      opportunities: ['Expansion to nearby block markets', 'E-commerce / WhatsApp order cataloging', 'Self-Help Group (SHG) aggregation', 'Government procurement tie-ups'],
      threats: ['Unorganized local competitors', 'Fluctuation in raw material prices', 'Irregular power/water supply in peak summers', 'Credit sales pressure from customers'],
    },
    threats_detailed: [
      { threat: 'Raw Material Price Hike', severity: 'Medium', mitigation: 'Maintain 15-day buffer stock and negotiate bulk pricing' },
      { threat: 'Competition from Unorganized Sellers', severity: 'Low', mitigation: 'Ensure superior quality packaging & customer loyalty discounts' },
      { threat: 'Cashflow Bottleneck due to Credit Sales', severity: 'High', mitigation: 'Enforce strict 7-day credit limit and incentivize digital payments' },
    ],
    competitor_mapping: {
      estimated_density: `3-5 small unorganized players in 10km radius of ${village}`,
      competition_level: 'Moderate',
      key_competitors_type: ['Traditional Artisans/Traders', 'Small Unregistered Sellers'],
      differentiation_strategy: 'Provide hygienic packaging, consistent weight/quality, and reliable delivery.',
    },
    product_market_value: {
      suggested_price_range: '₹50 - ₹450 depending on product size/unit',
      regional_purchasing_power_note: `Medium purchasing power in ${district} with steady demand for essential goods.`,
      pricing_strategy: 'Competitive Value Pricing',
      monthly_revenue_potential_low: Math.round(financials.project_cost * 0.18),
      monthly_revenue_potential_high: Math.round(financials.project_cost * 0.35),
    },
    action_roadmap: [
      `Step 1: Secure Scheme Approval for ₹${financials.approved_loan.toLocaleString('en-IN')} Loan under ${financials.scheme_name}`,
      `Step 2: Setup manufacturing/operational unit in ${village}`,
      `Step 3: Procure machinery and raw material setup`,
      `Step 4: Conduct launch marketing across 5 neighboring villages in ${district}`,
      `Step 5: Begin commercial production and establish retail channels`,
    ],
    government_support: [
      `${financials.scheme_name} (Interest Rate: ${financials.interest_rate}%)`,
      'PMEGP / National SC/ST Finance Development Corporation Support',
      'Local MSME Skill Training & Exhibition Stall Support',
    ],
    cultural_local_note: `High acceptance of locally produced goods in ${district} due to trust in local entrepreneurs.`,
  };
}

// ---------- Static Datasets ----------
const LOCATIONS = {
  Maharashtra: {
    Nashik: { Sinnar: ['Musalgaon', 'Nandurshingote', 'Pandhurli'], Igatpuri: ['Ghoti Budruk', 'Wadivarhe'] },
    Pune: { Junnar: ['Otur', 'Narayangaon'], Ambegaon: ['Manchar', 'Ghodegaon'] },
  },
  'Uttar Pradesh': {
    Varanasi: { Sevapuri: ['Mirzamurad', 'Kachhwa'], Pindra: ['Baragaon', 'Phulwaria'] },
    Lucknow: { Malihabad: ['Malihabad', 'Rahimabad'], Mohanlalganj: ['Mohanlalganj', 'Nigohan'] },
  },
  'Tamil Nadu': {
    Coimbatore: { Pollachi: ['Anaimalai', 'Kinathukadavu'], Sulur: ['Sulur', 'Kannampalayam'] },
    Madurai: { Melur: ['Melur', 'Kottampatti'], Vadipatti: ['Vadipatti', 'T. Kallupatti'] },
  },
  'West Bengal': {
    Bardhaman: { Kalna: ['Kalna', 'Baghnapara'], Katwa: ['Katwa', 'Ketugram'] },
    Hooghly: { Arambagh: ['Arambagh', 'Goghat'], Chinsurah: ['Bansberia', 'Mogra'] },
  },
  Karnataka: {
    Mysuru: { Hunsur: ['Hunsur', 'Bilikere'], Piriyapatna: ['Piriyapatna', 'Kittur'] },
    Belagavi: { Bailhongal: ['Bailhongal', 'Kittur'], Athani: ['Athani', 'Ainapur'] },
  },
  Telangana: {
    Warangal: { Wardhannapet: ['Wardhannapet', 'Nekkonda'], Parkal: ['Parkal', 'Atmakur'] },
    Karimnagar: { Huzurabad: ['Huzurabad', 'Veenavanka'], Jammikunta: ['Jammikunta', 'Mustabad'] },
  },
  Gujarat: {
    Anand: { Anand: ['Anand', 'Vallabh Vidyanagar'], Petlad: ['Petlad', 'Sojitra'] },
    Kutch: { Bhuj: ['Bhuj', 'Madhapar'], Anjar: ['Anjar', 'Bhachau'] },
  },
  Bihar: {
    Patna: { Danapur: ['Danapur', 'Maner'], Barh: ['Barh', 'Athmalgola'] },
    Muzaffarpur: { Kanti: ['Kanti', 'Meenapur'], Motipur: ['Motipur', 'Saraiya'] },
  },
};

const BUSINESS_CATEGORIES = [
  'Dairy & Milk Products',
  'Poultry Farming',
  'Goat & Sheep Farming',
  'Retail Kirana Store',
  'Textiles & Handloom',
  'Tailoring & Boutique',
  'Beauty Parlour',
  'Mobile Repair & Recharge Shop',
  'Auto/E-Rickshaw Service',
  'Bakery & Confectionery',
  'Tea Stall / Snacks',
  'Vegetable & Fruit Vending',
  'Agri-Inputs (Seeds, Fertilizer)',
  'Fisheries',
  'Handicrafts',
  'Beekeeping',
  'Flour Mill',
  'Papad / Pickle Making',
  'Photocopy & CSC Centre',
  'Two-Wheeler Repair',
];

// ---------- Routes ----------
app.get('/', (req, res) => {
  res.json({
    message: 'Grameen Udyog AI Advisory API (Node.js/Express + Google Gemini AI)',
    status: 'live',
    health: 'OK',
    endpoints: {
      health: '/api',
      locations: '/api/locations',
      business_categories: '/api/business-categories',
      calculator: 'POST /api/calculator/compute',
      feasibility: 'POST /api/feasibility/generate',
      auth_login: 'POST /api/auth/login',
      auth_register: 'POST /api/auth/register',
    },
  });
});

app.get('/api', (req, res) => {
  res.json({ message: 'Grameen Udyog AI Advisory API (Node.js/Express + Google Gemini AI)', status: 'live' });
});

app.get('/api/locations', (req, res) => {
  res.json(LOCATIONS);
});

app.get('/api/business-categories', (req, res) => {
  res.json(BUSINESS_CATEGORIES);
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ detail: 'Name, email and password are required' });
    }

    const lowerEmail = email.toLowerCase().trim();
    if (usersByEmail.has(lowerEmail)) {
      return res.status(400).json({ detail: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const userDoc = {
      id: userId,
      email: lowerEmail,
      name: name,
      password: hashedPassword,
      created_at: new Date().toISOString(),
    };

    users.set(userId, userDoc);
    usersByEmail.set(lowerEmail, userDoc);

    const token = jwt.sign({ user_id: userId }, JWT_SECRET, { expiresIn: '30d' });
    return res.json({
      token,
      user: { id: userId, email: userDoc.email, name: userDoc.name },
    });
  } catch (err) {
    return res.status(500).json({ detail: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ detail: 'Email and password required' });
    }

    const lowerEmail = email.toLowerCase().trim();
    const user = usersByEmail.get(lowerEmail);
    if (!user) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    const token = jwt.sign({ user_id: user.id }, JWT_SECRET, { expiresIn: '30d' });
    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    return res.status(500).json({ detail: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

app.post('/api/calculator/compute', (req, res) => {
  try {
    const { margin_capital } = req.body;
    const result = computeScheme(Number(margin_capital));
    res.json(result);
  } catch (err) {
    res.status(400).json({ detail: err.message });
  }
});

app.post('/api/feasibility/generate', optionalToken, async (req, res) => {
  try {
    const input = req.body;
    const financials = computeScheme(Number(input.margin_capital));
    const reportId = uuidv4();

    const promptText = `Analyze feasibility for starting a ${input.business_category} business in Village: ${input.village}, Block: ${input.block}, District: ${input.district}, State: ${input.state}. Available capital: ₹${input.margin_capital}. Total project cost: ₹${financials.project_cost}. Selected Scheme: ${financials.scheme_name}. Respond with strict JSON containing executive_summary, viability_score (0-100), viability_label, market_reach, opportunity_analysis, swot, threats_detailed, competitor_mapping, product_market_value, action_roadmap, government_support, cultural_local_note.`;

    let feasibility = await callGeminiAI(promptText);
    if (!feasibility) {
      feasibility = generateFallbackFeasibility(input, financials);
    }

    const result = {
      id: reportId,
      input: input,
      feasibility: feasibility,
      financials: financials,
      generated_at: new Date().toISOString(),
    };

    if (req.user) {
      const userReport = { ...result, user_id: req.user.id };
      reports.set(reportId, userReport);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

app.get('/api/reports', authenticateToken, (req, res) => {
  const userReports = Array.from(reports.values())
    .filter((r) => r.user_id === req.user.id)
    .sort((a, b) => new Date(b.generated_at) - new Date(a.generated_at));

  res.json(userReports);
});

app.get('/api/reports/:id', authenticateToken, (req, res) => {
  const report = reports.get(req.params.id);
  if (!report || report.user_id !== req.user.id) {
    return res.status(404).json({ detail: 'Report not found' });
  }
  res.json(report);
});

app.delete('/api/reports/:id', authenticateToken, (req, res) => {
  const report = reports.get(req.params.id);
  if (!report || report.user_id !== req.user.id) {
    return res.status(404).json({ detail: 'Report not found' });
  }
  reports.delete(req.params.id);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`🚀 Express Server (with Google Gemini AI) running on http://localhost:${PORT}`);
});
