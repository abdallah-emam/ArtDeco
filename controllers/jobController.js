const Job = require('../models/jobModel');
const User = require('../models/userModel');
const handler = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllJob = catchAsync(async (req, res, next) => {
  const jobs = await Job.find();

  res.status(201).json({
    status: 'success',
    results: jobs.length,
    data: {
      jobs,
    },
  });
});

exports.createJob = catchAsync(async (req, res, next) => {
  const job = await Job.create(req.body);

  const user = await User.findOne({ _id: req.user.id });
  // console.log(user);
  user.addToJobs(job._id);

  res.status(201).json({
    status: 'success',
    data: {
      job,
    },
  });
});

exports.updateJob = handler.updateOne(Job);

exports.deleteJob = catchAsync(async (req, res, next) => {
  const job = await Job.findByIdAndDelete(req.params.id);
  const user = await User.findOne({ _id: req.user.id });

  // console.log(user);

  if (!job)
    return next(new AppError('No Document was found with that ID', 404));

  user.removeFromJobs(job._id);

  res.status(204).json({
    status: 'Success',
    data: null,
  });
});
