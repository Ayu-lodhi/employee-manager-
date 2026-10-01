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

const addUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().allow('', null).optional(),
  role: Joi.string().valid('SUPER_ADMIN', 'ADMIN', 'T3_EXECUTIVE', 'T2_ASSOCIATE', 'T1_VOLUNTEER').optional(),
});

const schemas = {
  createEvent: createEventSchema,
  addUser: addUserSchema,
};

module.exports = {
  createEventSchema,
  addUserSchema,
  schemas,
  validate,
};
