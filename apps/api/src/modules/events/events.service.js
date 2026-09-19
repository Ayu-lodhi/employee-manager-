const Event = require('./events.model');

exports.getAllEvents = async () => {
  return await Event.find().sort({ createdAt: -1 });
};

exports.getEventById = async (id) => {
  const event = await Event.findById(id);
  if (!event) throw new Error('Event not found');
  return event;
};

exports.createEvent = async (data, userId) => {
  const event = await Event.create({
    title: data.title,
    date: data.date,
    location: data.location,
    description: data.description || '',
    status: 'published',
    teams: 0,
    applicants: 0,
    createdBy: userId,
  });
  return event;
};

exports.updateEvent = async (id, data) => {
  const event = await Event.findByIdAndUpdate(id, data, { new: true });
  if (!event) throw new Error('Event not found');
  return event;
};

exports.deleteEvent = async (id) => {
  const event = await Event.findByIdAndDelete(id);
  if (!event) throw new Error('Event not found');
  return event;
};
