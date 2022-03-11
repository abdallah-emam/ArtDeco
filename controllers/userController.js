const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const Job = require('../models/jobModel');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

//dest dir to upload into
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  const folderName = `img/users/user-${req.user.id}-${Date.now()}.jpeg`;

  if (process.env.NODE_ENV === 'development') {
    req.file.filename = `${req.protocol}://localhost:8000/${folderName}`;
  } else if (process.env.NODE_ENV === 'production') {
    req.file.filename = `https://iti-art-deco.herokuapp.com/${folderName}`;
  }

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`puplic/${folderName}`);
  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = factory.getAll(User);

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email', 'phone', 'address');
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  }).select('-jobs');

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user.id });

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.getMyAllOngoingJobs = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user.id });

  const { jobs } = user;
  const ongoingJobs = jobs.filter((job) => job.status === 'ongoing');
  res.status(200).json({
    status: 'success',
    results: ongoingJobs.length,
    data: {
      ongoingJobs,
    },
  });
});

//get a specific ongoing job
exports.getMyOngoingJob = catchAsync(async (req, res, next) => {
  // const user = await User.findOne({ _id: req.user.id });
  // const job = await Job.findOne({ _id: req.params.id, user: req.user.id });

  const currentJob = await Job.findOne({
    _id: req.params.id,
    user: req.user.id,
    status: 'ongoing',
  })
    .select('-proposals')
    .populate('acceptedProposal.contractor', '-Proposals -gallery');

  if (!currentJob) {
    return next(new AppError('This job is not in ongoing status', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      currentJob,
    },
  });
});

exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
