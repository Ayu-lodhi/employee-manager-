const attService = require('./attendance.service');

exports.checkIn = async (req, res) => {
  try {
    const record = await attService.checkIn(req.user.sub, req.user.name, req.body);
    res.status(201).json({ success: true, message: 'Checked in', data: record });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const record = await attService.checkOut(req.user.sub, req.body.teamName);
    res.status(200).json({ success: true, message: 'Checked out', data: record });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.manualMark = async (req, res) => {
  try {
    const record = await attService.manualMark(req.body, req.user);
    res.status(200).json({ success: true, message: 'Attendance marked', data: record });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getByTeam = async (req, res) => {
  try {
    const { teamName } = req.query;
    const { date } = req.query;
    if (!teamName) return res.status(400).json({ success: false, message: 'teamName required' });
    const records = await attService.getByTeamAndDate(teamName, date);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const records = await attService.getMyAttendance(req.user.sub);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTodayStatus = async (req, res) => {
  try {
    const { teamName } = req.query;
    const record = await attService.getTodayStatus(req.user.sub, teamName);
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTeamStats = async (req, res) => {
  try {
    const { teamName } = req.query;
    const { date } = req.query;
    if (!teamName) return res.status(400).json({ success: false, message: 'teamName required' });
    const stats = await attService.getTeamStats(teamName, date);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
