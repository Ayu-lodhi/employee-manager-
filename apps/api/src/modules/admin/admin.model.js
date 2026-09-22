const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, default: '' },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'ADMIN', 'T3_EXECUTIVE', 'T2_ASSOCIATE', 'T1_VOLUNTEER'],
    default: 'T1_VOLUNTEER',
  },
  isActive: { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },

  // Profile fields
  skills: { type: String, default: '' },
  availability: { type: String, default: '' },
  bio: { type: String, default: '' },

  // NOTIFICATION PREFERENCES
  notificationPrefs: {
    // Master channel toggles
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    inApp: { type: Boolean, default: true },

    // Per-category toggles (which types of notifications to receive)
    categories: {
      application: { type: Boolean, default: true },
      event: { type: Boolean, default: true },
      chat: { type: Boolean, default: true },
      attendance: { type: Boolean, default: true },
      system: { type: Boolean, default: true },
    },
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);