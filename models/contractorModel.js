const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const contactorSchema = new mongoose.Schema({
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
  photo: String,
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
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

contactorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

contactorSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

const Contactor = mongoose.model('Contactor', contactorSchema);
module.exports = Contactor;
