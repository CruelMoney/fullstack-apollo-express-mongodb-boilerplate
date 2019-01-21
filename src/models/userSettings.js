import mongoose from 'mongoose';
import { languages } from '../constants';

const UserSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  language: {
    type: String,
    required: true,
  },
});

// Only allow the defined languages
UserSettingsSchema.pre('save', function(next) {
  if (!languages.some(l => this.language === l)) {
    next(new Error('Det angivne sprog er ikke understøttet.'));
  }
  next();
});

export default mongoose.model('UserSettings', UserSettingsSchema);
