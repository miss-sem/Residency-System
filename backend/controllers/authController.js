const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  createdAt: user.createdAt,
});

exports.register = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({ name, email, password, department, role: 'resident' });
    const token = signToken(user._id);
    res.status(201).json({ token, user: formatUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

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
    const { name, department, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (name)       user.name       = name;
    if (department !== undefined) user.department = department;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new password' });
      }
      const valid = await user.comparePassword(currentPassword);
      if (!valid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      user.password = newPassword;
    }

    await user.save();
    res.json({ user: formatUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
