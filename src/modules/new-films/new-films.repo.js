const NewFilms = require('./new-films.model');
const ViewHistory = require('./view-history.model');

class NewFilmsRepository {

  // Save new films for a specific process
  async saveNewFilms(films, processId) {
    try {
      const filmsWithProcessId = films.map(film => ({
        ...film,
        process_id: processId,
        updated_at: new Date()
      }));

      // Use bulkWrite for efficient batch operations
      const bulkOps = filmsWithProcessId.map(film => ({
        updateOne: {
          filter: { file_id: film.file_id, process_id: processId },
          update: { $set: film },
          upsert: true
        }
      }));

      const result = await NewFilms.bulkWrite(bulkOps);
      console.log(`[!] - Saved ${result.upsertedCount + result.modifiedCount} new films for process ${processId}`);
      return result;
    } catch (error) {
      console.error(`[x] - Error saving new films for process ${processId}:`, error.message);
      throw error;
    }
  }

  // Get new films by process ID
  async getNewFilmsByProcessId(processId) {
    try {
      const films = await NewFilms.find({ process_id: processId }).sort({ created_at: -1 });
      return films;
    } catch (error) {
      console.error(`[x] - Error getting new films for process ${processId}:`, error.message);
      throw error;
    }
  }

  // Get latest process ID
  async getLatestProcessId() {
    try {
      const latestRecord = await NewFilms.findOne().sort({ process_id: -1 }).select('process_id');
      return latestRecord ? latestRecord.process_id : null;
    } catch (error) {
      console.error(`[x] - Error getting latest process ID:`, error.message);
      throw error;
    }
  }

  // Check if device has viewed films for a specific process
  async hasDeviceViewed(processId, deviceId) {
    try {
      const record = await ViewHistory.findOne({ process_id: processId, device_id: deviceId });
      return !!record;
    } catch (error) {
      console.error(`[x] - Error checking device view history:`, error.message);
      throw error;
    }
  }

  // Mark device as viewed for a specific process
  async markDeviceAsViewed(processId, deviceId) {
    try {
      const result = await ViewHistory.updateOne(
        { process_id: processId, device_id: deviceId },
        { 
          process_id: processId, 
          device_id: deviceId, 
          viewed_at: new Date() 
        },
        { upsert: true }
      );
      return result;
    } catch (error) {
      console.error(`[x] - Error marking device as viewed:`, error.message);
      throw error;
    }
  }

  // Clear view history for old process IDs (keep only current process)
  async clearOldViewHistory(currentProcessId) {
    try {
      const result = await ViewHistory.deleteMany({ 
        process_id: { $ne: currentProcessId } 
      });
      console.log(`[!] - Cleared ${result.deletedCount} old view history records`);
      return result;
    } catch (error) {
      console.error(`[x] - Error clearing old view history:`, error.message);
      throw error;
    }
  }

  // Get count of new films for a specific process
  async getNewFilmsCount(processId) {
    try {
      const count = await NewFilms.countDocuments({ process_id: processId });
      return count;
    } catch (error) {
      console.error(`[x] - Error getting new films count:`, error.message);
      throw error;
    }
  }

  // Clean up old films data (optional - keep only last N process IDs)
  async cleanupOldFilms(keepLastNProcesses = 7) {
    try {
      // Get unique process IDs sorted in descending order
      const processIds = await NewFilms.distinct('process_id');
      processIds.sort((a, b) => b.localeCompare(a)); // Sort descending

      if (processIds.length > keepLastNProcesses) {
        const processIdsToDelete = processIds.slice(keepLastNProcesses);
        const result = await NewFilms.deleteMany({ 
          process_id: { $in: processIdsToDelete } 
        });
        console.log(`[!] - Cleaned up ${result.deletedCount} old films records for ${processIdsToDelete.length} old processes`);
        return result;
      }
      return { deletedCount: 0 };
    } catch (error) {
      console.error(`[x] - Error cleaning up old films:`, error.message);
      throw error;
    }
  }
}

module.exports = new NewFilmsRepository();
