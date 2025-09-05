const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware: verify token and attach user to request
const authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Access Denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach full user object to request (optional, for convenience)
    const user = await User.findById(decoded.id).select('-password -otpHash -otpExpires');
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = { authenticate };
