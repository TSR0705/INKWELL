const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Helper: sign JWT tokens
const signAccessToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });

const signRefreshToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });

// Password strength checker
const isStrongPassword = (pwd) => {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  return re.test(pwd);
};

// ===================== SIGNUP =====================
exports.signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password)
      return res.status(400).json({ message: 'Full name, email, and password are required' });

    if (!isStrongPassword(password))
      return res.status(400).json({
        message:
          'Password weak. Must be >=8 chars and include upper, lower, digit, and special character.',
      });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = new User({ fullName, email, password });
    await user.save();

    // Generate OTP and store hashed
    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
    user.otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save();

    // Send OTP via email (for dev log)
    console.log(`Signup OTP for ${email}: ${otp}`);

    res.status(201).json({ message: 'User created. Verify OTP sent to email.', userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

// ===================== VERIFY OTP =====================
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    if (!user.otpHash || hashedOtp !== user.otpHash || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.otpHash = null;
    user.otpExpires = null;
    await user.save();

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    // Optional: store refreshToken in DB if you want token revocation
    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error verifying OTP' });
  }
};

// ===================== LOGIN =====================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await user.matchPassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    // Optional: store refreshToken in DB if you want token revocation
    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// ===================== REQUEST OTP (Forgot Password) =====================
exports.requestOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
    user.otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save();

    console.log(`Password reset OTP for ${email}: ${otp}`);
    res.json({ message: 'OTP generated and sent (dev log)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error generating OTP' });
  }
};

// ===================== RESET PASSWORD =====================
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: 'Email, OTP, and new password required' });

    if (!isStrongPassword(newPassword))
      return res.status(400).json({ message: 'Password weak. Follow policy.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    if (!user.otpHash || hashedOtp !== user.otpHash || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.password = newPassword; // will be hashed in pre-save
    user.otpHash = null;
    user.otpExpires = null;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};

// ===================== REFRESH TOKEN =====================
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'User not found' });

    const accessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);
    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during token refresh' });
  }
};

// ===================== LOGOUT =====================
exports.logout = async (req, res) => {
  try {
    // For stateless JWT, client can just discard token.
    // Optional: if storing refresh tokens in DB, remove it here.
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during logout' });
  }
};
