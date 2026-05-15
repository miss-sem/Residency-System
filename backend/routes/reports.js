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
const { protect, adminOnly, residentOnly } = require('../middleware/auth');

// Resident routes
router.use(protect);
router.get('/my/dashboard', residentOnly, getMyDashboard);
router.get('/my', residentOnly, getMyReports);
router.get('/my/:id', residentOnly, getMyReport);
router.post('/', residentOnly, createReport);
router.put('/:id', residentOnly, updateReport);
router.put('/:id/submit', residentOnly, submitReport);
router.delete('/:id', residentOnly, deleteReport);

// Admin routes
router.get('/', adminOnly, getAllReports);
router.get('/:id', adminOnly, getReport);
router.put('/:id/review', adminOnly, reviewReport);

module.exports = router;
