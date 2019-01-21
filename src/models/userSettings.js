import mongoose from 'mongoose';

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

export default mongoose.model('UserSettings', UserSettingsSchema);
