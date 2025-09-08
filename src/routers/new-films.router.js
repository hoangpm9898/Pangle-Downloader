const express = require('express');
const router = express.Router();

const NewFilmsService = require('../modules/new-films/new-films.service');
const { ApiError } = require('../common/filters/error.filter');

// GET endpoint to retrieve new films for a device
router.get('/list', async (req, res, next) => {
  try {
    const { device_id } = req.query;
    
    if (!device_id) {
      throw new ApiError(400, 'Device ID is required');
    }

    const result = await NewFilmsService.getNewFilmsForDevice(device_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET endpoint to retrieve statistics (for admin/debugging)
router.get('/statistics', async (req, res, next) => {
  try {
    const result = await NewFilmsService.getStatistics();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
