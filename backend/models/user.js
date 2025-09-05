const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Password & email validation regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      validate: {
        validator: function (value) {
          // Only validate if creating new or password modified
          if (this.isNew || this.isModified('password')) {
            return PASSWORD_REGEX.test(value);
          }
          return true;
        },
        message:
          'Password must include uppercase, lowercase, number, and symbol',
      },
    },

    // OTP / reset password support
    otpHash: { type: String, default: null },
    otpExpires: { type: Date, default: null },

    // Brute force protection
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },

    // Optional profile enhancements
    profilePic: { type: String, default: null }, // e.g., image URL
    bio: { type: String, maxlength: 300, default: null },
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true }
);

// Virtual field: account is locked?
UserSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12); // stronger salt rounds
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password during login
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Increment login attempts & lock if needed
UserSchema.methods.incrementLoginAttempts = async function () {
  // If previously locked but lock expired, reset
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.loginAttempts = 1;
    this.lockUntil = undefined;
  } else {
    this.loginAttempts += 1;

    // Lock account if too many failed attempts
    if (this.loginAttempts >= 5 && !this.isLocked) {
      this.lockUntil = Date.now() + 30 * 60 * 1000; // 30 min lock
    }
  }
  await this.save();
};

// Generate password reset / verification token
UserSchema.methods.generateResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.otpHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.otpExpires = Date.now() + 10 * 60 * 1000; // valid for 10 min
  return rawToken; // return plain token for email
};

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
