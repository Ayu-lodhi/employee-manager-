const adminService = require('./admin.service');

exports.getUsers = async (req, res) => {
  try {
    const users = await adminService.getAllUsers();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addUser = async (req, res) => {
  try {
    const { user, tempPassword } = await adminService.createUser(req.body);
    res.status(201).json({
      success: true,
      message: 'User created. Credentials sent via email + SMS.',
      data: user,
      tempPassword, // TODO: remove in production — send via email only
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await adminService.updateUser(req.params.id, req.body);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.revokeUser = async (req, res) => {
  try {
    const { reason, notes } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Reason required' });
    const result = await adminService.revokeUser(req.params.id, reason, notes, req.user.sub);
    res.status(200).json({ success: true, message: 'Access revoked', data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await adminService.deleteUser(req.params.id);
    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};