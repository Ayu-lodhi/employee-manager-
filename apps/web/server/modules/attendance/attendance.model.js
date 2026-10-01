const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, default: '' },

  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  teamName: { type: String, default: '' },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
  eventTitle: { type: String, default: '' },

  date: { type: String, required: true },  // YYYY-MM-DD
  shiftLabel: { type: String, default: 'Full Day' },

  checkInTime: { type: Date, default: null },
  checkOutTime: { type: Date, default: null },
  durationMinutes: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ['present', 'late', 'absent', 'on_leave'],
    default: 'absent',
  },
  method: {
    type: String,
    enum: ['qr', 'manual', 'self'],
    default: 'manual',
  },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  markedByName: { type: String, default: '' },
  notes: { type: String, default: '' },

  createdAt: { type: Date, default: Date.now },
});

// One record per student per team per date
attendanceSchema.index({ studentId: 1, teamId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ teamId: 1, date: 1 });
attendanceSchema.index({ studentId: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
