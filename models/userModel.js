const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'http://localhost:8000/img/users/default.jpg',
  },
  phone: {
    type: Number,
  },
  address: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'minimum password is 8 characters'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  jobs: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'job',
    },
  ],
});

userSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'jobs',
    select: 'headLine description budget totalProposal status ',
  });
  next();
});

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  // isNew property ensure that this filed is new
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; // sometimes saving data in DB is a bit slower than issuing the token so we try to delay time 1s later than it is
  next();
});

userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
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
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// update jobs field in user model item
userSchema.methods.addToJobs = function (jobId) {
  const updateJobList = [...this.jobs];

  updateJobList.push(jobId);

  this.jobs = updateJobList;

  this.save({ validateBeforeSave: false });
};

// remove job from job-list item
userSchema.methods.removeFromJobs = function (jobId) {
  const updatedJobList = this.jobs.filter(
    (item) => item.toString() !== jobId.toString()
  );

  this.jobs = updatedJobList;

  this.save({ validateBeforeSave: false });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
