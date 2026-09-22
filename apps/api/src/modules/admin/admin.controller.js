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
      message: 'User created. Credentials sent via email.',
      data: user,
      tempPassword,
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

// REVOKE — deactivate + kill sessions
exports.revokeUser = async (req, res) => {
  try {
    const { reason, notes } = req.body;
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ success: false, message: 'Reason is required' });
    }
    const result = await adminService.revokeUser(req.params.id, reason, notes, req.user.sub);
    res.status(200).json({
      success: true,
      message: `${result.name}'s access has been revoked.`,
      data: result,
    });
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

// RESET PASSWORD — generates new temp password + emails it
exports.resetPassword = async (req, res) => {
  try {
    const { user, tempPassword, emailSent } = await adminService.resetPassword(req.params.id, req.user?.sub);
    res.status(200).json({
      success: true,
      message: emailSent
        ? `Password reset. New credentials emailed to ${user.email}.`
        : `Password reset. Email delivery failed — share password manually.`,
      data: user,
      tempPassword,
      emailSent,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.setPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await adminService.setPassword(req.params.id, newPassword);
    res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
      data: user,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};