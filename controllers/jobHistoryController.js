const catchAsync = require('../utils/catchAsync');
const JobHistory = require('../models/jobHistoryModel');
const APIFeatures = require('../utils/apiFeatures');
// const AppError = require('../utils/appError');

exports.getALlWorlHistoryForContractor = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    JobHistory.find({ jobStaus: 'done', contractor: req.params.contId }),
    req.query
  ).paginate();
  const docs = await features.query;
  if (!docs)
    return res.status(204).json({
      status: 'Success',
      result: docs.length,
      data: null,
    });
  res.status(200).json({
    status: 'Success',
    data: docs,
  });
});
