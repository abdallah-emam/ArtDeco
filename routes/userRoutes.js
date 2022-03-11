const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authUserController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Protect all routes after this middleware
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);

//get me
router.get('/getMe', userController.getMe);

//get all ongoing jobs
router.get('/getMyOngoingJobs', userController.getMyAllOngoingJobs);

//get a specific ongoing job
router.get('/getMyOngoingJobs/:id', userController.getMyOngoingJob);

// router.get('/getMe', userController.getMe, userController.getUser);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);

//action allows only by admin
// router.use(authController.restrictTo('admin'));

router.route('/').get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
