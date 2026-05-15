const express = require('express');
const router = express.Router();
const {
  createResident,
  getAllResidents,
  updateResident,
  deleteResident,
  getDashboardStats,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/dashboard', getDashboardStats);
router.post('/residents', createResident);
router.get('/residents', getAllResidents);
router.put('/residents/:id', updateResident);
router.delete('/residents/:id', deleteResident);

module.exports = router;
