
const pangleRouter = require('./pangle.router');
const downloadRouter = require('./download.router');

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
}

// Crons
const setupCrons = () => {
  // Cleanup
  const cleanupCron = require('../modules/cron/cleanup.cron');
}

module.exports = { setupRouters, setupCrons }
