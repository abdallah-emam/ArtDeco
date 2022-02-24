const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const Contactor = require('../models/contractorModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

//create token
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

//send cookie contain token
const createSendToken = (contactor, statusCode, res) => {
  const token = signToken(contactor._id);
  console.log(contactor._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  contactor.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      contactor,
    },
  });
};

//signup
exports.signup = catchAsync(async (req, res, next) => {
  const newContactor = await Contactor.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createSendToken(newContactor, 201, res);
});

//login
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) Check if Contactor exists && password is correct
  const contactor = await Contactor.findOne({ email }).select('+password');

  if (
    !contactor ||
    !(await contactor.correctPassword(password, contactor.password))
  ) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(contactor, 200, res);
});

//middleware to protect routes
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if Contactor still exists
  const currentContactor = await Contactor.findById(decoded.id);
  if (!currentContactor) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4) Check if Contactor changed password after the token was issued
  if (currentContactor.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.contactor = currentContactor;
  next();
});

//restrict function for only contractor to offer the application
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles ['user', 'contractor']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(new AppError('only contrator could apply for project', 403));
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const contactor = await Contactor.findOne({ email: req.body.email });
  if (!contactor) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = contactor.createPasswordResetToken();
  await contactor.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/contractors/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: contactor.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    contactor.passwordResetToken = undefined;
    contactor.passwordResetExpires = undefined;
    await contactor.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const contactor = await Contactor.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!contactor) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  contactor.password = req.body.password;
  contactor.passwordConfirm = req.body.passwordConfirm;
  contactor.passwordResetToken = undefined;
  contactor.passwordResetExpires = undefined;
  await contactor.save();

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(contactor, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const contactor = await Contactor.findById(req.contactor.id).select(
    '+password'
  );
  console.log(req);

  // 2) Check if POSTed current password is correct
  if (
    !(await contactor.correctPassword(
      req.body.passwordCurrent,
      contactor.password
    ))
  ) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  contactor.password = req.body.password;
  contactor.passwordConfirm = req.body.passwordConfirm;
  await contactor.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(contactor, 200, res);
});
