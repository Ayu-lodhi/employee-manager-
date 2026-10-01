const service = require('./attendance.service');

exports.markAttendance = async (req, res) => {
  try {
    const record = await service.markAttendance(req.body, req.user);
    res.status(200).json({ success: true, message: 'Attendance marked', data: record });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.selfCheckIn = async (req, res) => {
  try {
    const record = await service.selfCheckIn(req.user, req.body);
    res.status(201).json({ success: true, message: 'Checked in', data: record });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.selfCheckOut = async (req, res) => {
  try {
    const record = await service.selfCheckOut(req.user, req.body);
    res.status(200).json({ success: true, message: 'Checked out', data: record });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getTeamAttendance = async (req, res) => {
  try {
    const { teamId, date } = req.query;
    if (!teamId) return res.status(400).json({ success: false, message: 'teamId required' });
    const data = await service.getTeamAttendance(teamId, date);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getTeamStats = async (req, res) => {
  try {
    const { teamId, date } = req.query;
    if (!teamId) return res.status(400).json({ success: false, message: 'teamId required' });
    const data = await service.getTeamAttendanceStats(teamId, date);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getTeamHistory = async (req, res) => {
  try {
    const { teamId, days } = req.query;
    if (!teamId) return res.status(400).json({ success: false, message: 'teamId required' });
    const data = await service.getTeamAttendanceHistory(teamId, parseInt(days) || 7);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getMyStats = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = await service.getMyAttendanceStats(req.user.sub, days);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const records = await service.getMyAttendance(req.user.sub, days);
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getTodayStatus = async (req, res) => {
  try {
    const { teamId } = req.query;
    const record = await service.getTodayStatus(req.user.sub, teamId);
    res.json({ success: true, data: record || null });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.downloadSheet = async (req, res) => {
  try {
    const { teamId, from, to } = req.query;
    if (!teamId) return res.status(400).json({ success: false, message: 'teamId required' });
    const data = await service.getAttendanceSheet(teamId, from, to);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
