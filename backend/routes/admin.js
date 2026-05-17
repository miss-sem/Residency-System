const express = require('express');
const router = express.Router();
const {
  createResident,
  getAllResidents,
  updateResident,
  deleteResident,
  getDashboardStats,
} = require('../controllers/adminController');
const { protect, adminOnly, adminOrReviewer } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard',      adminOrReviewer, getDashboardStats);
router.get('/residents',      adminOrReviewer, getAllResidents);
router.post('/residents',     adminOnly,       createResident);
router.put('/residents/:id',  adminOnly,       updateResident);
router.delete('/residents/:id', adminOnly,     deleteResident);

module.exports = router;
