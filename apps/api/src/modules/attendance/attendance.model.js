const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  teamName: { type: String, default: '' },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
  eventTitle: { type: String, default: '' },
  date: { type: String, required: true },        // YYYY-MM-DD
  checkInTime: { type: Date, default: null },
  checkOutTime: { type: Date, default: null },
  durationMinutes: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['present', 'late', 'absent'],
    default: 'absent',
  },
  method: {
    type: String,
    enum: ['qr', 'manual', 'self'],
    default: 'self',
  },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  markedByName: { type: String, default: '' },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ teamId: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
