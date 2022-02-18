const express = require('express');
const contractorController = require('../controllers/contractorController');
const authController = require('../controllers/authUserController');

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
  .get(contractorController.getAllUsers)
  .post(contractorController.createUser);

router
  .route('/:id')
  .get(contractorController.getUser)
  .patch(contractorController.updateUser)
  .delete(contractorController.deleteUser);

module.exports = router;
