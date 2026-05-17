const express = require('express');
const router = express.Router();
const {
  createReport,
  updateReport,
  submitReport,
  getMyReports,
  getMyReport,
  getMyDashboard,
  deleteReport,
  getAllReports,
  getReport,
  reviewReport,
} = require('../controllers/reportController');
const { protect, adminOnly, adminOrReviewer, residentOnly } = require('../middleware/auth');

// Resident routes
router.use(protect);
router.get('/my/dashboard', residentOnly, getMyDashboard);
router.get('/my', residentOnly, getMyReports);
router.get('/my/:id', residentOnly, getMyReport);
router.post('/', residentOnly, createReport);
router.put('/:id', residentOnly, updateReport);
router.put('/:id/submit', residentOnly, submitReport);
router.delete('/:id', residentOnly, deleteReport);

// Admin / reviewer read routes
router.get('/', adminOrReviewer, getAllReports);
router.get('/:id', adminOrReviewer, getReport);

// Admin-only write route
router.put('/:id/review', adminOnly, reviewReport);

module.exports = router;
