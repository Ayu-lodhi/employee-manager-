const Attendance = require('./attendance.model');
const { notify } = require('../notifications/notifications.service');

// Get today's date in YYYY-MM-DD
const today = () => new Date().toISOString().split('T')[0];

// Check if student is late (after 9:15 AM)
const isLate = (date) => {
  const now = new Date();
  const cutoff = new Date(date);
  cutoff.setHours(9, 15, 0, 0);
  return now > cutoff;
};

// ========== CHECK-IN ==========
exports.checkIn = async (studentId, studentName, data) => {
  const date = today();

  // Check if already checked in today for same team
  const existing = await Attendance.findOne({
    studentId,
    teamName: data.teamName || '',
    date,
  });

  if (existing && existing.checkInTime) {
    throw new Error('Already checked in today for this team');
  }

  const checkInTime = new Date();
  const status = isLate(date) ? 'late' : 'present';

  const record = await Attendance.create({
    studentId,
    studentName,
    teamId: data.teamId || null,
    teamName: data.teamName || '',
    eventId: data.eventId || null,
    eventTitle: data.eventTitle || '',
    date,
    checkInTime,
    status,
    method: data.method || 'self',
  });

  // Notify the student (confirmation)
  await notify(
    studentId,
    'attendance',
    'Checked In',
    `You checked in for ${data.teamName || 'your team'} at ${checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
  );

  return record;
};

// ========== CHECK-OUT ==========
exports.checkOut = async (studentId, teamName) => {
  const date = today();

  const record = await Attendance.findOne({
    studentId,
    teamName: teamName || '',
    date,
  });

  if (!record) throw new Error('No check-in found for today');
  if (record.checkOutTime) throw new Error('Already checked out');

  record.checkOutTime = new Date();
  record.durationMinutes = Math.round((record.checkOutTime - record.checkInTime) / 60000);
  await record.save();

  return record;
};

// ========== MANUAL MARK (by T3/Admin) ==========
exports.manualMark = async (data, marker) => {
  const date = data.date || today();

  const existing = await Attendance.findOne({
    studentId: data.studentId,
    teamName: data.teamName,
    date,
  });

  if (existing) {
    existing.status = data.status;
    existing.notes = data.notes || '';
    existing.markedBy = marker.sub;
    existing.markedByName = marker.name || '';
    existing.method = 'manual';
    if (data.status !== 'absent' && !existing.checkInTime) {
      existing.checkInTime = new Date();
    }
    await existing.save();
    return existing;
  }

  return await Attendance.create({
    studentId: data.studentId,
    studentName: data.studentName,
    teamId: data.teamId || null,
    teamName: data.teamName || '',
    eventId: data.eventId || null,
    eventTitle: data.eventTitle || '',
    date,
    checkInTime: data.status === 'absent' ? null : new Date(),
    status: data.status,
    method: 'manual',
    markedBy: marker.sub,
    markedByName: marker.name || '',
    notes: data.notes || '',
  });
};

// ========== GET BY TEAM (for T3 to view) ==========
exports.getByTeamAndDate = async (teamName, date) => {
  const targetDate = date || today();
  return await Attendance.find({ teamName, date: targetDate }).sort({ createdAt: 1 });
};

// ========== GET MY ATTENDANCE (for T1) ==========
exports.getMyAttendance = async (studentId) => {
  return await Attendance.find({ studentId }).sort({ createdAt: -1 }).limit(50);
};

// ========== GET TODAY'S STATUS ==========
exports.getTodayStatus = async (studentId, teamName) => {
  const record = await Attendance.findOne({
    studentId,
    teamName: teamName || '',
    date: today(),
  });
  return record || null;
};

// ========== STATS ==========
exports.getTeamStats = async (teamName, date) => {
  const targetDate = date || today();
  const records = await Attendance.find({ teamName, date: targetDate });

  return {
    total: records.length,
    present: records.filter(r => r.status === 'present').length,
    late: records.filter(r => r.status === 'late').length,
    absent: records.filter(r => r.status === 'absent').length,
    records,
  };
};
