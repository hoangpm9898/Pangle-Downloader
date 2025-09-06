const mongoose = require('mongoose');

const newFilmsSchema = new mongoose.Schema({
  file_id: { type: Number, required: true },
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
  process_id: { type: String, required: true }, // Format: yyyymmdd
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  // Create compound index for better query performance
  indexes: [
    { process_id: 1, file_id: 1 },
    { process_id: 1 }
  ]
});

module.exports = mongoose.model('NewFilms', newFilmsSchema);
