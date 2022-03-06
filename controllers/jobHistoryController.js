const catchAsync = require('../utils/catchAsync');
const JobHistory = require('../models/jobHistoryModel');
// const AppError = require('../utils/appError');

exports.getALlWorlHistoryForContractor = catchAsync(async (req, res, next) => {
  const docs = await JobHistory.find({ contractor: req.params.contId });

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
