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
    location: {
      type: String,
      required: [true, 'Please enter your location!'],
    },
    budget: {
      type: Number,
      required: [true, 'Please enter your budget!'],
    },
    estimatedTime: {
      type: String,
      required: [true, 'Please enter your estimited time!'],
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
        estimatedTime: {
          type: String,
          required: [true, 'Please enter your estimited time!'],
        },
        createdAt: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    acceptedProposal: {
      contractor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contractor',
      },
      coverLetter: {
        type: String,
      },
      financialOffer: {
        type: Number,
      },
      estimatedTime: {
        type: String,
      },
      createdAt: {
        type: Date,
      },
    },
    totalProposal: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'ongoing', 'done'],
      default: 'pending',
    },
    //this is the cost that will be in contract
    //both user&contractor must confirm it
    cost: {
      type: Number,
    },
    endDate: Date,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

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

jobSchema.methods.addToAcceptedProposal = function (acceptedPro) {
  this.acceptedProposal = acceptedPro;

  this.save();
};

const job = mongoose.model('job', jobSchema);

module.exports = job;
