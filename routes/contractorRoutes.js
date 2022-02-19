const express = require('express');
const contractorController = require('../controllers/contractorController');
const authController = require('../controllers/authContractorController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.patch(
  '/updateMyPassword',
  authController.protect,
  authController.updatePassword
);

router.patch(
  '/updateMe',
  authController.protect,
  contractorController.updateMe
);
router.delete(
  '/deleteMe',
  authController.protect,
  contractorController.deleteMe
);

router
  .route('/')
  .get(contractorController.getAllContactors)
  .post(contractorController.createContactor);

router
  .route('/:id')
  .get(contractorController.getContactor)
  .patch(contractorController.updateContactor)
  .delete(contractorController.deleteContactor);

module.exports = router;
