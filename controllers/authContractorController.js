const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const Contractor = require('../models/contractorModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

//create token
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

//send cookie contain token
const createSendToken = (contractor, statusCode, res) => {
  const token = signToken(contractor._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  contractor.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      contractor,
    },
  });
};

//signup
exports.signup = catchAsync(async (req, res, next) => {
  const newContractor = await Contractor.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newContractor, url).sendWelcome();

  createSendToken(newContractor, 201, res);
});

//login
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) Check if r exists && password is correct
  const contractor = await Contractor.findOne({ email }).select(
    '+password -Proposals -gallery -email'
  );

  if (
    !contractor ||
    !(await contractor.correctPassword(password, contractor.password))
  ) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(contractor, 200, res);
});

//logout
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

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
  // 3) Check if contractor still exists
  const currentContractor = await Contractor.findById(decoded.id);
  if (!currentContractor) {
    return next(
      new AppError(
        'The contractor belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4) Check if contractor changed password after the token was issued
  if (currentContractor.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'Contractor recently changed password! Please log in again.',
        401
      )
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.contractor = currentContractor;
  next();
});
//restrict function for only contractor to offer the application
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles ['contractor', 'contractor']. role='contractor'
    if (!roles.includes(req.contractor.role)) {
      return next(new AppError('only contrator could apply for project', 403));
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get contractor based on POSTed email
  const contractor = await Contractor.findOne({ email: req.body.email });
  if (!contractor) {
    return next(
      new AppError('There is no contractor with email address.', 404)
    );
  }

  // 2) Generate the random reset token
  const resetToken = contractor.createPasswordResetToken();
  await contractor.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://localhost:3000/contractor_reset/${resetToken}`;
    await new Email(contractor, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    contractor.passwordResetToken = undefined;
    contractor.passwordResetExpires = undefined;
    await contractor.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get contractor based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const contractor = await Contractor.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is contractor, set the new password
  if (!contractor) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  contractor.password = req.body.password;
  contractor.passwordConfirm = req.body.passwordConfirm;
  contractor.passwordResetToken = undefined;
  contractor.passwordResetExpires = undefined;
  await contractor.save();

  // 3) Update changedPasswordAt property for the contractor
  // 4) Log the contractor in, send JWT
  createSendToken(contractor, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get contractor from collection
  const contractor = await Contractor.findById(req.contractor.id).select(
    '+password'
  );

  // 2) Check if POSTed current password is correct
  if (
    !(await contractor.correctPassword(
      req.body.passwordCurrent,
      contractor.password
    ))
  ) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  contractor.password = req.body.password;
  contractor.passwordConfirm = req.body.passwordConfirm;
  await contractor.save();
  // Contractor.findByIdAndUpdate will NOT work as intended!

  // 4) Log contractor in, send JWT
  createSendToken(contractor, 200, res);
});
