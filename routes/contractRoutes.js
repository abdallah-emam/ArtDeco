const express = require('express');
const contractController = require('../controllers/contractController');
const authController = require('../controllers/authUserController');

const router = express.Router();

router.use(authController.protect);

router.get('/checkout-session/:jobId', contractController.getCheckoutSession);

// router.use(authController.restrictTo('admin', 'lead-guide'));

// router
//   .route('/')
//   .get(bookingController.getAllBookings)
//   .post(bookingController.createBooking);

// router
//   .route('/:id')
//   .get(bookingController.getBooking)
//   .patch(bookingController.updateBooking)
//   .delete(bookingController.deleteBooking);

module.exports = router;
