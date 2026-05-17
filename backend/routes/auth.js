const express = require('express');
const router  = express.Router();
const {
  register, login, getMe, updateProfile,
  forgotPassword, resetPassword, changePassword,
  createReviewer, inviteReviewer, reviewerAccess, acceptInvite,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register',         register);
router.post('/login',            login);
router.get('/me',        protect, getMe);
router.put('/profile',   protect, updateProfile);
router.post('/change-password', protect, changePassword);

router.post('/forgot-password',  forgotPassword);
router.post('/reset-password',   resetPassword);

router.post('/create-reviewer',  protect, createReviewer);
router.post('/invite-reviewer',  protect, inviteReviewer);
router.post('/reviewer-access',  reviewerAccess);
router.post('/accept-invite',    acceptInvite);

module.exports = router;
