const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  leadName: { type: String, default: '' },
  members: { type: Number, default: 0 },
  chatActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Team', teamSchema);
