const crypto = require('crypto');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const { sendPasswordReset, sendInvite } = require('../utils/mailer');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const formatUser = (user) => ({
  _id:       user._id,
  name:      user.name,
  email:     user.email,
  role:      user.role,
  createdAt: user.createdAt,
});

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ message: 'An account with this email already exists' });

    const user  = await User.create({ name, email, password, role: 'resident' });
    const token = signToken(user._id);
    res.status(201).json({ token, user: formatUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    const token = signToken(user._id);
    res.json({ token, user: formatUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ user: formatUser(req.user) });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    await user.save();
    res.json({ user: formatUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Current and new password are required' });

    const user = await User.findById(req.user._id).select('+password');
    const valid = await user.comparePassword(currentPassword);
    if (!valid)
      return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    // Always respond 200 — don't reveal if email exists
    if (!user) return res.json({ message: 'If this email exists, a reset link has been sent.' });

    const token   = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken   = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpires = expires;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    try {
      await sendPasswordReset(user.email, resetUrl);
    } catch (_) {
      // If email fails, still return success but log
      console.error('Email send failed:', _);
    }

    res.json({ message: 'If this email exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ message: 'Token and new password are required' });

    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user   = await User.findOne({
      resetPasswordToken:   hashed,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user)
      return res.status(400).json({ message: 'Token is invalid or has expired' });

    user.password             = password;
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createReviewer = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email)
      return res.status(400).json({ message: 'Name and email are required' });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ message: 'A user with this email already exists' });

    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const rawPassword = Array.from({ length: 10 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');

    const user = await User.create({ name, email, password: rawPassword, role: 'reviewer' });

    res.status(201).json({
      message:     'Reviewer account created',
      user:        formatUser(user),
      credentials: { email, password: rawPassword },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.inviteReviewer = async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    let user = await User.findOne({ email });
    if (user && user.role !== 'reviewer')
      return res.status(409).json({ message: 'This email is already registered with a different role' });

    const token   = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 48 * 60 * 60 * 1000; // 48 hours

    if (user) {
      // Existing reviewer — refresh their token and resend
      user.inviteToken   = crypto.createHash('sha256').update(token).digest('hex');
      user.inviteExpires = expires;
      await user.save({ validateBeforeSave: false });
    } else {
      user = await User.create({
        name:          name || 'Reviewer',
        email,
        password:      crypto.randomBytes(16).toString('hex'),
        role:          'reviewer',
        inviteToken:   crypto.createHash('sha256').update(token).digest('hex'),
        inviteExpires: expires,
      });
    }

    const inviteUrl = `${process.env.CLIENT_URL}/reviewer-access?token=${token}`;
    let emailFailed = false;
    try {
      await sendInvite(email, inviteUrl, req.user.name);
    } catch (emailErr) {
      console.error('Invite email failed:', emailErr.message);
      emailFailed = true;
    }

    res.status(201).json({
      message:    emailFailed ? 'Reviewer account created but email failed to send. Check your email service config.' : 'Invitation sent',
      inviteUrl,
      emailFailed,
      user: formatUser(user),
    });
  } catch (err) {
    console.error('[inviteReviewer]', err.message);
    res.status(500).json({ message: err.message || 'Failed to send invitation' });
  }
};

exports.reviewerAccess = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token)
      return res.status(400).json({ message: 'Token is required' });

    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user   = await User.findOne({
      inviteToken:   hashed,
      inviteExpires: { $gt: Date.now() },
    }).select('+inviteToken +inviteExpires');

    if (!user)
      return res.status(400).json({ message: 'Invite link is invalid or has expired' });

    const jwtToken = signToken(user._id);
    res.json({ token: jwtToken, user: formatUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.acceptInvite = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ message: 'Token and password are required' });

    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user   = await User.findOne({
      inviteToken:   hashed,
      inviteExpires: { $gt: Date.now() },
    }).select('+inviteToken +inviteExpires');

    if (!user)
      return res.status(400).json({ message: 'Invite link is invalid or has expired' });

    user.password      = password;
    user.inviteToken   = undefined;
    user.inviteExpires = undefined;
    await user.save();

    const jwtToken = signToken(user._id);
    res.json({ token: jwtToken, user: formatUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
