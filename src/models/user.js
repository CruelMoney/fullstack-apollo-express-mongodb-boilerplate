import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import isEmail from 'validator/lib/isEmail';
import { AuthenticationError } from 'apollo-server';

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
  emailVerified: {
    required: true,
    type: Boolean,
    default: false,
  },
});

UserSchema.statics.findByLogin = async function(login) {
  let user = await this.findOne({ email: login });
  return user;
};

UserSchema.statics.findByToken = async function(token) {
  try {
    const { email, id } = await jwt.verify(token, process.env.SECRET);
    let user = await this.findById(id);
    return user;
  } catch (error) {
    return null;
  }
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

UserSchema.methods.generateEmailVerificationToken = async function() {
  const { id, email, emailVerified } = this;
  return await jwt.sign(
    { id, email, emailVerified },
    process.env.SECRET,
    {
      expiresIn: '30m',
    },
  );
};

// changing the email will invalidate the token, and changing the emailVerified
// so it can only be used one time to validate email
UserSchema.methods.validateEmailVerificationToken = async function(
  token,
) {
  try {
    const { email, id } = await jwt.verify(token, process.env.SECRET);
    if (this.email !== email && id === this.id) {
      return false;
    }
  } catch (e) {
    return false;
  }
  return true;
};

UserSchema.methods.generatePasswordResetToken = async function() {
  const { id, password } = this;
  return await jwt.sign({ id, password }, process.env.SECRET, {
    expiresIn: '30m',
  });
};

// changing the password will invalidate the token
// so it can only be used one time to change password
UserSchema.methods.validatePasswordResetToken = async function(
  token,
) {
  try {
    const { password, id } = await jwt.verify(
      token,
      process.env.SECRET,
    );
    if (this.password !== password && id === this.id) {
      return false;
    }
  } catch (e) {
    return false;
  }
  return true;
};

// Unique email error handling
UserSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('Email allerede i brug.'));
  } else {
    next(error);
  }
});

UserSchema.pre('remove', async function() {
  // also delete settings
  await this.model('UserSettings').findByIdAndDelete(
    this.userSettings,
  );
});

export default mongoose.model('User', UserSchema);
