const https = require('https');
const { getProfile, STATE_PPP, PACKAGING, VENDOR_SURNAMES, VENDOR_FIRST, getSupply } = require('../constants/businessData');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

const r2 = (n) => Math.round(n * 100) / 100;
const r0 = (n) => Math.round(n);

const MICRO_LIMIT = 140000;
const TERM_LIMIT = 5000000;
const MICRO_MAX_LOAN = 125000;
const TERM_MAX_LOAN = 4500000;
const MARGIN_RATIO = 0.10;

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
  const moratoriumInterest = r2(approvedLoan * rMonthly * moratoriumMonths);

  const emiMonthly = r2(
    (approvedLoan * rMonthly * Math.pow(1 + rMonthly, repaymentMonths)) /
    (Math.pow(1 + rMonthly, repaymentMonths) - 1)
  );

  let balance = approvedLoan;
  const monthly = [];
  for (let m = 1; m <= repaymentMonths; m++) {
    const interestPay = balance * rMonthly;
    let principalPay = emiMonthly - interestPay;
    if (m === repaymentMonths) principalPay = balance;
    balance = Math.max(balance - principalPay, 0);
    monthly.push({ month: m, principal: principalPay, interest: interestPay, balance });
  }

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

function computeViability(input, fin, rev) {
  const p = getProfile(input.business_category);
  const nm = rev.net_margin_pct;
  let profitScore;
  if (nm <= 0) profitScore = 12;
  else if (nm < 5) profitScore = 35;
  else if (nm < 10) profitScore = 55;
  else if (nm < 15) profitScore = 70;
  else if (nm < 22) profitScore = 84;
  else profitScore = 92;

  const demandScore = 30 + p.demand * 11;
  const ppp = STATE_PPP[input.state] || 3;
  const locationScore = 40 + ppp * 9;

  const compSeed = seeded((input.village || '') + (input.business_category || '') + (input.district || ''));
  const competitionPenalty = Math.round(compSeed * 16);

  let score = 0.42 * profitScore + 0.33 * demandScore + 0.25 * locationScore;
  score -= competitionPenalty;
  if (fin.capped_by_max) score -= 14;
  if (fin.margin_capital < 20000) score -= 8;
  score += (seeded((input.village || '') + 'jit') * 8 - 4);
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

function pick(arr, seed) { return arr[Math.floor(seed * arr.length) % arr.length]; }

function buildVendors(input, fin) {
  const base = (input.village || '') + (input.business_category || '') + (input.district || '');
  const supply = getSupply(input.business_category);
  const out = [];
  const groups = [
    { type: 'Raw Material', templates: supply.raw, count: 3 },
    { type: 'Machinery / Equipment', templates: supply.machinery, count: 2 },
    { type: 'Packaging', templates: PACKAGING, count: 1 },
  ];
  let idx = 0;
  groups.forEach((g) => {
    g.templates.slice(0, g.count).forEach((tpl, j) => {
      const s = seeded(base + g.type + tpl.item + j);
      const name = `${pick(VENDOR_FIRST, s)} ${pick(VENDOR_SURNAMES, seeded(base + j + g.type))}`;
      const phone = '+91 9' + String(100000000 + Math.floor(seeded(base + tpl.item + idx) * 899999999)).slice(0, 9);
      const distance = r2(1.5 + s * 12);
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
  const supply = getSupply(input.business_category);
  const rawItems = supply.raw.map((r) => r.item);
  const p = getProfile(input.business_category);
  return {
    stages: [
      { key: 'source', title: 'Sourcing', detail: `Procure ${input.business_category} inputs from nearby suppliers`, nodes: rawItems },
      { key: 'produce', title: 'Production', detail: `Process / prepare ${input.business_category}`, nodes: [`${input.village} unit`, ...supply.machinery.slice(0, 1).map((m) => m.item)] },
      { key: 'store', title: 'Storage', detail: 'Hold stock & maintain quality buffer', nodes: ['On-site inventory'] },
      { key: 'distribute', title: 'Distribution', detail: 'Move goods to points of sale', nodes: ['Direct retail', 'Weekly haat', 'Nearby town B2B'] },
      { key: 'customer', title: 'Customers', detail: `Serve local demand (tier ${p.demand}/5)`, nodes: ['Households', 'Retail shops', 'Institutions'] },
    ],
  };
}

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

module.exports = {
  seeded,
  r2,
  r0,
  computeScheme,
  computeRevenueModel,
  computeViability,
  computeRecommendation,
  governmentSchemes,
  buildVendors,
  buildSupplyChain,
  narrativeFallback,
};
