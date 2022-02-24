const Job = require('../models/jobModel');
const User = require('../models/userModel');
const Contractor = require('../models/contractorModel');
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

//
exports.findjobAndAddProposal = catchAsync(async (req, res, next) => {
  const contractor = await Contractor.findOne({ _id: req.contactor.id });
  const job = await Job.findById(req.params.id);
  //check if contractor has already submit to this proposal -->true or false
  const isContractorSubmited = job.proposals.some(
    (item) => item.contactor.toString() === contractor._id.toString()
  );

  if (isContractorSubmited)
    return next(new AppError('you have already sumbited to this job', 403));

  contractor.addToProposals(job._id, req.body.coverLetter);
  job.addToProposals(
    contractor._id,
    req.body.coverLetter,
    req.body.financialOffer,
    req.body.estimatedTime
  );

  res.status(201).json({
    status: 'Success',
    message: "You've successfully proposed to this job",
  });
});

// // select the qualified contractor from our proposal
// exports.findJobAndAcceptProposalByUser = catchAsync(async (req, res, next) => {
//   const contractor = await Contractor.findOne({ _id: req.params.contId });

//   const job = await Job.findOne({
//     _id: req.params.jobId,
//     user: req.user.id,
//     // 'proposals.contactor': contractor._id,
//     status: 'pending',
//   });

//   if (!job) return next(new AppError(' you already choose a contractor ', 403));

//   job.HiredTalent = contractor._id;
//   job.contractor = 'ongoing';
//   job.startDate = Date.now();
//   await job.save({ validateBeforeSave: false });

//   res.status(201).json({
//     status: 'Success',
//     data: job,
//   });
// });

// select the qualified contractor from our proposal
exports.findJobAndAcceptProposalByUser = catchAsync(async (req, res, next) => {
  const contractor = await Contractor.findOne({ _id: req.params.contId });

  const job = await Job.findOneAndUpdate(
    {
      _id: req.params.jobId,
      user: req.user.id,
      // 'proposals.contactor': contractor._id,
      status: 'pending',
    },
    {
      hiredContractor: contractor._id,
      status: 'ongoing',
      startDate: Date.now(),
    },
    {
      new: true,
    }
  );

  if (!job) return next(new AppError(' you already choose a contractor ', 403));

  res.status(201).json({
    status: 'Success',
    data: job,
  });
});
