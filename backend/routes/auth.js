const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const sendOTPEmail = require('../utils/sendOTPEmail');

const JWT_SECRET = process.env.JWT_SECRET;

// ✅ Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Password strength check
const isStrongPassword = (pwd) => {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  return re.test(pwd);
};

/* ------------------------------------------------
   SIGNUP - Create user & send OTP
--------------------------------------------------*/
router.post('/signup', async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Full name, email, and password are required' });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      message: 'Password weak. Must be >=8 chars and include upper, lower, digit, and special char.',
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });

    const user = new User({ fullName, email, password });

    // Generate OTP for verification
    const otp = generateOTP();
    user.otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save();

    await sendOTPEmail(email, otp);
    console.log(`Signup OTP for ${email}: ${otp}`);

    res.status(201).json({ message: 'User created. Verify OTP sent to your email.', userId: user._id });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

/* ------------------------------------------------
   VERIFY OTP - Complete Signup
--------------------------------------------------*/
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    if (!user.otpHash || hashedOtp !== user.otpHash || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.otpHash = null;
    user.otpExpires = null;
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user._id, fullName: user.fullName, email: user.email } });
  } catch (err) {
    console.error('OTP Verification Error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

/* ------------------------------------------------
   LOGIN
--------------------------------------------------*/
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, fullName: user.fullName, email: user.email } });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

/* ------------------------------------------------
   FORGOT PASSWORD - Send OTP
--------------------------------------------------*/
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'No user with this email' });

    const otp = generateOTP();
    user.otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save();

    await sendOTPEmail(email, otp);
    console.log(`Password reset OTP for ${email}: ${otp}`);

    res.status(200).json({ message: 'OTP sent to your email for password reset' });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

/* ------------------------------------------------
   RESET PASSWORD - Verify OTP and Update Password
--------------------------------------------------*/
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword)
    return res.status(400).json({ message: 'Email, OTP, and new password are required' });

  if (!isStrongPassword(newPassword))
    return res.status(400).json({ message: 'Password weak. Must follow policy.' });

  try {
    const user = await User.findOne({ email });
    if (!user || !user.otpHash || !user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    if (hashedOtp !== user.otpHash) return res.status(400).json({ message: 'Incorrect OTP' });

    user.password = newPassword; // will be hashed in pre-save
    user.otpHash = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
