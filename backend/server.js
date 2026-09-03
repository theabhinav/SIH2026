const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { MongoClient } = require('mongodb');
const https = require('https');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8001;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_grameen_udyog_jwt_key_2026';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '8mb' }));

// ---------- Points config ----------
const POINTS = { SHOP_DETAILS: 10, SHOP_PHOTO: 5, SHOP_CONTACT: 3, UPVOTE_RECEIVED: 2 };

// ---------- MongoDB ----------
const mongoClient = new MongoClient(process.env.MONGO_URL || 'mongodb://localhost:27017');
let db = null;

async function initDb() {
  await mongoClient.connect();
  db = mongoClient.db(process.env.DB_NAME || 'grameen_udyog');
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ id: 1 }, { unique: true });
  await db.collection('reports').createIndex({ id: 1 }, { unique: true });
  await db.collection('reports').createIndex({ user_id: 1 });
  console.log('✅ MongoDB connected:', process.env.DB_NAME || 'grameen_udyog');
}

// ---------- Auth Middleware ----------
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Missing or invalid token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await db.collection('users').findOne({ id: payload.user_id });
    if (!user) return res.status(401).json({ detail: 'User not found' });
    req.user = { id: user.id, email: user.email, name: user.name, points: user.points || 0 };
    next();
  } catch (err) {
    return res.status(401).json({ detail: 'Invalid token' });
  }
}

async function optionalToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = await db.collection('users').findOne({ id: payload.user_id });
      if (user) req.user = { id: user.id, email: user.email, name: user.name };
    } catch (e) { /* ignore */ }
  }
  next();
}

// ---------- Deterministic helpers ----------
function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // return 0..1
  return ((h >>> 0) % 100000) / 100000;
}
const r2 = (n) => Math.round(n * 100) / 100;
const r0 = (n) => Math.round(n);

// ---------- Scheme limits ----------
const MICRO_LIMIT = 140000;
const TERM_LIMIT = 5000000;
const MICRO_MAX_LOAN = 125000;
const TERM_MAX_LOAN = 4500000;
const MARGIN_RATIO = 0.10; // borrower contributes 10%

// ---------- Financial Calculator (precise) ----------
function computeScheme(marginCapital, opts = {}) {
  const frequency = opts.frequency === 'monthly' ? 'monthly' : 'quarterly';
  marginCapital = Number(marginCapital);
  if (!Number.isFinite(marginCapital) || marginCapital <= 0) {
    throw new Error('Margin capital must be a positive number');
  }
  if (marginCapital < 5000) {
    throw new Error('Minimum margin capital is ₹5,000');
  }

  const projectCost = r2(marginCapital / MARGIN_RATIO);
  const loanNeeded = r2(projectCost - marginCapital);

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

  const approvedLoan = r2(Math.min(loanNeeded, maxLoan));
  const cappedByMax = loanNeeded > maxLoan;
  const shortfall = cappedByMax ? r2(loanNeeded - maxLoan) : 0;
  const withinLimit = projectCost <= TERM_LIMIT;
  const eligible = withinLimit && approvedLoan > 0;

  const rMonthly = interest / 100 / 12;
  const repaymentMonths = tenureMonths - moratoriumMonths;

  // Interest-only accrual during moratorium (principal untouched) — realistic & precise
  const moratoriumInterest = r2(approvedLoan * rMonthly * moratoriumMonths);

  // Standard amortised EMI on the approved principal
  const emiMonthly = r2(
    (approvedLoan * rMonthly * Math.pow(1 + rMonthly, repaymentMonths)) /
    (Math.pow(1 + rMonthly, repaymentMonths) - 1)
  );

  // Build a precise month-by-month ledger
  let balance = approvedLoan;
  const monthly = [];
  for (let m = 1; m <= repaymentMonths; m++) {
    const interestPay = balance * rMonthly;
    let principalPay = emiMonthly - interestPay;
    if (m === repaymentMonths) principalPay = balance; // clear rounding tail
    balance = Math.max(balance - principalPay, 0);
    monthly.push({ month: m, principal: principalPay, interest: interestPay, balance });
  }

  // Quarterly rollup
  const quarterlySchedule = [];
  for (let q = 0; q < Math.ceil(repaymentMonths / 3); q++) {
    const slice = monthly.slice(q * 3, q * 3 + 3);
    if (!slice.length) break;
    const p = slice.reduce((s, x) => s + x.principal, 0);
    const i = slice.reduce((s, x) => s + x.interest, 0);
    quarterlySchedule.push({
      quarter: q + 1,
      principal: r2(p),
      interest: r2(i),
      total: r2(p + i),
      balance: r2(slice[slice.length - 1].balance),
    });
  }

  // Yearly rollup
  const yearly = [];
  for (let y = 0; y < Math.ceil(repaymentMonths / 12); y++) {
    const slice = monthly.slice(y * 12, y * 12 + 12);
    if (!slice.length) break;
    const p = slice.reduce((s, x) => s + x.principal, 0);
    const i = slice.reduce((s, x) => s + x.interest, 0);
    yearly.push({
      year: y + 1,
      principal: r2(p),
      interest: r2(i),
      balance: r2(slice[slice.length - 1].balance),
    });
  }

  const emiInterestTotal = r2(monthly.reduce((s, x) => s + x.interest, 0));
  const totalInterest = r2(emiInterestTotal + moratoriumInterest);
  const totalPayable = r2(approvedLoan + totalInterest);
  const quarterlyInstalment = r2(emiMonthly * 3);

  return {
    margin_capital: r2(marginCapital),
    project_cost: projectCost,
    loan_needed: loanNeeded,
    approved_loan: approvedLoan,
    scheme_name: scheme,
    scheme_code: schemeCode,
    interest_rate: interest,
    repayment_frequency: frequency,
    tenure_months: tenureMonths,
    tenure_years: r2(tenureMonths / 12),
    moratorium_months: moratoriumMonths,
    moratorium_interest: moratoriumInterest,
    max_loan_cap: maxLoan,
    emi: emiMonthly,
    emi_monthly: emiMonthly,
    quarterly_instalment: quarterlyInstalment,
    repayment_months: repaymentMonths,
    total_payable: totalPayable,
    total_interest: totalInterest,
    eligible,
    within_scheme_limit: withinLimit,
    capped_by_max: cappedByMax,
    shortfall,
    quarterly_schedule: quarterlySchedule,
    yearly_schedule: yearly,
  };
}

// ---------- Category economics ----------
const CATEGORY_PROFILE = {
  'Dairy & Milk Products': { turnover: 0.28, raw: 0.48, labor: 0.12, inv: 0.05, opex: 0.09, other: 0.04, demand: 5 },
  'Poultry Farming': { turnover: 0.30, raw: 0.52, labor: 0.10, inv: 0.06, opex: 0.08, other: 0.04, demand: 4 },
  'Goat & Sheep Farming': { turnover: 0.20, raw: 0.42, labor: 0.10, inv: 0.05, opex: 0.07, other: 0.04, demand: 3 },
  'Retail Kirana Store': { turnover: 0.55, raw: 0.72, labor: 0.06, inv: 0.08, opex: 0.06, other: 0.03, demand: 5 },
  'Textiles & Handloom': { turnover: 0.22, raw: 0.46, labor: 0.16, inv: 0.06, opex: 0.08, other: 0.05, demand: 3 },
  'Tailoring & Boutique': { turnover: 0.26, raw: 0.34, labor: 0.22, inv: 0.05, opex: 0.09, other: 0.05, demand: 4 },
  'Beauty Parlour': { turnover: 0.30, raw: 0.22, labor: 0.26, inv: 0.05, opex: 0.14, other: 0.06, demand: 4 },
  'Mobile Repair & Recharge Shop': { turnover: 0.40, raw: 0.40, labor: 0.14, inv: 0.10, opex: 0.10, other: 0.05, demand: 4 },
  'Auto/E-Rickshaw Service': { turnover: 0.24, raw: 0.30, labor: 0.10, inv: 0.04, opex: 0.28, other: 0.06, demand: 4 },
  'Bakery & Confectionery': { turnover: 0.32, raw: 0.44, labor: 0.16, inv: 0.05, opex: 0.11, other: 0.05, demand: 4 },
  'Tea Stall / Snacks': { turnover: 0.45, raw: 0.42, labor: 0.14, inv: 0.05, opex: 0.13, other: 0.05, demand: 5 },
  'Vegetable & Fruit Vending': { turnover: 0.60, raw: 0.74, labor: 0.06, inv: 0.06, opex: 0.06, other: 0.03, demand: 5 },
  'Agri-Inputs (Seeds, Fertilizer)': { turnover: 0.38, raw: 0.70, labor: 0.06, inv: 0.10, opex: 0.06, other: 0.03, demand: 4 },
  'Fisheries': { turnover: 0.26, raw: 0.46, labor: 0.12, inv: 0.06, opex: 0.10, other: 0.05, demand: 3 },
  'Handicrafts': { turnover: 0.20, raw: 0.32, labor: 0.24, inv: 0.06, opex: 0.08, other: 0.06, demand: 3 },
  'Beekeeping': { turnover: 0.22, raw: 0.28, labor: 0.14, inv: 0.06, opex: 0.09, other: 0.06, demand: 3 },
  'Flour Mill': { turnover: 0.34, raw: 0.58, labor: 0.08, inv: 0.06, opex: 0.12, other: 0.04, demand: 4 },
  'Papad / Pickle Making': { turnover: 0.28, raw: 0.40, labor: 0.20, inv: 0.06, opex: 0.08, other: 0.05, demand: 4 },
  'Photocopy & CSC Centre': { turnover: 0.36, raw: 0.20, labor: 0.14, inv: 0.06, opex: 0.16, other: 0.06, demand: 4 },
  'Two-Wheeler Repair': { turnover: 0.30, raw: 0.34, labor: 0.20, inv: 0.08, opex: 0.10, other: 0.05, demand: 4 },
};
function getProfile(cat) {
  return CATEGORY_PROFILE[cat] || { turnover: 0.30, raw: 0.42, labor: 0.14, inv: 0.06, opex: 0.10, other: 0.05, demand: 3 };
}

const STATE_PPP = {
  Gujarat: 5, Karnataka: 5, 'Tamil Nadu': 5, Maharashtra: 5, Telangana: 4,
  'West Bengal': 3, 'Uttar Pradesh': 3, Bihar: 2,
};

// ---------- Revenue & cost model ----------
function computeRevenueModel(input, fin) {
  const p = getProfile(input.business_category);
  const monthlyRevenue = r0(fin.project_cost * p.turnover);
  const rawMaterial = r0(monthlyRevenue * p.raw);
  const workerCost = r0(monthlyRevenue * p.labor);
  const inventoryCost = r0(monthlyRevenue * p.inv);
  const operationalCost = r0(monthlyRevenue * p.opex);
  const otherCost = r0(monthlyRevenue * p.other);
  const operatingTotal = rawMaterial + workerCost + inventoryCost + operationalCost + otherCost;
  const grossProfit = monthlyRevenue - operatingTotal;
  const loanServicing = r0(fin.emi_monthly);
  const netProfit = grossProfit - loanServicing;
  const annualNet = netProfit * 12;
  const roiAnnualPct = fin.margin_capital > 0 ? r2((annualNet / fin.margin_capital) * 100) : 0;
  const breakEvenMonths = netProfit > 0 ? Math.ceil(fin.project_cost / netProfit) : null;
  const netMarginPct = monthlyRevenue > 0 ? r2((netProfit / monthlyRevenue) * 100) : 0;

  return {
    monthly_revenue: monthlyRevenue,
    annual_revenue: monthlyRevenue * 12,
    cost_breakdown: [
      { label: 'Raw Material', value: rawMaterial, note: 'Inputs consumed to make/sell your product' },
      { label: 'Worker / Labour Cost', value: workerCost, note: 'Wages for hired help or self-labour' },
      { label: 'Inventory Cost', value: inventoryCost, note: 'Stock holding & spoilage buffer' },
      { label: 'Operational Cost', value: operationalCost, note: 'Rent, power, water, fuel, transport' },
      { label: 'Other / Misc', value: otherCost, note: 'Packaging, marketing, maintenance' },
    ],
    operating_cost_total: operatingTotal,
    gross_profit_monthly: grossProfit,
    loan_servicing_monthly: loanServicing,
    net_profit_monthly: netProfit,
    annual_net_profit: annualNet,
    net_margin_pct: netMarginPct,
    roi_annual_pct: roiAnnualPct,
    break_even_months: breakEvenMonths,
    description: netProfit > 0
      ? `At full utilisation this unit can turn over about ₹${monthlyRevenue.toLocaleString('en-IN')}/month. After ₹${operatingTotal.toLocaleString('en-IN')} of running costs and ₹${loanServicing.toLocaleString('en-IN')} loan EMI, an estimated ₹${netProfit.toLocaleString('en-IN')}/month stays as net profit — roughly a ${netMarginPct}% net margin.`
      : `Projected monthly revenue of ₹${monthlyRevenue.toLocaleString('en-IN')} is not enough to cover running costs plus the ₹${loanServicing.toLocaleString('en-IN')} EMI at this capital level. The model shows a monthly shortfall, so the plan needs higher scale or more margin capital.`,
  };
}

// ---------- Viability score (varied, factor-based) ----------
function computeViability(input, fin, rev) {
  const p = getProfile(input.business_category);
  // profitability score
  const nm = rev.net_margin_pct;
  let profitScore;
  if (nm <= 0) profitScore = 12;
  else if (nm < 5) profitScore = 35;
  else if (nm < 10) profitScore = 55;
  else if (nm < 15) profitScore = 70;
  else if (nm < 22) profitScore = 84;
  else profitScore = 92;

  const demandScore = 30 + p.demand * 11; // 41..85
  const ppp = STATE_PPP[input.state] || 3;
  const locationScore = 40 + ppp * 9; // 58..85

  // competition from deterministic seed
  const compSeed = seeded((input.village || '') + (input.business_category || '') + (input.district || ''));
  const competitionPenalty = Math.round(compSeed * 16); // 0..16

  let score = 0.42 * profitScore + 0.33 * demandScore + 0.25 * locationScore;
  score -= competitionPenalty;
  if (fin.capped_by_max) score -= 14;
  if (fin.margin_capital < 20000) score -= 8;
  score += (seeded((input.village || '') + 'jit') * 8 - 4); // ±4 jitter
  score = Math.max(28, Math.min(96, Math.round(score)));

  let label;
  if (score < 45) label = 'Challenging';
  else if (score < 58) label = 'Moderate';
  else if (score < 70) label = 'Fair';
  else if (score < 80) label = 'Good';
  else if (score < 88) label = 'Strong';
  else label = 'Excellent';

  return { score, label, competition_index: Math.round(compSeed * 100) };
}

// ---------- Recommendation (nuanced, not always "start") ----------
function computeRecommendation(input, fin, rev, viability) {
  const s = viability.score;
  const net = rev.net_profit_monthly;
  let verdict, tone, headline, rationale, suggested_capital = null, long_term_outlook;

  const betterMargin = fin.capped_by_max
    ? r0((fin.margin_capital + fin.shortfall) / 1000) * 1000
    : r0((fin.margin_capital * 1.5) / 1000) * 1000;

  if (s >= 72 && net > 0 && !fin.capped_by_max) {
    verdict = 'Recommended';
    tone = 'positive';
    headline = `You can start ${input.business_category} at ₹${fin.margin_capital.toLocaleString('en-IN')} margin — strong long-term potential.`;
    rationale = `Healthy demand and a ${rev.net_margin_pct}% net margin give a projected ₹${net.toLocaleString('en-IN')}/month profit and ~${rev.roi_annual_pct}% annual ROI on your capital.`;
    long_term_outlook = `Break-even in about ${rev.break_even_months} months. Reinvesting profit can fund expansion to nearby blocks within 2–3 years.`;
  } else if (s >= 60 && net > 0) {
    verdict = 'Proceed with Caution';
    tone = 'caution';
    headline = `Viable, but tighten the plan before committing at ₹${fin.margin_capital.toLocaleString('en-IN')}.`;
    rationale = `Profit is positive (₹${net.toLocaleString('en-IN')}/month) but margins are thin. Control raw-material and operational costs to protect returns.`;
    suggested_capital = betterMargin;
    long_term_outlook = `Starting with about ₹${betterMargin.toLocaleString('en-IN')} margin would ease working-capital stress and improve long-term stability.`;
  } else if (s >= 50) {
    verdict = 'Marginal — Improve Plan';
    tone = 'warn';
    headline = `Risky at ₹${fin.margin_capital.toLocaleString('en-IN')} — consider a larger capital base for real long-term benefit.`;
    rationale = `The numbers are borderline. At this capital the enterprise struggles to comfortably service the loan and generate durable profit.`;
    suggested_capital = betterMargin;
    long_term_outlook = `Scaling up to roughly ₹${betterMargin.toLocaleString('en-IN')} margin (₹${r0(betterMargin / MARGIN_RATIO).toLocaleString('en-IN')} project) is likely to give far better multi-year benefit.`;
  } else {
    verdict = 'Not Recommended at This Capital';
    tone = 'negative';
    headline = `At ₹${fin.margin_capital.toLocaleString('en-IN')} this plan is not advisable.`;
    rationale = fin.capped_by_max
      ? `The loan is capped at ₹${fin.max_loan_cap.toLocaleString('en-IN')}, leaving a ₹${fin.shortfall.toLocaleString('en-IN')} funding gap that undermines the plan.`
      : `Projected profit does not justify the risk and loan burden at this capital level.`;
    suggested_capital = betterMargin;
    long_term_outlook = `Either choose a lower-cost business or start with about ₹${betterMargin.toLocaleString('en-IN')} margin for a viable, long-term venture.`;
  }

  return { verdict, tone, headline, rationale, suggested_capital, long_term_outlook, viability_score: s };
}

// ---------- Government schemes ----------
function governmentSchemes(fin, input) {
  const all = [
    {
      code: 'PMEGP',
      name: "Prime Minister's Employment Generation Programme (PMEGP)",
      agency: 'KVIC / DIC / Ministry of MSME',
      interest_range: '6% – 11% p.a.',
      max_loan: '₹25 lakh (manufacturing) / ₹10 lakh (service)',
      subsidy: '15% – 35% margin-money subsidy (higher for SC/ST/women/rural)',
      tenure: '3 – 7 years',
      ideal_for: 'New micro-manufacturing & service units',
      eligibility: 'Age 18+, project above ₹10L needs 8th pass; no income ceiling',
      required_documents: ['Aadhaar & PAN', 'Project report / DPR', 'Caste/category certificate (for subsidy)', 'Passport photo', 'Rural area / population certificate', 'Educational qualification proof'],
      link: 'https://www.kviconline.gov.in/pmegp',
    },
    {
      code: 'MUDRA',
      name: 'Pradhan Mantri MUDRA Yojana (Shishu / Kishor / Tarun)',
      agency: 'MUDRA / Member Lending Institutions',
      interest_range: '8% – 12% p.a.',
      max_loan: 'Up to ₹10 lakh (₹20L Tarun Plus)',
      subsidy: 'No collateral; interest subvention on timely repayment',
      tenure: '1 – 5 years',
      ideal_for: 'Small trading, service & micro-manufacturing',
      eligibility: 'Any non-farm income-generating micro enterprise',
      required_documents: ['Aadhaar & PAN', 'Business proof / address proof', 'Bank statement (6 months)', 'Quotation of machinery/goods', 'Passport photos'],
      link: 'https://www.mudra.org.in',
    },
    {
      code: 'STANDUP',
      name: 'Stand-Up India',
      agency: 'SIDBI / Scheduled Banks',
      interest_range: 'Bank MCLR + up to 3%',
      max_loan: '₹10 lakh – ₹1 crore',
      subsidy: 'Composite loan (term + working capital), handholding support',
      tenure: 'Up to 7 years (18-month moratorium)',
      ideal_for: 'SC/ST & women entrepreneurs, greenfield units',
      eligibility: 'SC/ST or woman, 51%+ stake, first-time greenfield venture',
      required_documents: ['Aadhaar & PAN', 'Caste certificate / proof of gender', 'Project report', 'Proof of business premises', 'Quotations for assets'],
      link: 'https://www.standupmitra.in',
    },
    {
      code: 'NSFDC',
      name: 'NSFDC / NBCFDC / NSKFDC Concessional Loan',
      agency: 'National Finance & Development Corporations',
      interest_range: '5% – 8% p.a. (concessional)',
      max_loan: 'Up to ₹50 lakh (Term Loan)',
      subsidy: 'Below-market concessional interest for target groups',
      tenure: 'Up to 10 years',
      ideal_for: 'SC / OBC / Safai Karamchari beneficiaries',
      eligibility: 'Target-group membership + family income ceiling',
      required_documents: ['Aadhaar & PAN', 'Caste certificate', 'Income certificate', 'Project report', 'Bank account proof', 'Guarantor documents'],
      link: 'https://nsfdc.nic.in',
    },
    {
      code: 'CGTMSE',
      name: 'Credit Guarantee Fund (CGTMSE) backed Loan',
      agency: 'CGTMSE / Member Lending Institutions',
      interest_range: 'As per lender',
      max_loan: 'Up to ₹5 crore (collateral-free guarantee)',
      subsidy: 'Collateral-free — guarantee cover up to 85%',
      tenure: 'As per lender',
      ideal_for: 'MSMEs without collateral',
      eligibility: 'New & existing micro/small enterprises',
      required_documents: ['Udyam registration', 'Aadhaar & PAN', 'Project report', 'Financial projections', 'KYC of promoters'],
      link: 'https://www.cgtmse.in',
    },
  ];
  const primaryCode = fin.scheme_code === 'MICRO' ? 'MUDRA' : 'PMEGP';
  return all.map((s) => ({ ...s, primary: s.code === primaryCode }))
    .sort((a, b) => (b.primary === true) - (a.primary === true));
}

// ---------- Vendors (deterministic supply chain) ----------
const VENDOR_TEMPLATES = {
  raw: {
    'Dairy & Milk Products': [{ item: 'Fresh Milk (bulk)', unit: '₹/litre' }, { item: 'Cattle Feed', unit: '₹/50kg' }, { item: 'Rennet & Cultures', unit: '₹/kit' }],
    'Retail Kirana Store': [{ item: 'FMCG Wholesale Stock', unit: '₹/carton' }, { item: 'Grains & Pulses', unit: '₹/quintal' }, { item: 'Edible Oil', unit: '₹/15L tin' }],
    'Bakery & Confectionery': [{ item: 'Refined Flour (Maida)', unit: '₹/50kg' }, { item: 'Sugar', unit: '₹/50kg' }, { item: 'Butter & Ghee', unit: '₹/kg' }],
    'Tailoring & Boutique': [{ item: 'Fabric Rolls', unit: '₹/metre' }, { item: 'Thread & Trims', unit: '₹/box' }, { item: 'Buttons & Zips', unit: '₹/gross' }],
    default: [{ item: 'Primary Raw Material', unit: '₹/kg' }, { item: 'Secondary Inputs', unit: '₹/unit' }, { item: 'Consumables', unit: '₹/pack' }],
  },
  machinery: {
    'Dairy & Milk Products': [{ item: 'Milk Chilling Unit', unit: '₹/unit' }, { item: 'Cream Separator', unit: '₹/unit' }],
    'Bakery & Confectionery': [{ item: 'Rotary Oven', unit: '₹/unit' }, { item: 'Planetary Mixer', unit: '₹/unit' }],
    'Flour Mill': [{ item: 'Atta Chakki (Pulveriser)', unit: '₹/unit' }, { item: 'Sieving Machine', unit: '₹/unit' }],
    default: [{ item: 'Core Equipment', unit: '₹/unit' }, { item: 'Support Tools', unit: '₹/set' }],
  },
  packaging: {
    default: [{ item: 'Printed Pouches / Cartons', unit: '₹/1000' }, { item: 'Labels & Stickers', unit: '₹/roll' }],
  },
};
const VENDOR_SURNAMES = ['Traders', 'Enterprises', 'Agencies', 'Suppliers', 'Distributors', 'Udyog', 'Bhandar', 'Stores'];
const VENDOR_FIRST = ['Sri Balaji', 'Maa Durga', 'New Bharat', 'Gopal', 'Krishna', 'Shakti', 'Annapurna', 'Jai Kisan', 'Ganesh', 'Laxmi'];

function pick(arr, seed) { return arr[Math.floor(seed * arr.length) % arr.length]; }

function buildVendors(input, fin) {
  const base = (input.village || '') + (input.business_category || '') + (input.district || '');
  const out = [];
  const groups = [
    { type: 'Raw Material', templates: VENDOR_TEMPLATES.raw[input.business_category] || VENDOR_TEMPLATES.raw.default, count: 3 },
    { type: 'Machinery / Equipment', templates: VENDOR_TEMPLATES.machinery[input.business_category] || VENDOR_TEMPLATES.machinery.default, count: 2 },
    { type: 'Packaging', templates: VENDOR_TEMPLATES.packaging.default, count: 1 },
  ];
  let idx = 0;
  groups.forEach((g) => {
    g.templates.slice(0, g.count).forEach((tpl, j) => {
      const s = seeded(base + g.type + tpl.item + j);
      const name = `${pick(VENDOR_FIRST, s)} ${pick(VENDOR_SURNAMES, seeded(base + j + g.type))}`;
      const phone = '+91 9' + String(100000000 + Math.floor(seeded(base + tpl.item + idx) * 899999999)).slice(0, 9);
      const distance = r2(1.5 + s * 12);
      // price scaled roughly to project size
      const priceBase = g.type === 'Machinery / Equipment'
        ? r0(fin.project_cost * (0.08 + s * 0.15))
        : r0(200 + s * 4200);
      out.push({
        vendor_type: g.type,
        name,
        item: tpl.item,
        unit: tpl.unit,
        price: priceBase,
        contact: phone,
        location: `${pick(['Main Market', 'Mandi Road', 'Bypass Rd', 'Station Rd', 'Bazaar'], s)}, ${input.block || input.district}`,
        distance_km: distance,
        rating: r2(3.6 + s * 1.3),
      });
      idx++;
    });
  });
  return out.sort((a, b) => a.distance_km - b.distance_km);
}

function buildSupplyChain(input, vendors) {
  const rawVendors = vendors.filter((v) => v.vendor_type === 'Raw Material').map((v) => v.name);
  const p = getProfile(input.business_category);
  return {
    stages: [
      { key: 'source', title: 'Sourcing', detail: `Procure inputs from ${rawVendors.length} nearby suppliers`, nodes: rawVendors.length ? rawVendors : ['Local wholesale market'] },
      { key: 'produce', title: 'Production', detail: `Process / prepare ${input.business_category}`, nodes: [`${input.village} unit`] },
      { key: 'store', title: 'Storage', detail: 'Hold stock & maintain quality buffer', nodes: ['On-site inventory'] },
      { key: 'distribute', title: 'Distribution', detail: 'Move goods to points of sale', nodes: ['Direct retail', 'Weekly haat', 'Nearby town B2B'] },
      { key: 'customer', title: 'Customers', detail: `Serve local demand (tier ${p.demand}/5)`, nodes: ['Households', 'Retail shops', 'Institutions'] },
    ],
  };
}

// ---------- Gemini AI (user's own key, optional) ----------
async function callGeminiAI(promptText) {
  if (!GEMINI_API_KEY) return null;
  return new Promise((resolve) => {
    const data = JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
    });
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const text = parsed.candidates[0].content.parts[0].text;
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          resolve(jsonMatch ? JSON.parse(jsonMatch[0]) : null);
        } catch (e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(25000, () => { req.destroy(); resolve(null); });
    req.write(data);
    req.end();
  });
}

// Qualitative narrative fallback (numbers come from deterministic engine)
function narrativeFallback(input, fin, rev, viability, recommendation) {
  const village = input.village || 'the village';
  const district = input.district || 'the district';
  const category = input.business_category || 'business';
  return {
    executive_summary: `${recommendation.headline} ${recommendation.rationale} Anchored in ${village}, ${district}, this ${category} plan targets steady local demand with a scheme-backed concessional loan.`,
    market_reach: {
      consumer_base_estimate: `Roughly 8,000–9,000 households within an 8 km radius of ${village}, ${district}, with recurring demand for ${category}.`,
      primary_channels: ['Direct Retail Selling', 'Local Weekly Haat / Market', 'B2B Supply to Nearby Towns'],
      radius_km: 8,
      target_segments: ['Local Households', 'Small Retail Shops', 'Community Kitchens & Canteens'],
    },
    opportunity_analysis: {
      unserved_niches: [`Reliable quality ${category} supply in ${village}`, `Doorstep delivery to neighbouring villages of ${district}`, 'Branded, hygienic packaging'],
      seasonal_windows: ['Festival Season (Diwali, Eid, local fairs)', 'Harvest-season spike'],
      recommended_positioning: `Position as a dependable, fairly-priced local producer in ${district}.`,
    },
    swot: {
      strengths: ['Low setup cost', 'Local raw-material access', 'Community trust', 'Scheme subsidy eligibility'],
      weaknesses: ['Low initial brand awareness', 'Transport dependence', 'Working-capital constraints', 'Seasonal demand swings'],
      opportunities: ['Expansion to block markets', 'WhatsApp order catalogue', 'SHG aggregation', 'Govt procurement tie-ups'],
      threats: ['Unorganised competitors', 'Input price volatility', 'Power/water gaps in summer', 'Credit-sales pressure'],
    },
    threats_detailed: [
      { threat: 'Raw material price hike', severity: 'Medium', mitigation: 'Keep a 15-day buffer stock and negotiate bulk rates' },
      { threat: 'Unorganised competition', severity: 'Low', mitigation: 'Compete on quality, packaging and loyalty offers' },
      { threat: 'Credit-sales cash crunch', severity: 'High', mitigation: 'Enforce a 7-day credit limit; push digital payments' },
    ],
    competitor_mapping: {
      estimated_density: `About ${3 + Math.round(viability.competition_index / 25)} small unorganised players within 10 km of ${village}`,
      competition_level: viability.competition_index > 60 ? 'High' : viability.competition_index > 35 ? 'Moderate' : 'Low',
      key_competitors_type: ['Traditional traders/artisans', 'Small unregistered sellers'],
      differentiation_strategy: 'Consistent quality, honest weight, hygienic packaging and reliable delivery.',
    },
    product_market_value: {
      suggested_price_range: '₹40 – ₹450 depending on product size/unit',
      regional_purchasing_power_note: `${input.state || 'The region'} shows ${(STATE_PPP[input.state] || 3) >= 4 ? 'moderate-to-good' : 'modest'} purchasing power with steady essential-goods demand.`,
      pricing_strategy: 'Competitive value pricing',
      monthly_revenue_potential_low: r0(rev.monthly_revenue * 0.8),
      monthly_revenue_potential_high: r0(rev.monthly_revenue * 1.25),
    },
    action_roadmap: [
      `Secure scheme approval for a ₹${fin.approved_loan.toLocaleString('en-IN')} loan under ${fin.scheme_name}`,
      `Set up the unit in ${village} and complete Udyam registration`,
      'Procure machinery and first raw-material stock from listed vendors',
      `Run launch outreach across 5 neighbouring villages in ${district}`,
      'Begin commercial production and lock in retail channels',
    ],
    cultural_local_note: `Locally-made goods enjoy strong trust in ${district}, aiding early adoption.`,
  };
}

// ---------- Static datasets ----------
const LOCATIONS = {
  Maharashtra: { Nashik: { Sinnar: ['Musalgaon', 'Nandurshingote', 'Pandhurli'], Igatpuri: ['Ghoti Budruk', 'Wadivarhe'] }, Pune: { Junnar: ['Otur', 'Narayangaon'], Ambegaon: ['Manchar', 'Ghodegaon'] } },
  'Uttar Pradesh': { Varanasi: { Sevapuri: ['Mirzamurad', 'Kachhwa'], Pindra: ['Baragaon', 'Phulwaria'] }, Lucknow: { Malihabad: ['Malihabad', 'Rahimabad'], Mohanlalganj: ['Mohanlalganj', 'Nigohan'] } },
  'Tamil Nadu': { Coimbatore: { Pollachi: ['Anaimalai', 'Kinathukadavu'], Sulur: ['Sulur', 'Kannampalayam'] }, Madurai: { Melur: ['Melur', 'Kottampatti'], Vadipatti: ['Vadipatti', 'T. Kallupatti'] } },
  'West Bengal': { Bardhaman: { Kalna: ['Kalna', 'Baghnapara'], Katwa: ['Katwa', 'Ketugram'] }, Hooghly: { Arambagh: ['Arambagh', 'Goghat'], Chinsurah: ['Bansberia', 'Mogra'] } },
  Karnataka: { Mysuru: { Hunsur: ['Hunsur', 'Bilikere'], Piriyapatna: ['Piriyapatna', 'Kittur'] }, Belagavi: { Bailhongal: ['Bailhongal', 'Kittur'], Athani: ['Athani', 'Ainapur'] } },
  Telangana: { Warangal: { Wardhannapet: ['Wardhannapet', 'Nekkonda'], Parkal: ['Parkal', 'Atmakur'] }, Karimnagar: { Huzurabad: ['Huzurabad', 'Veenavanka'], Jammikunta: ['Jammikunta', 'Mustabad'] } },
  Gujarat: { Anand: { Anand: ['Anand', 'Vallabh Vidyanagar'], Petlad: ['Petlad', 'Sojitra'] }, Kutch: { Bhuj: ['Bhuj', 'Madhapar'], Anjar: ['Anjar', 'Bhachau'] } },
  Bihar: { Patna: { Danapur: ['Danapur', 'Maner'], Barh: ['Barh', 'Athmalgola'] }, Muzaffarpur: { Kanti: ['Kanti', 'Meenapur'], Motipur: ['Motipur', 'Saraiya'] } },
};

const BUSINESS_CATEGORIES = Object.keys(CATEGORY_PROFILE);

// ---------- Routes ----------
app.get('/api', (req, res) => {
  res.json({ message: 'Grameen Udyog AI Advisory API (Node.js/Express)', status: 'live' });
});

app.get('/api/locations', (req, res) => res.json(LOCATIONS));
app.get('/api/business-categories', (req, res) => res.json(BUSINESS_CATEGORIES));

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) return res.status(400).json({ detail: 'Name, email and password are required' });
    if (String(password).length < 6) return res.status(400).json({ detail: 'Password must be at least 6 characters' });
    const lowerEmail = email.toLowerCase().trim();
    const existing = await db.collection('users').findOne({ email: lowerEmail });
    if (existing) return res.status(400).json({ detail: 'Email already registered' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    await db.collection('users').insertOne({ id: userId, email: lowerEmail, name, password: hashedPassword, points: 0, created_at: new Date().toISOString() });
    const token = jwt.sign({ user_id: userId }, JWT_SECRET, { expiresIn: '30d' });
    return res.json({ token, user: { id: userId, email: lowerEmail, name, points: 0 } });
  } catch (err) {
    return res.status(500).json({ detail: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ detail: 'Email and password required' });
    const lowerEmail = email.toLowerCase().trim();
    const user = await db.collection('users').findOne({ email: lowerEmail });
    if (!user) return res.status(401).json({ detail: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ detail: 'Invalid credentials' });
    const token = jwt.sign({ user_id: user.id }, JWT_SECRET, { expiresIn: '30d' });
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name, points: user.points || 0 } });
  } catch (err) {
    return res.status(500).json({ detail: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => res.json(req.user));

app.post('/api/calculator/compute', (req, res) => {
  try {
    const { margin_capital, repayment_frequency } = req.body;
    const fin = computeScheme(margin_capital, { frequency: repayment_frequency });
    const rev = computeRevenueModel(req.body, fin);
    res.json({ ...fin, revenue_model: rev });
  } catch (err) {
    res.status(400).json({ detail: err.message });
  }
});

app.post('/api/feasibility/generate', optionalToken, async (req, res) => {
  try {
    const input = req.body || {};
    if (!input.business_category) return res.status(400).json({ detail: 'business_category is required' });
    const fin = computeScheme(input.margin_capital, { frequency: input.repayment_frequency });
    const rev = computeRevenueModel(input, fin);
    fin.revenue_model = rev;
    const viability = computeViability(input, fin, rev);
    const recommendation = computeRecommendation(input, fin, rev, viability);
    const vendors = buildVendors(input, fin);
    const supply_chain = buildSupplyChain(input, vendors);
    const schemes = governmentSchemes(fin, input);

    const promptText = `You are a rural business feasibility analyst for India. Return STRICT JSON only (no markdown). For a ${input.business_category} enterprise in Village ${input.village}, Block ${input.block}, District ${input.district}, State ${input.state}, with margin capital ₹${input.margin_capital} and total project cost ₹${fin.project_cost}. The independently computed viability score is ${viability.score}/100 and the verdict is "${recommendation.verdict}". Do NOT invent financial numbers. Provide ONLY qualitative fields as JSON keys: executive_summary (string, reflect the "${recommendation.verdict}" verdict honestly), market_reach {consumer_base_estimate, primary_channels[], radius_km, target_segments[]}, opportunity_analysis {unserved_niches[], seasonal_windows[], recommended_positioning}, swot {strengths[], weaknesses[], opportunities[], threats[]}, threats_detailed[{threat, severity, mitigation}], competitor_mapping {estimated_density, competition_level, key_competitors_type[], differentiation_strategy}, product_market_value {suggested_price_range, regional_purchasing_power_note, pricing_strategy}, action_roadmap[], cultural_local_note.`;

    let narrative = await callGeminiAI(promptText);
    const ai_used = !!narrative;
    if (!narrative) narrative = narrativeFallback(input, fin, rev, viability, recommendation);

    // Ensure revenue-potential numbers stay consistent with engine
    narrative.product_market_value = {
      ...(narrative.product_market_value || {}),
      monthly_revenue_potential_low: r0(rev.monthly_revenue * 0.8),
      monthly_revenue_potential_high: r0(rev.monthly_revenue * 1.25),
    };

    const feasibility = {
      ...narrative,
      viability_score: viability.score,
      viability_label: viability.label,
      recommendation,
      revenue_model: rev,
      government_schemes: schemes,
      government_support: {
        required_documents: ['Aadhaar Card', 'PAN Card', 'Passport-size photographs', 'Bank account passbook', 'Project report / DPR', 'Proof of business address', 'Caste / category certificate (for subsidy)', 'Quotations for machinery & materials'],
        subsidies: [
          `${fin.scheme_name}: concessional interest at ${fin.interest_rate}% p.a.`,
          'PMEGP margin-money subsidy: 15%–35% (higher for SC/ST/women/rural)',
          'CGTMSE: collateral-free credit guarantee up to 85%',
        ],
        notes: 'Apply through your nearest bank branch, District Industries Centre (DIC) or the scheme portal. Udyam (MSME) registration is free and speeds up approval.',
      },
      vendors,
      supply_chain,
      ai_used,
    };

    const result = {
      id: uuidv4(),
      input,
      feasibility,
      financials: fin,
      generated_at: new Date().toISOString(),
    };

    if (req.user) {
      await db.collection('reports').insertOne({ ...result, user_id: req.user.id });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

app.get('/api/reports', authenticateToken, async (req, res) => {
  const list = await db.collection('reports')
    .find({ user_id: req.user.id }, { projection: { _id: 0 } })
    .sort({ generated_at: -1 }).toArray();
  res.json(list);
});

app.get('/api/reports/:id', authenticateToken, async (req, res) => {
  const report = await db.collection('reports').findOne({ id: req.params.id, user_id: req.user.id }, { projection: { _id: 0 } });
  if (!report) return res.status(404).json({ detail: 'Report not found' });
  res.json(report);
});

app.delete('/api/reports/:id', authenticateToken, async (req, res) => {
  const del = await db.collection('reports').deleteOne({ id: req.params.id, user_id: req.user.id });
  if (del.deletedCount === 0) return res.status(404).json({ detail: 'Report not found' });
  res.json({ ok: true });
});

// ---------- Community Shops (crowdsourced local directory + points) ----------
app.post('/api/shops', authenticateToken, async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.shop_name || !b.category) return res.status(400).json({ detail: 'Shop name and category are required' });
    const hasPhoto = typeof b.photo === 'string' && b.photo.startsWith('data:image');
    const hasContact = !!(b.contact && String(b.contact).trim());

    let earned = POINTS.SHOP_DETAILS;
    if (hasPhoto) earned += POINTS.SHOP_PHOTO;
    if (hasContact) earned += POINTS.SHOP_CONTACT;

    const shop = {
      id: uuidv4(),
      user_id: req.user.id,
      contributor_name: req.user.name,
      shop_name: b.shop_name,
      category: b.category,
      supplies: b.supplies || '',
      price_info: b.price_info || '',
      contact: b.contact || '',
      address: b.address || '',
      state: b.state || '', district: b.district || '', block: b.block || '', village: b.village || '',
      photo: hasPhoto ? b.photo : '',
      upvoters: [],
      upvotes: 0,
      points_earned: earned,
      created_at: new Date().toISOString(),
    };
    await db.collection('shops').insertOne(shop);
    await db.collection('users').updateOne({ id: req.user.id }, { $inc: { points: earned } });
    const user = await db.collection('users').findOne({ id: req.user.id });
    const { _id, ...clean } = shop;
    res.json({ shop: clean, points_earned: earned, total_points: user.points || 0 });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

app.get('/api/shops', optionalToken, async (req, res) => {
  const q = {};
  if (req.query.state) q.state = req.query.state;
  if (req.query.district) q.district = req.query.district;
  if (req.query.category) q.category = req.query.category;
  const list = await db.collection('shops').find(q, { projection: { _id: 0 } }).sort({ upvotes: -1, created_at: -1 }).limit(200).toArray();
  const uid = req.user ? req.user.id : null;
  res.json(list.map((s) => ({ ...s, upvoters: undefined, upvoted_by_me: uid ? (s.upvoters || []).includes(uid) : false })));
});

app.post('/api/shops/:id/upvote', authenticateToken, async (req, res) => {
  const shop = await db.collection('shops').findOne({ id: req.params.id });
  if (!shop) return res.status(404).json({ detail: 'Shop not found' });
  const already = (shop.upvoters || []).includes(req.user.id);
  if (shop.user_id === req.user.id) return res.status(400).json({ detail: 'You cannot upvote your own contribution' });

  if (already) {
    await db.collection('shops').updateOne({ id: shop.id }, { $pull: { upvoters: req.user.id }, $inc: { upvotes: -1 } });
    await db.collection('users').updateOne({ id: shop.user_id }, { $inc: { points: -POINTS.UPVOTE_RECEIVED } });
  } else {
    await db.collection('shops').updateOne({ id: shop.id }, { $addToSet: { upvoters: req.user.id }, $inc: { upvotes: 1 } });
    await db.collection('users').updateOne({ id: shop.user_id }, { $inc: { points: POINTS.UPVOTE_RECEIVED } });
  }
  const updated = await db.collection('shops').findOne({ id: shop.id });
  res.json({ upvotes: updated.upvotes, upvoted_by_me: !already });
});

app.get('/api/leaderboard', async (req, res) => {
  const top = await db.collection('users').find({}, { projection: { _id: 0, name: 1, points: 1 } }).sort({ points: -1 }).limit(20).toArray();
  res.json(top.map((u, i) => ({ rank: i + 1, name: u.name, points: u.points || 0 })));
});

// ---------- Serve React (Vite) build ----------
const path = require('path');
const fs = require('fs');
const frontendBuildPath = path.join(__dirname, '../frontend/build');
app.use(express.static(frontendBuildPath));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ detail: 'API route not found' });
  const indexPath = path.join(frontendBuildPath, 'index.html');
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  res.json({ message: 'Grameen Udyog AI Advisory API (Node.js/Express)', status: 'live' });
});

initDb()
  .then(() => app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Express server running on http://0.0.0.0:${PORT}`)))
  .catch((err) => { console.error('❌ Failed to start:', err); process.exit(1); });
