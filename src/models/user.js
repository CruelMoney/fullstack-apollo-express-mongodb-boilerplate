import mongoose from 'mongoose';

import bcrypt from 'bcrypt';
import isEmail from 'validator/lib/isEmail';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    validate: [isEmail, 'Email er ikke gyldig.'],
  },
  password: {
    type: String,
    required: [true, 'Password skal udfyldes.'],
    minlength: [3, 'Password skal være på minimum 3 bogstaver.'],
    maxlength: [42, 'Password kan maks være på 42 bogstaver.'],
  },
  role: {
    type: String,
  },
  userSettings: {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSettings',
  },
});

UserSchema.statics.findByLogin = async function(login) {
  let user = await this.findOne({ email: login });
  return user;
};

UserSchema.pre('save', async function() {
  this.password = await this.generatePasswordHash();
});

UserSchema.methods.generatePasswordHash = async function() {
  const saltRounds = 10;
  return await bcrypt.hash(this.password, saltRounds);
};

UserSchema.methods.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Unique email error handling
UserSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('Email allerede i brug.'));
  } else {
    next(error);
  }
});

export default mongoose.model('User', UserSchema);
