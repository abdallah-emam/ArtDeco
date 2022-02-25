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
  const user = await User.findOne({ _id: req.user.id });
  const job = await Job.findByIdAndDelete(req.params.id);

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

// select the qualified contractor from our proposal
const IsUserEligableToaccept = async (jobId, userId, next) => {
  const IsEligable = await Job.findOne({
    _id: jobId,
    user: userId,
  });

  if (!IsEligable)
    return next(new AppError(' this job does not belong to you ', 401));
};

exports.findJobAndAcceptProposalByUser = catchAsync(async (req, res, next) => {
  // const IsUserEligableToaccept = await Job.findOne({
  //   _id: req.params.jobId,
  //   user: req.user.id,
  // });

  // if (!IsUserEligableToaccept)
  //   return next(new AppError(' this job does not belong to you ', 401));
  await IsUserEligableToaccept(req.params.jobId, req.user.id, next);

  const contractor = await Contractor.findOne({ _id: req.params.contId });
  const job = await Job.findOneAndUpdate(
    {
      _id: req.params.jobId,
      user: req.user.id,
      'proposals.contactor': contractor._id,
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
// end job br user and handele (increase) contractor payment
exports.endJob = catchAsync(async (req, res, next) => {
  await IsUserEligableToaccept(req.params.jobId, req.user.id, next);

  const contractor = await Contractor.findOne({
    _id: req.params.contId,
  });

  const job = await Job.findOneAndUpdate(
    {
      _id: req.params.jobId,
      user: req.user.id,
      hiredContractor: req.params.contId,
      status: 'ongoing',
    },
    {
      status: 'done',
      userReview: req.body.review,
      userRating: req.body.rating,
      endDate: Date.now(),
    },
    {
      new: true,
    }
  );

  if (!job) return next(new AppError(' something went wrong! ', 403));

  //increase contractor money
  contractor.receiveMoney(job.proposals.financialOffer);

  res.status(201).json({
    status: 'Success',
    data: job,
  });
});
