const Attendance = require('./attendance.model');

exports.getByTeam = async (teamName) => {
  return await Attendance.find({ teamName }).sort({ createdAt: -1 });
};

exports.getMyAttendance = async (userId) => {
  return await Attendance.find({ studentId: userId }).sort({ createdAt: -1 });
};

exports.markAttendance = async (data, markedBy) => {
  return await Attendance.create({
    ...data,
    markedBy,
    date: data.date || new Date().toISOString().split('T')[0],
  });
};

exports.updateStatus = async (id, status) => {
  const att = await Attendance.findByIdAndUpdate(id, { status }, { new: true });
  if (!att) throw new Error('Attendance not found');
  return att;
};
