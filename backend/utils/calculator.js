const https = require('https');
const { getProfile, STATE_PPP, PACKAGING, VENDOR_SURNAMES, VENDOR_FIRST, getSupply, EXPANSION_TYPES, CATEGORY_PROFILE } = require('../constants/businessData');

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

function computeCapitalAdequacy(input, fin) {
  const profile = getProfile(input.business_category);
  const minRequiredMargin = profile.minMargin || 10000;
  const minProjectCost = profile.minProjectCost || 100000;
  const recommendedProjectCost = profile.recommendedCost || 300000;
  const recommendedMargin = profile.recommendedMargin || Math.round(recommendedProjectCost * MARGIN_RATIO);
  const providedMargin = Number(input.margin_capital || (fin && fin.margin_capital) || 0);

  const isEnough = providedMargin >= minRequiredMargin;
  const shortfall = isEnough ? 0 : Math.max(0, Math.round(minRequiredMargin - providedMargin));
  const surplus = isEnough ? Math.max(0, Math.round(providedMargin - minRequiredMargin)) : 0;
  const adequacyRatio = minRequiredMargin > 0 ? r2(providedMargin / minRequiredMargin) : 1;

  let status = isEnough ? 'sufficient' : 'insufficient';
  let badgeText = isEnough ? 'Capital is Sufficient' : 'Capital Shortfall';
  let badgeText_hi = isEnough ? 'पूंजी पर्याप्त है' : 'पूंजी में कमी';
  let message = '';
  let advice = '';

  if (providedMargin >= recommendedMargin) {
    status = 'sufficient';
    badgeText = 'Capital is Sufficient';
    badgeText_hi = 'पूंजी पूरी तरह पर्याप्त एवं सुरक्षित है';
    message = `Your available margin capital of ₹${providedMargin.toLocaleString('en-IN')} comfortably exceeds the minimum requirement of ₹${minRequiredMargin.toLocaleString('en-IN')} for ${input.business_category}.`;
    advice = `You have strong financial cushioning to procure quality equipment, build solid starting inventory, and absorb the initial months without cash crunch.`;
  } else if (isEnough) {
    status = 'sufficient';
    badgeText = 'Capital is Sufficient';
    badgeText_hi = 'पूंजी व्यवसाय शुरू करने के लिए पर्याप्त है';
    message = `Your available margin capital of ₹${providedMargin.toLocaleString('en-IN')} meets the required threshold (min: ₹${minRequiredMargin.toLocaleString('en-IN')}) to launch ${input.business_category}.`;
    advice = `Your equity is viable for bank loan processing under PMEGP/Mudra. To maximize financial safety, maintain tight control over inventory and customer credit.`;
  } else {
    status = 'insufficient';
    badgeText = 'Capital Shortfall';
    badgeText_hi = 'पूंजी आवश्यकता से कम है';
    message = `Your available margin capital of ₹${providedMargin.toLocaleString('en-IN')} is short by ₹${shortfall.toLocaleString('en-IN')} against the minimum required margin of ₹${minRequiredMargin.toLocaleString('en-IN')} for ${input.business_category}.`;
    advice = `To start comfortably, arrange an additional ₹${shortfall.toLocaleString('en-IN')} or apply under PMEGP Special Category (Women/SC/ST/OBC/Rural) where the 35% margin money subsidy significantly cuts your required personal investment.`;
  }

  const adequacyRatio = minRequiredMargin > 0 ? r2(providedMargin / minRequiredMargin) : 1;
  const minLoanRequired = Math.max(0, Math.round(minProjectCost - providedMargin));
  const isLoanEligible = isEnough;
  const loanEligibilityText = isEnough ? 'Eligible for Bank Loan' : 'Ineligible — Margin Shortfall';
  const loanEligibilityText_hi = isEnough ? 'बैंक ऋण के लिए पात्र' : 'अपात्र — न्यूनतम मार्जिन में कमी';

  return {
    is_enough: isEnough,
    status,
    badge_text: badgeText,
    badge_text_hi: badgeText_hi,
    provided_margin: providedMargin,
    min_required_margin: minRequiredMargin,
    recommended_margin: recommendedMargin,
    min_project_cost: minProjectCost,
    recommended_project_cost: recommendedProjectCost,
    min_loan_required: minLoanRequired,
    is_loan_eligible: isLoanEligible,
    loan_eligibility_text: loanEligibilityText,
    loan_eligibility_text_hi: loanEligibilityText_hi,
    shortfall,
    surplus,
    subsidy_est: subsidyEst,
    subsidy_pct: subsidyPct,
    adequacy_ratio: adequacyRatio,
    message,
    advice,
  };
}

function computeExpansionModel(input, fin) {
  const profile = getProfile(input.business_category);
  const expTypeKey = input.expansion_type || 'machinery';
  const expConfig = EXPANSION_TYPES[expTypeKey] || EXPANSION_TYPES.machinery;

  // Scale of baseline enterprise
  let baselineCost = profile.recommendedCost || 300000;
  if (input.current_scale === 'micro') {
    baselineCost = profile.minProjectCost || 150000;
  } else if (input.current_scale === 'medium') {
    baselineCost = Math.round(baselineCost * 1.5);
  }

  // Cost required to execute the chosen expansion
  const expansionProjectCost = Math.max(50000, Math.min(5000000, r0(baselineCost * expConfig.cost_multiplier)));
  const requiredMarginCapital = r0(expansionProjectCost * MARGIN_RATIO); // 10% promoter contribution
  const availableMargin = Number(input.margin_capital || 0);

  const isEnough = availableMargin >= requiredMarginCapital;
  const shortfall = isEnough ? 0 : Math.max(0, requiredMarginCapital - availableMargin);
  const surplus = isEnough ? Math.max(0, availableMargin - requiredMarginCapital) : 0;
  const loanNeeded = r0(expansionProjectCost - availableMargin);

  // Revenue & Profit boost
  const baselineMonthlyRev = r0(baselineCost * profile.turnover);
  const incrementalMonthlyRev = r0(baselineMonthlyRev * expConfig.growth_multiplier);
  const newMonthlyRev = baselineMonthlyRev + incrementalMonthlyRev;
  
  // Profit calculation taking into account margin boost from automation/scale
  const netMarginBasePct = 0.20;
  const newNetMarginPct = netMarginBasePct + (expConfig.margin_boost / 100);
  const incrementalMonthlyProfit = r0(incrementalMonthlyRev * newNetMarginPct);
  const paybackMonths = Math.ceil(expansionProjectCost / Math.max(incrementalMonthlyProfit, 1500));
  const expansionRoiAnnual = r2(((incrementalMonthlyProfit * 12) / expansionProjectCost) * 100);

  return {
    is_expansion: true,
    expansion_type: expTypeKey,
    expansion_name: expConfig.name,
    expansion_name_hi: expConfig.name_hi,
    expansion_description: expConfig.description,
    expansion_project_cost: expansionProjectCost,
    required_margin_capital: requiredMarginCapital,
    available_margin: availableMargin,
    is_enough: isEnough,
    shortfall,
    surplus,
    loan_needed: loanNeeded,
    baseline_monthly_revenue: baselineMonthlyRev,
    incremental_monthly_revenue: incrementalMonthlyRev,
    projected_new_monthly_revenue: newMonthlyRev,
    incremental_monthly_profit: incrementalMonthlyProfit,
    payback_months: paybackMonths,
    expansion_roi_annual: expansionRoiAnnual,
    growth_percentage: Math.round(expConfig.growth_multiplier * 100),
  };
}

function computeScheme(marginCapital, opts = {}) {
  const frequency = opts.frequency === 'monthly' ? 'monthly' : 'quarterly';
  marginCapital = Number(marginCapital);
  if (!Number.isFinite(marginCapital) || marginCapital <= 0) {
    throw new Error('Margin capital must be a positive number');
  }
  if (marginCapital < 5000) {
    throw new Error('Minimum margin capital is ₹5,000');
  }

  const category = opts.business_category || 'Retail Kirana Store';
  const profile = getProfile(category);
  const minProjectCost = profile.minProjectCost || 200000;

  // Baseline standard 10:90 model
  const growthProjectCost = Math.max(minProjectCost, r2(marginCapital / MARGIN_RATIO));
  const growthLoanNeeded = r2(growthProjectCost - marginCapital);

  // Lean Loan model ("Kaam Ka Loan" / Minimum Debt Needed)
  const leanProjectCost = minProjectCost;
  const leanLoanNeeded = Math.max(0, r0(minProjectCost - marginCapital));

  const loanMode = opts.loan_mode || 'growth';
  let projectCost = growthProjectCost;
  let loanNeeded = growthLoanNeeded;

  if (loanMode === 'lean') {
    projectCost = leanProjectCost;
    loanNeeded = leanLoanNeeded;
  } else if (loanMode === 'custom' && Number(opts.requested_loan) >= 0) {
    const customLoan = Number(opts.requested_loan);
    projectCost = marginCapital + customLoan;
    loanNeeded = customLoan;
  }

  let scheme, schemeCode, interest, maxLoan;
  if (projectCost <= MICRO_LIMIT) {
    scheme = 'Micro Finance Scheme';
    schemeCode = 'MICRO';
    interest = 6.5;
    maxLoan = MICRO_MAX_LOAN;
  } else {
    scheme = 'Term Loan Scheme';
    schemeCode = 'TERM';
    interest = 8.0;
    maxLoan = TERM_MAX_LOAN;
  }

  let tenureYears = opts.tenure_years ? Number(opts.tenure_years) : (projectCost <= MICRO_LIMIT ? 3 : 7);
  if (![3, 5, 7].includes(tenureYears)) tenureYears = projectCost <= MICRO_LIMIT ? 3 : 7;
  const tenureMonths = tenureYears * 12;
  const moratoriumMonths = projectCost <= MICRO_LIMIT ? 3 : 6;

  const approvedLoan = r2(Math.min(loanNeeded, maxLoan));
  const cappedByMax = loanNeeded > maxLoan;
  const shortfall = cappedByMax ? r2(loanNeeded - maxLoan) : 0;
  const withinLimit = projectCost <= TERM_LIMIT;
  const eligible = withinLimit && (approvedLoan > 0 || (loanMode === 'lean' && loanNeeded === 0));

  const rMonthly = interest / 100 / 12;
  const repaymentMonths = tenureMonths - moratoriumMonths;
  const moratoriumInterest = approvedLoan > 0 ? r2(approvedLoan * rMonthly * moratoriumMonths) : 0;

  let emiMonthly = 0;
  if (approvedLoan > 0 && repaymentMonths > 0) {
    emiMonthly = r2(
      (approvedLoan * rMonthly * Math.pow(1 + rMonthly, repaymentMonths)) /
      (Math.pow(1 + rMonthly, repaymentMonths) - 1)
    );
  }

  // Growth loan benchmark to calculate interest savings
  const growthApprovedLoan = Math.min(growthLoanNeeded, maxLoan);
  const growthRepayMonths = (7 * 12) - 6;
  const growthRMonthly = 8.0 / 100 / 12;
  const growthEmi = growthApprovedLoan > 0 ? r2((growthApprovedLoan * growthRMonthly * Math.pow(1 + growthRMonthly, growthRepayMonths)) / (Math.pow(1 + growthRMonthly, growthRepayMonths) - 1)) : 0;
  const growthTotalInterest = growthApprovedLoan > 0 ? r2((growthEmi * growthRepayMonths) - growthApprovedLoan) : 0;

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

  const emiInterestTotal = approvedLoan > 0 ? r2(monthly.reduce((s, x) => s + x.interest, 0)) : 0;
  const totalInterest = r2(emiInterestTotal + moratoriumInterest);
  const totalPayable = r2(approvedLoan + totalInterest);
  const quarterlyInstalment = r2(emiMonthly * 3);

  const interestSaved = Math.max(0, r0(growthTotalInterest - totalInterest));
  const emiSavedMonthly = Math.max(0, r0(growthEmi - emiMonthly));

  // Affordability metrics
  const monthlyRevenueEst = r0(projectCost * profile.turnover);
  const operatingCostEst = r0(monthlyRevenueEst * (profile.raw + profile.labor + profile.inv + profile.opex + profile.other));
  const grossProfitEst = Math.max(0, monthlyRevenueEst - operatingCostEst);
  const netProfitAfterEmi = grossProfitEst - emiMonthly;
  const emiRatio = grossProfitEst > 0 ? r2((emiMonthly / grossProfitEst) * 100) : 100;

  let affordabilityStatus = 'safe';
  let affordabilityBadge = 'Safe & Easily Payable';
  let affordabilityBadge_hi = 'सुरक्षित — आसानी से चुकाने योग्य';
  if (emiRatio > 55) {
    affordabilityStatus = 'heavy';
    affordabilityBadge = 'Heavy Debt Burden';
    affordabilityBadge_hi = 'भारी कर्ज भार (कम लोन लेने की सलाह)';
  } else if (emiRatio > 35) {
    affordabilityStatus = 'moderate';
    affordabilityBadge = 'Moderate Burden';
    affordabilityBadge_hi = 'मध्यम भार (खर्चों पर नजर रखें)';
  }

  return {
    margin_capital: r2(marginCapital),
    project_cost: projectCost,
    loan_needed: loanNeeded,
    approved_loan: approvedLoan,
    loan_mode: loanMode,
    lean_loan_needed: leanLoanNeeded,
    lean_project_cost: leanProjectCost,
    growth_loan_needed: growthLoanNeeded,
    growth_project_cost: growthProjectCost,
    interest_saved: interestSaved,
    emi_saved_monthly: emiSavedMonthly,
    scheme_name: scheme,
    scheme_code: schemeCode,
    interest_rate: interest,
    repayment_frequency: frequency,
    tenure_months: tenureMonths,
    tenure_years: tenureYears,
    moratorium_months: moratoriumMonths,
    moratorium_interest: moratoriumInterest,
    max_loan_cap: maxLoan,
    emi: emiMonthly,
    emi_monthly: emiMonthly,
    quarterly_instalment: quarterlyInstalment,
    repayment_months: repaymentMonths,
    total_payable: totalPayable,
    total_interest: totalInterest,
    affordability: {
      status: affordabilityStatus,
      badge: affordabilityBadge,
      badge_hi: affordabilityBadge_hi,
      estimated_turnover_monthly: monthlyRevenueEst,
      estimated_gross_profit_monthly: grossProfitEst,
      net_profit_after_emi: netProfitAfterEmi,
      emi_to_profit_ratio: emiRatio,
    },
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

function computeRecommendation(input, fin, rev, viability, capitalAdequacy, expansionModel) {
  const s = viability.score;
  const net = rev.net_profit_monthly;
  const isExpansion = input.advisory_type === 'expansion';
  let verdict, tone, headline, rationale, suggested_capital = null, long_term_outlook;

  if (isExpansion && expansionModel) {
    if (expansionModel.is_enough) {
      verdict = 'Expansion Recommended';
      tone = 'positive';
      headline = `Your capital of ₹${expansionModel.available_margin.toLocaleString('en-IN')} is sufficient to expand via ${expansionModel.expansion_name}.`;
      rationale = `Requires ₹${expansionModel.required_margin_capital.toLocaleString('en-IN')} margin for a ₹${expansionModel.expansion_project_cost.toLocaleString('en-IN')} expansion project. Projected revenue increase is +${expansionModel.growth_percentage}% (~₹${expansionModel.incremental_monthly_profit.toLocaleString('en-IN')}/month extra profit).`;
      long_term_outlook = `Investment recovers in ~${expansionModel.payback_months} months with an attractive ${expansionModel.expansion_roi_annual}% annual ROI. Eligible for PMEGP 2nd Loan / MUDRA Tarun upgradation subsidies.`;
    } else {
      verdict = 'Capital Shortfall for Expansion';
      tone = 'caution';
      headline = `Additional ₹${expansionModel.shortfall.toLocaleString('en-IN')} capital needed to execute this ${expansionModel.expansion_name}.`;
      rationale = `Total expansion requires ₹${expansionModel.expansion_project_cost.toLocaleString('en-IN')} (margin needed: ₹${expansionModel.required_margin_capital.toLocaleString('en-IN')}). You currently have ₹${expansionModel.available_margin.toLocaleString('en-IN')}.`;
      suggested_capital = expansionModel.required_margin_capital;
      long_term_outlook = `Bridge the ₹${expansionModel.shortfall.toLocaleString('en-IN')} gap using PMEGP 2nd Loan capital subsidy (15% grant) or start with a lower-cost inventory boost.`;
    }
  } else if (capitalAdequacy && !capitalAdequacy.is_enough) {
    verdict = 'Capital Shortfall — Additional Funds Required';
    tone = 'warn';
    headline = `Your capital (₹${fin.margin_capital.toLocaleString('en-IN')}) is ₹${capitalAdequacy.shortfall.toLocaleString('en-IN')} short of the minimum ₹${capitalAdequacy.min_required_margin.toLocaleString('en-IN')} required for ${input.business_category}.`;
    rationale = `Starting below minimum scale risks working-capital dry-up and debt service stress. A ₹${capitalAdequacy.min_required_margin.toLocaleString('en-IN')} margin allows a ₹${capitalAdequacy.min_project_cost.toLocaleString('en-IN')} baseline setup.`;
    suggested_capital = capitalAdequacy.min_required_margin;
    long_term_outlook = `Apply under PMEGP Special Category (Women/SC/ST/OBC/Rural) to unlock up to 35% margin money subsidy, which minimizes out-of-pocket investment.`;
  } else if (s >= 72 && net > 0 && !fin.capped_by_max) {
    verdict = 'Recommended & Capital Sufficient';
    tone = 'positive';
    headline = `Your capital of ₹${fin.margin_capital.toLocaleString('en-IN')} is fully sufficient to start ${input.business_category} — strong potential.`;
    rationale = `Healthy local demand, ${rev.net_margin_pct}% net margin, and projected ₹${net.toLocaleString('en-IN')}/month profit with ~${rev.roi_annual_pct}% annual ROI.`;
    long_term_outlook = `Break-even in ~${rev.break_even_months} months. Reinvesting surplus funds can support expansion within 2 years.`;
  } else if (s >= 60 && net > 0) {
    verdict = 'Proceed with Caution';
    tone = 'caution';
    headline = `Capital is adequate at ₹${fin.margin_capital.toLocaleString('en-IN')}, but keep tight control over initial operational costs.`;
    rationale = `Profit is positive (₹${net.toLocaleString('en-IN')}/month), but margins require strict cost control for raw materials.`;
    suggested_capital = capitalAdequacy ? capitalAdequacy.recommended_margin : null;
    long_term_outlook = `Stepping up margin to ₹${(capitalAdequacy?.recommended_margin || fin.margin_capital * 1.5).toLocaleString('en-IN')} creates a safer cushion.`;
  } else {
    verdict = 'Improve Capital / Plan';
    tone = 'negative';
    headline = `Capital scale at ₹${fin.margin_capital.toLocaleString('en-IN')} leaves narrow margin for safety in this locality.`;
    rationale = fin.capped_by_max
      ? `Loan requested exceeds maximum scheme cap (${fin.max_loan_cap}), creating a funding shortfall.`
      : `Operating buffer is tight. Scaling margin up gives significantly better economic viability.`;
    suggested_capital = capitalAdequacy?.recommended_margin || r0((fin.margin_capital * 1.5) / 1000) * 1000;
    long_term_outlook = `Starting with about ₹${(suggested_capital).toLocaleString('en-IN')} margin unlocks higher scale and reliable profitability.`;
  }

  return { verdict, tone, headline, rationale, suggested_capital, long_term_outlook, viability_score: s };
}

function governmentSchemes(fin, input, capitalAdequacy, expansionModel) {
  const profile = getProfile(input.business_category);
  const isExpansion = input.advisory_type === 'expansion';
  const isSpecial = input.applicant_category === 'special'; // Women, SC, ST, OBC, PH, Rural
  const isFoodProcessing = !!profile.isFoodProcessing || profile.sector === 'food_processing';
  const isLivestock = !!profile.isLivestock || profile.sector === 'livestock';
  const isManufacturing = profile.sector === 'manufacturing';

  const costBasis = isExpansion ? (expansionModel?.expansion_project_cost || fin.project_cost) : fin.project_cost;

  // 1. PMEGP New Unit
  const pmegpRate = isSpecial ? 35 : 25;
  const pmegpMaxProject = isManufacturing ? 5000000 : 2000000;
  const pmegpSubsidyCap = isManufacturing ? (isSpecial ? 1750000 : 1250000) : (isSpecial ? 700000 : 500000);
  const pmegpSubsidy = Math.min(r0(Math.min(costBasis, pmegpMaxProject) * (pmegpRate / 100)), pmegpSubsidyCap);

  // 2. PMEGP 2nd Loan for Upgradation / Expansion
  const pmegpExpRate = 15;
  const pmegpExpMaxProject = isManufacturing ? 10000000 : 2500000;
  const pmegpExpSubsidyCap = isManufacturing ? 1500000 : 375000;
  const pmegpExpSubsidy = Math.min(r0(Math.min(costBasis, pmegpExpMaxProject) * (pmegpExpRate / 100)), pmegpExpSubsidyCap);

  // 3. PMFME (Food Processing)
  const pmfmeSubsidy = Math.min(r0(costBasis * 0.35), 1000000);

  // 4. AHIDF / NLM (Livestock & Dairy)
  const livestockSubsidy = Math.min(r0(costBasis * 0.35), 2500000);

  // 5. MUDRA Interest Subvention benefit
  const mudraInterestSaving = r0(Math.min(costBasis * 0.9, 1000000) * 0.02 * 3);

  const all = [
    {
      code: isExpansion ? 'PMEGP_EXPANSION' : 'PMEGP',
      name: isExpansion
        ? "PMEGP 2nd Loan for Upgradation & Expansion"
        : "Prime Minister's Employment Generation Programme (PMEGP)",
      name_hi: isExpansion
        ? "PMEGP द्वितीय ऋण - मौजूदा इकाई विस्तार एवं आधुनिकीकरण"
        : "प्रधानमंत्री रोजगार सृजन कार्यक्रम (PMEGP)",
      agency: 'KVIC / DIC / Ministry of MSME',
      interest_range: '7% – 10% p.a. (concessional)',
      max_loan: isExpansion ? '₹1 Crore (Mfg) / ₹25 Lakh (Service)' : '₹50 Lakh (Mfg) / ₹20 Lakh (Service)',
      subsidy_rate: isExpansion ? '15% – 20%' : (isSpecial ? '35% (Special / Rural)' : '25% (General / Rural)'),
      exact_subsidy_amount: isExpansion ? pmegpExpSubsidy : pmegpSubsidy,
      exact_subsidy_formatted: `₹${(isExpansion ? pmegpExpSubsidy : pmegpSubsidy).toLocaleString('en-IN')}`,
      subsidy: isExpansion
        ? `15% capital subsidy (₹${pmegpExpSubsidy.toLocaleString('en-IN')}) for expanding existing unit`
        : `${pmegpRate}% margin-money grant (₹${pmegpSubsidy.toLocaleString('en-IN')}) directly credited to bank account`,
      tenure: '3 – 7 years',
      ideal_for: isExpansion ? 'Scaling, modernising machinery & capacity extension' : 'New micro-manufacturing & service enterprises',
      eligibility: isExpansion
        ? 'Existing PMEGP/MUDRA unit with clean repayment history of 3+ years and profitable operation'
        : 'Age 18+, educational criteria for projects >₹10L; no income ceiling',
      required_documents: ['Aadhaar & PAN card', 'Detailed Project Report (DPR)', 'Caste/Category certificate (for 35% subsidy)', 'Rural population certificate', 'Bank account statement (last 6 months)', 'Quotation for machinery/assets'],
      link: 'https://www.kviconline.gov.in/pmegp',
      primary: true,
    },
    {
      code: 'MUDRA',
      name: isExpansion
        ? 'Pradhan Mantri MUDRA Yojana (Tarun / Tarun Plus Expansion)'
        : 'Pradhan Mantri MUDRA Yojana (Shishu / Kishor / Tarun)',
      name_hi: 'प्रधानमंत्री मुद्रा योजना',
      agency: 'MUDRA / Scheduled Commercial Banks / RRBs',
      interest_range: '8.5% – 11.5% p.a.',
      max_loan: isExpansion ? 'Up to ₹20 Lakh (Tarun Plus)' : 'Up to ₹10 Lakh',
      subsidy_rate: '2% Interest Subvention',
      exact_subsidy_amount: mudraInterestSaving,
      exact_subsidy_formatted: `₹${mudraInterestSaving.toLocaleString('en-IN')} (Interest Subvention)`,
      subsidy: `Collateral-free; 2% prompt repayment interest subvention saving ~₹${mudraInterestSaving.toLocaleString('en-IN')}`,
      tenure: '1 – 5 years',
      ideal_for: 'Small trading, kirana, repair, and working capital needs',
      eligibility: 'Any non-farm micro enterprise engaged in income generation',
      required_documents: ['Aadhaar & PAN', 'Business premise proof / Udyam registration', 'Bank statement (6 months)', 'Quotation of machinery/inventory'],
      link: 'https://www.mudra.org.in',
      primary: false,
    },
  ];

  if (isFoodProcessing) {
    all.push({
      code: 'PMFME',
      name: 'PM Formalisation of Micro food processing Enterprises (PMFME)',
      name_hi: 'प्रधानमंत्री सूक्ष्म खाद्य उद्योग उन्नयन योजना (PMFME)',
      agency: 'Ministry of Food Processing Industries (MoFPI) / State Nodal Agency',
      interest_range: '8% – 10% p.a.',
      max_loan: 'Up to ₹1 Crore (Credit-linked)',
      subsidy_rate: '35% Capital Subsidy',
      exact_subsidy_amount: pmfmeSubsidy,
      exact_subsidy_formatted: `₹${pmfmeSubsidy.toLocaleString('en-IN')}`,
      subsidy: `35% credit-linked capital subsidy up to ₹10,00,000 for food processing units`,
      tenure: '5 – 7 years',
      ideal_for: 'Flour mills, dairy products, bakeries, pickle/papad, spice units',
      eligibility: 'Micro food processing enterprises (individual or SHG/FPO)',
      required_documents: ['Udyam Registration', 'DPR for Food Processing', 'Electricity bill of unit', 'Bank statements', 'FSSAI license / application'],
      link: 'https://pmfme.mofpi.gov.in',
      primary: isFoodProcessing && !isExpansion,
    });
  }

  if (isLivestock) {
    all.push({
      code: 'AHIDF',
      name: 'Animal Husbandry Infrastructure Fund (AHIDF) & NLM',
      name_hi: 'पशुपालन अवसंरचना विकास निधि एवं राष्ट्रीय पशुधन मिशन',
      agency: 'Department of Animal Husbandry & Dairying (DAHD) / SIDBI',
      interest_range: '3% Interest Subvention (Effective 5.5% – 7.5% p.a.)',
      max_loan: 'Up to 90% project cost',
      subsidy_rate: '25% – 50% Capital Subsidy / 3% Subvention',
      exact_subsidy_amount: livestockSubsidy,
      exact_subsidy_formatted: `₹${livestockSubsidy.toLocaleString('en-IN')}`,
      subsidy: `Up to 35%–50% capital subsidy (NLM) + 3% interest subvention for 8 years (AHIDF)`,
      tenure: 'Up to 10 years (including 2-year moratorium)',
      ideal_for: 'Dairy processing, chilling units, poultry breeding & goat farming',
      eligibility: 'Farmers, SHGs, private micro-entrepreneurs in dairy/meat/livestock',
      required_documents: ['Aadhaar & PAN', 'Land ownership / lease agreement', 'Techno-economic project feasibility report', 'Veterinary certificate'],
      link: 'https://ahidf.udyamimitra.in',
      primary: isLivestock && !isExpansion,
    });
  }

  all.push(
    {
      code: 'STANDUP',
      name: 'Stand-Up India Scheme',
      name_hi: 'स्टैंड-अप इंडिया योजना',
      agency: 'SIDBI / Scheduled Commercial Banks',
      interest_range: 'MCLR + 3% p.a.',
      max_loan: '₹10 Lakh – ₹1 Crore',
      subsidy_rate: '15% Margin Convergence',
      exact_subsidy_amount: r0(costBasis * 0.15),
      exact_subsidy_formatted: `₹${r0(costBasis * 0.15).toLocaleString('en-IN')}`,
      subsidy: 'Composite term loan + working capital; converges with state subsidies',
      tenure: 'Up to 7 years (18-month moratorium)',
      ideal_for: 'SC, ST and Women entrepreneurs starting greenfield ventures',
      eligibility: 'SC/ST or woman entrepreneur with 51%+ shareholding',
      required_documents: ['Aadhaar, PAN & Caste certificate / proof of woman entrepreneur', 'Project report', 'Premise lease/title', 'Quotations'],
      link: 'https://www.standupmitra.in',
      primary: false,
    },
    {
      code: 'CGTMSE',
      name: 'Credit Guarantee Fund Trust for Micro & Small Enterprises (CGTMSE)',
      name_hi: 'क्रेडिट गारंटी फंड ट्रस्ट (CGTMSE)',
      agency: 'CGTMSE / Scheduled Banks / NBFCs',
      interest_range: 'As per lending bank',
      max_loan: 'Up to ₹5 Crore (100% Collateral-Free)',
      subsidy_rate: 'Up to 85% Guarantee Cover',
      exact_subsidy_amount: r0(costBasis * 0.03),
      exact_subsidy_formatted: 'Collateral-Free (85% Cover)',
      subsidy: 'Zero third-party collateral required; Govt guarantees up to 85% of loan',
      tenure: 'As per bank tenure',
      ideal_for: 'Entrepreneurs lacking land/property for bank collateral',
      eligibility: 'New and existing micro & small manufacturing and service enterprises',
      required_documents: ['Udyam Registration', 'Aadhaar & PAN', 'Project report', 'Bank account statement', 'ITR (if existing)'],
      link: 'https://www.cgtmse.in',
      primary: false,
    }
  );

  if (all.some((s) => s.primary && s.code !== 'PMEGP' && s.code !== 'PMEGP_EXPANSION')) {
    const pmegpItem = all.find((s) => s.code === 'PMEGP' || s.code === 'PMEGP_EXPANSION');
    if (pmegpItem) pmegpItem.primary = false;
  }

  return all.sort((a, b) => (b.primary === true) - (a.primary === true));
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

function narrativeFallback(input, fin, rev, viability, recommendation, capitalAdequacy, expansionModel) {
  const village = input.village || 'the village';
  const district = input.district || 'the district';
  const category = input.business_category || 'business';
  const isExpansion = input.advisory_type === 'expansion';

  let executiveSummary = `${recommendation.headline} ${recommendation.rationale} Anchored in ${village}, ${district}, this ${category} enterprise targets steady local demand with a scheme-backed concessional loan.`;
  if (isExpansion && expansionModel) {
    executiveSummary = `Business Extension Advisory: ${recommendation.headline} With an expansion project cost of ₹${expansionModel.expansion_project_cost.toLocaleString('en-IN')}, this ${category} unit in ${village}, ${district} aims to scale monthly turnover by ~${expansionModel.growth_percentage}% and net profit by ~₹${expansionModel.incremental_monthly_profit.toLocaleString('en-IN')}/month, leveraged by government upgradation subsidies.`;
  } else if (capitalAdequacy && !capitalAdequacy.is_enough) {
    executiveSummary = `Capital Advisory: ${capitalAdequacy.message} Anchored in ${village}, ${district}, raising the margin to the ₹${capitalAdequacy.min_required_margin.toLocaleString('en-IN')} benchmark ensures smooth debt servicing and sustainable operations.`;
  }

  const roadmap = isExpansion && expansionModel
    ? [
        `Apply for PMEGP 2nd Loan / MUDRA Tarun expansion funding of ₹${expansionModel.loan_needed.toLocaleString('en-IN')}`,
        `Procure upgrade equipment for ${expansionModel.expansion_name}`,
        'Install upgraded tooling / expand inventory stock at premises',
        `Roll out enhanced service/products to 10+ neighbouring villages in ${district}`,
        `Monitor capacity utilisation to achieve targeted payback in ~${expansionModel.payback_months} months`,
      ]
    : [
        `Secure scheme approval for a ₹${fin.approved_loan.toLocaleString('en-IN')} loan under ${fin.scheme_name}`,
        `Set up the unit in ${village} and complete Udyam registration`,
        'Procure machinery and first raw-material stock from listed vendors',
        `Run launch outreach across 5 neighbouring villages in ${district}`,
        'Begin commercial production and lock in retail channels',
      ];

  return {
    executive_summary: executiveSummary,
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
    action_roadmap: roadmap,
    cultural_local_note: `Locally-made goods enjoy strong trust in ${district}, aiding early adoption.`,
  };
}

module.exports = {
  seeded,
  r2,
  r0,
  computeScheme,
  computeCapitalAdequacy,
  computeExpansionModel,
  computeRevenueModel,
  computeViability,
  computeRecommendation,
  governmentSchemes,
  buildVendors,
  buildSupplyChain,
  narrativeFallback,
};
