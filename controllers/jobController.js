const Job = require('../models/jobModel');
const User = require('../models/userModel');
const Contractor = require('../models/contractorModel');
const handler = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const JobHistory = require('../models/jobHistoryModel');

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

exports.getAllJob = catchAsync(async (req, res, next) => {
  let features;
  let documentLegnth;

  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');

    documentLegnth = await Job.count({ description: regex, status: 'pending' });
    features = new APIFeatures(
      Job.find({ description: regex, status: 'pending' }).select('-proposals '),
      req.query
    ).paginate();
  } else {
    documentLegnth = await Job.count({ status: 'pending' });

    features = new APIFeatures(
      Job.find({ status: 'pending' }).select('-proposals '),
      req.query
    ).paginate();
  }

  const jobs = await features.query;

  res.status(201).json({
    status: 'success',
    fullLength: documentLegnth,
    results: jobs.length,
    data: {
      jobs,
    },
  });
});

//get ongoing jobs for specific contractor
exports.getMyAllJobs = catchAsync(async (req, res, next) => {
  const contractor = await Contractor.findOne({ _id: req.contractor.id });

  const features = new APIFeatures(
    Job.find({ hiredContractor: contractor, status: 'ongoing' }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const jobs = await features.query;
  res.status(201).json({
    status: 'success',
    results: jobs.length,
    data: {
      jobs,
    },
  });
});

//create job by a user
exports.createJob = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user.id });

  const job = await Job.create({ user: req.user.id, ...req.body });

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
  const contractor = await Contractor.findOne({ _id: req.contractor.id });
  const job = await Job.findById(req.params.id);

  //check if contractor has already submit to this proposal -->true or false
  const isContractorSubmited = job.proposals.some(
    (item) => item.contractor.toString() === contractor._id.toString()
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
  //1)make sure that  a specific job belog to a specific user
  await IsUserEligableToaccept(req.params.jobId, req.user.id, next);

  //2)choose a specific contractor by its own proposal
  const contractor = await Contractor.findOne({ _id: req.params.contId });

  const currentJob = await Job.findOne({
    _id: req.params.jobId,
    user: req.user.id,
    'proposals.contractor': contractor._id,
    status: 'pending',
  });

  const currentProposal = currentJob.proposals.find(
    (proposal) => proposal.contractor.toString() === contractor._id.toString()
  );

  const job = await Job.findOneAndUpdate(
    {
      _id: req.params.jobId,
      user: req.user.id,
      // 'proposals.contractor': contractor._id,
      status: 'pending',
    },
    {
      hiredContractor: contractor._id,
      status: 'ongoing',
      cost: currentProposal.financialOffer,
      startDate: Date.now(),
    },
    {
      new: true,
    }
  )
    .select('-proposals')
    .populate({
      path: 'hiredContractor',
      select: '-Proposals -gallery',
    });

  if (!job) return next(new AppError(' you already choose a contractor ', 403));

  await job.addToAcceptedProposal(currentProposal);

  await JobHistory.create({
    jobName: job.headLine,
    rating: req.body.rating,
    jobRatingReview: req.body.jobRatingReview,
    contractor: contractor._id,
    jobStaus: 'onGoing',
    job: job._id,
  });

  res.status(201).json({
    status: 'Success',
    data: job,
  });
});

// send both contractor and user a contract

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
  )
    // .select('-proposals')
    .populate({
      path: 'hiredContractor',
      select: '-Proposals -gallery',
    });

  if (!job) return next(new AppError(' something went wrong! ', 403));

  //increase contractor money
  contractor.receiveMoney(job.proposals.financialOffer);

  await JobHistory.findOneAndUpdate(
    { contractor: contractor._id, job: job._id },
    {
      jobStaus: 'done',
      rating: req.body.rating,
      jobRatingReview: req.body.jobRatingReview,
    }
  );

  res.status(204).json({
    status: 'Success',
    data: null,
  });
});

//get specific job by id
exports.getJob = catchAsync(async (req, res, next) => {
  const job = await Job.findOne({ _id: req.params.id });
  if (!job) {
    return next(new AppError('No job found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      job,
    },
  });
});
