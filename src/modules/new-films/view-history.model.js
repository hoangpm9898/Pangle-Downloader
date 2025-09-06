const mongoose = require('mongoose');

const viewHistorySchema = new mongoose.Schema({
  process_id: { type: String, required: true }, // Format: yyyymmdd
  device_id: { type: String, required: true },
  viewed_at: { type: Date, default: Date.now }
}, {
  // Create compound index to ensure one record per device per process
  indexes: [
    { process_id: 1, device_id: 1 },
    { process_id: 1 }
  ]
});

// Ensure unique combination of process_id and device_id
viewHistorySchema.index({ process_id: 1, device_id: 1 }, { unique: true });

module.exports = mongoose.model('ViewHistory', viewHistorySchema);
