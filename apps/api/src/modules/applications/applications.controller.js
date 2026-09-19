const appService = require('./applications.service');

exports.getApplications = async (req, res) => {
  try {
    const apps = await appService.getAllApplications();
    res.status(200).json({ success: true, data: apps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const apps = await appService.getMyApplications(req.user.sub);
    res.status(200).json({ success: true, data: apps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createApplication = async (req, res) => {
  try {
    const app = await appService.createApplication(req.body, req.user);
    res.status(201).json({ success: true, message: 'Application submitted', data: app });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const app = await appService.updateStatus(req.params.id, status, req.user.sub);
    res.status(200).json({ success: true, message: `Application ${status}`, data: app });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
