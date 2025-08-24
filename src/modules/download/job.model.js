
const mongoose = require('mongoose');

const downloadJobSchema = new mongoose.Schema({
  jobId: { type: Number, unique: true },
  filmId: { type: Number, required: true },
  episode: { type: Number, required: true },
  clientId: { type: String, required: true },
  result_file_path: String,
  result_link: String,
  download_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('DownloadJob', downloadJobSchema, 'download_jobs');
