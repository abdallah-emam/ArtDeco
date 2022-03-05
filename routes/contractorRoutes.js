const express = require('express');
const contractorController = require('../controllers/contractorController');
const authController = require('../controllers/authContractorController');
const jobController = require('../controllers/jobController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Protect all routes after this middleware
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);

router.get(
  '/getMe',
  contractorController.getMe,
  contractorController.getContractor
);
router.patch(
  '/updateMe',
  contractorController.uploadContractorImages,
  contractorController.resizeUserImages,
  contractorController.updateMe
);

//get ongoing jobs for specific contractor
router.route('/MyAllJobs').get(jobController.getMyAllJobs);

router.delete('/deleteMe', contractorController.deleteMe);

router.route('/').get(contractorController.getAllContractors);

router
  .route('/:id')
  .get(contractorController.getContractor)
  .patch(contractorController.updateContractor)
  .delete(contractorController.deleteContractor);

module.exports = router;
