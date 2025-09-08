
const pangleRouter = require('./pangle.router');
const downloadRouter = require('./download.router');
const newFilmsRouter = require('./new-films.router');

// Timeout config
const setRouteTimeout = (req, res, next) => {
  res.setTimeout(300000, () => {
    res.status(408).json({ error: 'Request Timeout after 5 minutes' });
  });
  next();
};

// Routes
const setupRouters = (app) => {
  app.use('/api/v1/pangle', pangleRouter);
  app.use('/api/v1/download', downloadRouter);
  app.use('/api/v1/new-films', newFilmsRouter);
}

// Crons
const setupCrons = () => {
  // Cleanup
  const cleanupCron = require('../modules/cron/cleanup.cron');
  // Auto-fetch films daily
  const autoFetchCron = require('../modules/cron/auto-fetch.cron');
}

module.exports = { setupRouters, setupCrons }
