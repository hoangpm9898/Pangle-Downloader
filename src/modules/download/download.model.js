
const mongoose = require('mongoose');

const downloadSchema = new mongoose.Schema({
  file_id: { type: Number, required: true },
  shortplay_id: Number,
  lang: String,
  voice_lang: String,
  episode_list: [{
    index: Number,
    name: String,
    play_url: String,
    download_url: String,
    file_path: String,
    video_size: String,
    downloaded_at: Date
  }],
  dir_path: String,
  fetched_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Download', downloadSchema, 'downloads');
