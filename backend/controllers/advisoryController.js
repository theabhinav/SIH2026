const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../config/db');
const {
  computeScheme,
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
    const { margin_capital, frequency } = req.body || {};
    const fin = computeScheme(margin_capital, { frequency });
    res.json(fin);
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

    const fin = computeScheme(input.margin_capital, { frequency: input.repayment_frequency });
    const rev = computeRevenueModel(input, fin);
    const viability = computeViability(input, fin, rev);
    const rec = computeRecommendation(input, fin, rev, viability);
    const schemes = governmentSchemes(fin, input);
    const vendors = buildVendors(input, fin);
    const supplyChain = buildSupplyChain(input, vendors);
    const narrative = narrativeFallback(input, fin, rev, viability, rec);

    const report = {
      id: uuidv4(),
      user_id: req.user ? req.user.id : null,
      created_at: new Date().toISOString(),
      input_params: {
        state: input.state,
        district: input.district,
        block: input.block || '',
        village: input.village,
        business_category: input.business_category,
        margin_capital: Number(input.margin_capital),
        repayment_frequency: input.repayment_frequency || 'monthly',
      },
      financial_model: fin,
      revenue_model: rev,
      viability,
      recommendation: rec,
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
      input_params: r.input_params,
      recommendation: r.recommendation,
      financial_model: {
        project_cost: r.financial_model.project_cost,
        approved_loan: r.financial_model.approved_loan,
        emi: r.financial_model.emi,
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
