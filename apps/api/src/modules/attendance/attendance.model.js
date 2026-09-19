const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  teamName: { type: String, default: '' },
  eventTitle: { type: String, default: '' },
  status: {
    type: String,
    enum: ['present', 'late', 'absent'],
    default: 'absent',
  },
  checkInTime: { type: String, default: '' },
  date: { type: String, default: '' },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Attendance', attendanceSchema);
