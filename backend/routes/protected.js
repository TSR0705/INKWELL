const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');

// ✅ Any authenticated user
router.get('/profile', authenticate, (req, res) => {
  res.json({
    message: `Welcome ${req.user.fullName}`,
    user: {
      id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
    }
  });
});

module.exports = router;
