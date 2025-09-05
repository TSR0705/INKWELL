require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Route imports
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');

const app = express();
const PORT = process.env.PORT || 5000;

// =======================
// MIDDLEWARE
// =======================
app.use(cors());
app.use(express.json()); // Parse JSON bodies

// =======================
// ROUTES
// =======================

// Auth routes: signup, login, forgot/reset password
app.use('/api/auth', authRoutes);

// Protected routes (require JWT)
app.use('/api/protected', protectedRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('✅ Inkwell API Running');
});

// =======================
// DATABASE CONNECTION & SERVER START
// =======================
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err);
  });
