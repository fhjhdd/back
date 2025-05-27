const express = require('express');
const { register, login } = require('../controllers/authController');
const router = express.Router();

router.post('/register', register); // Optional if only admins can register users
router.post('/login', login);

module.exports = router;
