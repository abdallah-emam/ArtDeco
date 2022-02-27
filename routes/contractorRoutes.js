const express = require('express');
const contractorController = require('../controllers/contractorController');
const authController = require('../controllers/authContractorController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Protect all routes after this middleware
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);

router.get(
  '/getMe',
  contractorController.getMe,
  contractorController.getContactor
);
router.patch('/updateMe', contractorController.updateMe);
router.delete('/deleteMe', contractorController.deleteMe);

router.route('/').get(contractorController.getAllContactors);

router
  .route('/:id')
  .get(contractorController.getContactor)
  .patch(contractorController.updateContactor)
  .delete(contractorController.deleteContactor);

module.exports = router;
