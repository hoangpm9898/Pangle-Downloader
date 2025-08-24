const express = require('express');
const router = express.Router();

const DownloadService = require('../modules/download/download.service');

/**
 * Download all episodes of a film
 */
router.post('/', async (req, res, next) => {
  try {
    const { clientId, filmId, filmName, filmLang } = req.body;
    const jobIds = await DownloadService.downloadAllEpisodes(clientId, filmId, filmName, filmLang);
    res.json({ success: true, jobIds });
  } catch (error) {
    next(error);
  }
});

/**
 * List download jobs
 */ 
router.get('/job/history', async (req, res, next) => {
  try {
    const history = await DownloadService.getDownloadJobHistory(req.query);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

/**
 * Get process status & result
 */ 
router.get('/job/status/:jobId', async (req, res, next) => {
  try {
    const status = await DownloadService.getDownloadJobStatus(parseInt(req.params.jobId));
    res.json(status);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
