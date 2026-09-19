const Application = require('./applications.model');

exports.getAllApplications = async () => {
  return await Application.find().sort({ appliedAt: -1 });
};

exports.getMyApplications = async (userId) => {
  return await Application.find({ studentId: userId }).sort({ appliedAt: -1 });
};

exports.createApplication = async (data, user) => {
  const existing = await Application.findOne({
    studentId: user.sub,
    eventId: data.eventId,
  });
  if (existing) throw new Error('Already applied to this event');

  return await Application.create({
    studentId: user.sub,
    studentName: user.name || 'Unknown',
    studentEmail: user.email || 'unknown@tbi.org',
    eventId: data.eventId,
    eventTitle: data.eventTitle || '',
    role: data.role || 'Team Member',
    status: 'pending',
  });
};

exports.updateStatus = async (id, status, reviewerId) => {
  const valid = ['approved', 'rejected', 'waitlisted'];
  if (!valid.includes(status)) throw new Error('Invalid status');

  const app = await Application.findByIdAndUpdate(
    id,
    { status, reviewedBy: reviewerId, reviewedAt: new Date() },
    { new: true }
  );
  if (!app) throw new Error('Application not found');
  return app;
};
