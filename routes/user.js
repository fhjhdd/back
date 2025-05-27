const express = require('express');
const { addUser, getUsers,getUsersByIdsHandler ,getSpecificUserTeamData,approveUser,getUserByUniqueId , unblockUser, blockUser,resetPassword,getLatestTeamMembers} = require('../controllers/userController');
const { getUserById } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();


router.post('/add', authMiddleware, addUser);
// router.post('/approve/:id', authMiddleware, approveUser);
router.get('/', authMiddleware, getUsers);
router.post('/by-ids', getUsersByIdsHandler);
router.get('/referrals/specificUserTeamData/:uniqueId',getSpecificUserTeamData)
router.patch('/approve/:uniqueId',authMiddleware,approveUser);
router.get('/:userId', getUserById);
router.get('/unique/:uniqueId',getUserByUniqueId)
// Block a user
router.post('/block/:userId', blockUser);

// Unblock a user
router.post('/unblock/:userId', unblockUser);

// Reset password
router.post('/reset-password/:userId', resetPassword);
// routes/userRoutes.js
router.get('/team/latest/:referrerId', getLatestTeamMembers);

module.exports = router;
