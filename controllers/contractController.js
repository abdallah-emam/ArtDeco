const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Job = require('../models/jobModel');
const catchAsync = require('../utils/catchAsync');

//checkout session
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const job = await Job.findById(req.params.jobId);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    //links gets from front-end
    success_url: `${req.protocol}://${req.get('host')}`,
    cancel_url: `${req.protocol}://${req.get('host')}`,

    customer_email: req.user.email,
    // customer_phone: req.user.phone,
    client_reference_id: req.params.jobId,
    line_items: [
      {
        name: job.headLine,
        description: job.description,
        amount: job.budget * 100,
        currency: 'usd',
        quantity: 1,
      },
    ],
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
//   const { tour, user, price } = req.query;

//   if (!tour && !user && !price) return next();
//   await Booking.create({ tour, user, price });

//   res.redirect(req.originalUrl.split('?')[0]);
// });

// exports.createBooking = factory.createOne(Booking);
// exports.getBooking = factory.getOne(Booking);
// exports.getAllBookings = factory.getAll(Booking);
// exports.updateBooking = factory.updateOne(Booking);
// exports.deleteBooking = factory.deleteOne(Booking);
