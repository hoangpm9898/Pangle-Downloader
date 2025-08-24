
const mongoose = require('mongoose');

const pangleSchema = new mongoose.Schema({
  file_id: { type: Number, required: true, unique: true },
  shortplay_id: Number,
  title: String,
  desc: String,
  cover_image: String,
  lang: String,
  voice_lang: String,
  categories: [{ id: Number, name: String }],
  progress_state: Number,
  total: Number,
  is_test: Number,
  provider: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pangle', pangleSchema);
