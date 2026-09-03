const express = require('express');
const router = express.Router();
const {
  computeCalculator,
  generateReport,
  getReports,
  getReportById,
  deleteReport,
} = require('../controllers/advisoryController');
const { authenticateToken, optionalToken } = require('../middleware/auth');

router.post('/calculator/compute', computeCalculator);
router.post('/feasibility/generate', optionalToken, generateReport);
router.get('/reports', authenticateToken, getReports);
router.get('/reports/:id', authenticateToken, getReportById);
router.delete('/reports/:id', authenticateToken, deleteReport);

module.exports = router;
