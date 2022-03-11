const express = require('express');
const contractorController = require('../controllers/contractorController');
const authController = require('../controllers/authContractorController');
const jobController = require('../controllers/jobController');

const router = express.Router();

router.get('/getMe', authController.protect, contractorController.getMe);
router.get('/MyAllJobs', authController.protect, jobController.getMyAllJobs);

router.post('/signup', authController.signup);
router.post('/login', authController.login);
// router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.route('/:id').get(contractorController.getContractor);

// Protect all routes after this middleware
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);

router.patch(
  '/updateMe',
  contractorController.uploadContractorImages,
  contractorController.resizeUserImages,
  contractorController.updateMe
);

router.delete('/deleteMe', contractorController.deleteMe);

router.route('/').get(contractorController.getAllContractors);

router
  .route('/:id')
  .patch(contractorController.updateContractor)
  .delete(contractorController.deleteContractor);

module.exports = router;
