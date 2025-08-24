
const Joi = require('joi');

const pangleFilterSchema = Joi.object({
  category_ids: Joi.array().items(Joi.number()).optional(),
  lang: Joi.array().items(Joi.string()).optional(),
  voice_lang: Joi.array().items(Joi.string()).optional(),
  title: Joi.string().optional(),
  page: Joi.number().min(1).default(1),
  page_size: Joi.number().min(1).max(1000).default(100)
});

const pangleDownloadSchema = Joi.object({
  filmId: Joi.number().required(),
  episodeIdxs: Joi.array().items(Joi.number()).default([1,2,3,4,5,6,7,8,9,10])
});

module.exports = { pangleFilterSchema, pangleDownloadSchema };
