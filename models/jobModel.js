const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Job must belong to a user'],
    },
    headLine: {
      type: String,
      required: [true, 'Please enter your headLine!'],
    },
    description: {
      type: String,
      required: [true, 'Please enter your description!'],
    },
    budget: {
      type: Number,
      required: [true, 'Please enter your budget!'],
    },
    estimitedTime: {
      type: Date,
    },
    userRating: {
      type: Number,
      enum: [0, 1, 2, 3, 4, 5],
    },
    userReview: {
      type: String,
    },
    hiredContractor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contractor',
    },
    contractorRating: {
      type: Number,
      enum: [0, 1, 2, 3, 4, 5],
    },
    contractorReview: {
      type: String,
    },
    proposals: [
      {
        contractor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Contractor',
          required: true,
        },
        coverLetter: {
          type: String,
          required: true,
        },
        financialOffer: {
          type: Number,
        },
        estimatedTime: Date,
        createdAt: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    totalProposal: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'ongoing', 'done'],
      default: 'pending',
    },
    endDate: Date,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// // //populate hired contractor in specific job
// jobSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'proposals.contractor',
//     select: '-__v',
//   });
//   next();
// });
//
jobSchema.methods.addToProposals = function (
  talentID,
  coverLetter,
  financialOffer,
  estimatedTime
) {
  const updatedProposalsList = [...this.proposals];
  const newPropose = {
    contractor: talentID,
    coverLetter,
    financialOffer,
    estimatedTime,
  };
  updatedProposalsList.push(newPropose);

  this.proposals = updatedProposalsList;
  this.totalProposal += 1;

  this.save();
};

// jobSchema.pre(/^find/, function (next) {
//   next();
// });

const job = mongoose.model('job', jobSchema);

module.exports = job;
