const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    next();
  } catch {
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: admins only' });
  }
  next();
};

const residentOnly = (req, res, next) => {
  if (req.user.role !== 'resident') {
    return res.status(403).json({ message: 'Access denied: residents only' });
  }
  next();
};

module.exports = { protect, adminOnly, residentOnly };
