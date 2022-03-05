const mongoose = require('mongoose');

const jobHistorySchema = new mongoose.Schema({
  jobName: {
    type: String,
    required: [true, 'please provide the job name'],
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  jobRatingReview: {
    type: String,
    default: 'no reviewing yes',
  },
  jobStaus: {
    type: String,
    enum: ['onGoing', 'done'],
    required: [true, 'pleae provide job History Stauts'],
  },
  contractor: {
    type: mongoose.Schema.ObjectId,
    ref: 'Contractor',
    required: [true, 'jobHistory must belong to a contractor'],
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'job',
    required: [true, 'jobHistory must have a job'],
  },
});

const JobHistory = mongoose.model('JobsHistory', jobHistorySchema);

module.exports = JobHistory;
