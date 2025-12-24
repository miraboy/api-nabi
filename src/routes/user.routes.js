const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/auth.middleware');
const { getProfile, updateProfile } = require('../controllers/user.controller');

// All routes are protected with authenticateToken middleware
router.use(authenticateToken);

// Get profile
router.get('/profile', getProfile);

// Update profile
router.put('/profile', updateProfile);

module.exports = router;
