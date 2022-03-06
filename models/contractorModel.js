const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const contractorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please enter your name!'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'http://localhost:8000/img/contractors/default.jpg',
  },
  phone: {
    type: String,
  },
  address: {
    type: String,
  },
  aboutMe: {
    type: String,
  },
  gallery: [String],
  role: {
    type: String,
    enum: ['contractor'],
    default: 'contractor',
  },
  password: {
    type: String,
    require: [true, 'Please provide a password'],
    select: false,
    minlength: [8, 'minimum password is 8 characters'],
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: function (el) {
      return el === this.password;
    },
    message: 'Passwords are not the same!',
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  Proposals: [
    {
      job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'job',
        required: true,
      },
      coverLetter: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now(),
      },
    },
  ],
  earnings: Number,
  // job:
});
contractorSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'Proposals.job',
    select: '-proposals',
  });
  next();
});
contractorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

contractorSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

contractorSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

//instance method to compare candidatePassword with pass in DB used for login
contractorSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

contractorSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

//create temprory password and save it in passwordResetToken
contractorSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// add new proposal
contractorSchema.methods.addToProposals = function (jobID, coverLetter) {
  const updatedProposalsList = [...this.Proposals];
  const newPropose = {
    job: jobID,
    coverLetter,
  };
  updatedProposalsList.push(newPropose);

  this.Proposals = updatedProposalsList;

  this.save({ validateBeforeSave: false });
};

contractorSchema.methods.receiveMoney = function (price) {
  const amount = 0.8 * price;
  this.earnings += amount;
  this.save({ validateBeforeSave: false });
};
const Contractor = mongoose.model('Contractor', contractorSchema);
module.exports = Contractor;
