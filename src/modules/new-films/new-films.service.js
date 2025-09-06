const NewFilmsRepository = require('./new-films.repo');
const { ResponseListData } = require('../../common/types/api.response.type');

class NewFilmsService {

  // Generate process ID in format yyyymmdd
  generateProcessId(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  // Save newly fetched films for current process
  async saveNewFilms(films) {
    try {
      if (!films || films.length === 0) {
        console.log('[!] No new films to save');
        return { success: true, count: 0, processId: null };
      }

      const currentProcessId = this.generateProcessId();
      console.log(`[!] Saving ${films.length} new films for process ${currentProcessId}`);

      // Save films to NewFilms collection
      await NewFilmsRepository.saveNewFilms(films, currentProcessId);

      // Clear old view history (keep only current process)
      await NewFilmsRepository.clearOldViewHistory(currentProcessId);

      // Optional: Clean up very old films data (keep last 7 days)
      await NewFilmsRepository.cleanupOldFilms(7);

      return {
        success: true,
        count: films.length,
        processId: currentProcessId
      };
    } catch (error) {
      console.error('[x] Error saving new films:', error.message);
      return {
        success: false,
        error: error.message,
        count: 0,
        processId: null
      };
    }
  }

  // Get new films for a client device
  async getNewFilmsForDevice(deviceId) {
    try {
      if (!deviceId) {
        return new ResponseListData({
          success: false,
          data: [],
          message: 'Device ID is required'
        });
      }

      // Get latest process ID
      const latestProcessId = await NewFilmsRepository.getLatestProcessId();
      
      if (!latestProcessId) {
        console.log('[!] No new films available');
        return new ResponseListData({
          success: true,
          data: [],
          message: 'No new films available',
          processId: null
        });
      }

      console.log(`[!] Checking new films for device ${deviceId}, process ${latestProcessId}`);

      // Check if device has already viewed films for this process
      const hasViewed = await NewFilmsRepository.hasDeviceViewed(latestProcessId, deviceId);
      
      if (hasViewed) {
        console.log(`[!] Device ${deviceId} has already viewed films for process ${latestProcessId}`);
        return new ResponseListData({
          success: true,
          data: [],
          message: 'No new films for this device',
          processId: latestProcessId
        });
      }

      // Get new films for the latest process
      const newFilms = await NewFilmsRepository.getNewFilmsByProcessId(latestProcessId);
      
      if (newFilms.length === 0) {
        console.log(`[!] No films found for process ${latestProcessId}`);
        return new ResponseListData({
          success: true,
          data: [],
          message: 'No new films available',
          processId: latestProcessId
        });
      }

      // Mark device as viewed
      await NewFilmsRepository.markDeviceAsViewed(latestProcessId, deviceId);
      
      console.log(`[!] Returning ${newFilms.length} new films for device ${deviceId}`);
      
      return new ResponseListData({
        success: true,
        data: newFilms,
        message: `${newFilms.length} new films found`,
        processId: latestProcessId
      });

    } catch (error) {
      console.error('[x] Error getting new films for device:', error.message);
      return new ResponseListData({
        success: false,
        data: [],
        message: error.message
      });
    }
  }

  // Get statistics about new films and views
  async getStatistics() {
    try {
      const latestProcessId = await NewFilmsRepository.getLatestProcessId();
      
      if (!latestProcessId) {
        return {
          success: true,
          processId: null,
          newFilmsCount: 0,
          viewedDevicesCount: 0
        };
      }

      const newFilmsCount = await NewFilmsRepository.getNewFilmsCount(latestProcessId);
      
      // Count unique devices that have viewed
      const ViewHistory = require('./view-history.model');
      const viewedDevicesCount = await ViewHistory.countDocuments({ process_id: latestProcessId });

      return {
        success: true,
        processId: latestProcessId,
        newFilmsCount,
        viewedDevicesCount
      };
    } catch (error) {
      console.error('[x] Error getting statistics:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new NewFilmsService();
