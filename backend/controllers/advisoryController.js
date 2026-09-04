const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../config/db');
const {
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
} = require('../utils/calculator');

async function computeCalculator(req, res) {
  try {
    const {
      margin_capital,
      frequency,
      business_category,
      advisory_type,
      expansion_type,
      applicant_category,
      loan_mode,
      requested_loan,
      tenure_years,
    } = req.body || {};

    const fin = computeScheme(margin_capital, {
      frequency,
      business_category,
      loan_mode,
      requested_loan,
      tenure_years,
      applicant_category,
    });

    const adequacy = business_category
      ? computeCapitalAdequacy({ business_category, margin_capital, advisory_type, applicant_category }, fin)
      : null;
    const expansion = (advisory_type === 'expansion' && business_category)
      ? computeExpansionModel({ business_category, margin_capital, expansion_type, applicant_category }, fin)
      : null;

    res.json({ ...fin, capital_adequacy: adequacy, expansion_model: expansion });
  } catch (err) {
    res.status(400).json({ detail: err.message });
  }
}

async function generateReport(req, res) {
  try {
    const input = req.body || {};
    if (!input.state || !input.district || !input.village || !input.business_category || !input.margin_capital) {
      return res.status(400).json({ detail: 'State, district, village, business category and margin capital are required' });
    }

    const fin = computeScheme(input.margin_capital, {
      frequency: input.repayment_frequency,
      business_category: input.business_category,
      loan_mode: input.loan_mode,
      requested_loan: input.requested_loan,
      tenure_years: input.tenure_years,
      applicant_category: input.applicant_category,
    });
    const capitalAdequacy = computeCapitalAdequacy(input, fin);
    const expansionModel = input.advisory_type === 'expansion' ? computeExpansionModel(input, fin) : null;
    const rev = computeRevenueModel(input, fin);
    const viability = computeViability(input, fin, rev);
    const rec = computeRecommendation(input, fin, rev, viability, capitalAdequacy, expansionModel);
    const schemes = governmentSchemes(fin, input, capitalAdequacy, expansionModel);
    const vendors = buildVendors(input, fin);
    const supplyChain = buildSupplyChain(input, vendors);
    const narrative = narrativeFallback(input, fin, rev, viability, rec, capitalAdequacy, expansionModel);

    const report = {
      id: uuidv4(),
      user_id: req.user ? req.user.id : null,
      created_at: new Date().toISOString(),
      advisory_type: input.advisory_type || 'new',
      input_params: {
        advisory_type: input.advisory_type || 'new',
        expansion_type: input.expansion_type || 'machinery',
        applicant_category: input.applicant_category || 'general',
        current_scale: input.current_scale || 'small',
        loan_mode: input.loan_mode || 'growth',
        tenure_years: input.tenure_years || (fin.tenure_years || 7),
        state: input.state,
        district: input.district,
        block: input.block || '',
        village: input.village,
        business_category: input.business_category,
        margin_capital: Number(input.margin_capital),
        repayment_frequency: input.repayment_frequency || 'monthly',
      },
      capital_adequacy: capitalAdequacy,
      expansion_model: expansionModel,
      financial_model: fin,
      revenue_model: rev,
      viability,
      recommendation: rec,
      is_proposed_enterprise: viability.is_proposed_enterprise,
      proposed_enterprise: narrative.proposed_enterprise,
      government_schemes: schemes,
      nearby_vendors: vendors,
      supply_chain_map: supplyChain,
      narrative,
      ai_source: 'Deterministic AI Engine (Server-side Verified)',
    };

    const db = getDB();
    await db.collection('reports').insertOne(report);
    res.json(report);
  } catch (err) {
    res.status(400).json({ detail: err.message });
  }
}

async function getReports(req, res) {
  try {
    const db = getDB();
    const list = await db.collection('reports')
      .find({ user_id: req.user.id })
      .sort({ created_at: -1 })
      .limit(50)
      .toArray();

    res.json(list.map((r) => ({
      id: r.id,
      created_at: r.created_at,
      advisory_type: r.advisory_type || r.input_params?.advisory_type || 'new',
      capital_adequacy: r.capital_adequacy,
      expansion_model: r.expansion_model,
      input_params: r.input_params,
      recommendation: r.recommendation,
      financial_model: {
        project_cost: r.financial_model?.project_cost,
        approved_loan: r.financial_model?.approved_loan,
        emi: r.financial_model?.emi,
      },
    })));
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
}

async function getReportById(req, res) {
  try {
    const db = getDB();
    const report = await db.collection('reports').findOne({ id: req.params.id, user_id: req.user.id });
    if (!report) return res.status(404).json({ detail: 'Report not found' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
}

async function deleteReport(req, res) {
  try {
    const db = getDB();
    const result = await db.collection('reports').deleteOne({ id: req.params.id, user_id: req.user.id });
    if (result.deletedCount === 0) return res.status(404).json({ detail: 'Report not found' });
    res.json({ status: 'deleted' });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
}

module.exports = {
  computeCalculator,
  generateReport,
  getReports,
  getReportById,
  deleteReport,
};
