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
        estimatedBudget: {
          type: Number,
        },
        estimatedTime: Date,
        createdAt: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    TotalProposal: {
      type: Number,
      default: 0,
    },
    Status: {
      type: String,
      enum: ['Pending', 'Ongoing', 'Done'],
      default: 'Pending',
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

jobSchema.methods.addToProposals = function (talentID, coverLetter) {
  const updatedProposalsList = [...this.Proposals];
  const newPropose = {
    Talent: talentID,
    CoverLetter: coverLetter,
  };
  updatedProposalsList.push(newPropose);

  this.Proposals = updatedProposalsList;
  this.TotalProposal += 1;

  return this.save();
};

// jobSchema.pre(/^find/, function (next) {
//   next();
// });

const job = mongoose.model('job', jobSchema);

module.exports = job;
