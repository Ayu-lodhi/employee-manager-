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
    const data = await service.getTeamAttendance(teamId, date, req.user);
    res.json({ success: true, data });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

exports.getTeamStats = async (req, res) => {
  try {
    const { teamId, date } = req.query;
    if (!teamId) return res.status(400).json({ success: false, message: 'teamId required' });
    const data = await service.getTeamAttendanceStats(teamId, date, req.user);
    res.json({ success: true, data });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

exports.getTeamHistory = async (req, res) => {
  try {
    const { teamId, days } = req.query;
    if (!teamId) return res.status(400).json({ success: false, message: 'teamId required' });
    const data = await service.getTeamAttendanceHistory(teamId, days, req.user);
    res.json({ success: true, data });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
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
    const data = await service.getAttendanceSheet(teamId, from, to, req.user);
    res.json({ success: true, data });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

const linkService = require('./attendanceLink.service');

// Time-Limited Attendance Link & QR (T3)
exports.generateLink = async (req, res) => {
  try {
    const data = await linkService.generateLink(req.body, req.user);
    res.status(201).json({ success: true, message: 'Attendance link generated', data });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

exports.getLinkInfo = async (req, res) => {
  try {
    const data = await linkService.getLinkInfo(req.params.token, req.user);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

exports.markLinkAttendance = async (req, res) => {
  try {
    const record = await linkService.markAttendance(req.params.token, req.user);
    res.status(201).json({ success: true, message: 'Attendance marked successfully', data: record });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

exports.deactivateLink = async (req, res) => {
  try {
    const data = await linkService.deactivateLink(req.params.token, req.user);
    res.status(200).json({ success: true, message: 'Attendance link deactivated', data });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

exports.getT3TodayPanel = async (req, res) => {
  try {
    const data = await linkService.getT3TodayPanel();
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

exports.shareLinkToChat = async (req, res) => {
  try {
    const data = await linkService.shareLinkToTeamChat(req.params.token, req.body, req.user);
    res.status(200).json({
      success: true,
      message: `Attendance link and QR shared to ${data.teamName} chat successfully!`,
      data,
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};
