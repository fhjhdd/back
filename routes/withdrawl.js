const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawlController');

// Routes
router.get('/', withdrawalController.getWithdrawals); // all withdrawals
router.get('/user/:userId', withdrawalController.getUserWithdrawals); // withdrawals by user
router.post('/', withdrawalController.createWithdrawal);
router.patch('/:id/approve', withdrawalController.approveWithdrawal);
router.patch('/:id/reject', withdrawalController.rejectWithdrawal);


module.exports = router;
