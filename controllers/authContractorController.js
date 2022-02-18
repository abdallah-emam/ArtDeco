const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const Contactor = require('../models/contractorModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

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
  if (Contactor.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.Contactor = currentContactor;
  next();
});
