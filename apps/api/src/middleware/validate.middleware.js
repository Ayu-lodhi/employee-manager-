const Joi = require('joi');

const createEventSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  date: Joi.string().required(),
  location: Joi.string().min(2).max(200).required(),
  description: Joi.string().allow('').max(2000),
  // Accept empty string OR valid ObjectId
  headId: Joi.string().allow('', null).optional(),
  // Members array — optional
  memberIds: Joi.array().items(Joi.string()).optional(),
});

const validate = (schema) => (req, res, next) => {
  if (!schema) return next();
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details.map((d) => d.message).join(', '),
    });
  }
  next();
};

const schemas = {
  createEvent: createEventSchema,
};

module.exports = {
  createEventSchema,
  schemas,
  validate,
};
