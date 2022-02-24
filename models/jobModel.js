const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Job must belong to a user'],
    },
    description: {
      type: String,
      required: [true, 'Please enter your description!'],
    },
    images: [String],
    budget: {
      type: Number,
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
      ref: 'Contactor',
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
        contactor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Contactor',
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
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//
jobSchema.methods.addToProposals = function (
  talentID,
  coverLetter,
  financialOffer,
  estimatedTime
) {
  const updatedProposalsList = [...this.proposals];
  const newPropose = {
    contactor: talentID,
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