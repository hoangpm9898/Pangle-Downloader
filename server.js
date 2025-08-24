require('dotenv').config();

const express = require('express');

const { setupRouters, setupCrons } = require('./src/routers/index');
const { connectDB } = require('./src/common/configs/db.config');
const { errorHandler } = require('./src/common/filters/error.filter');
const { setupMiddlewares } = require('./src/app.middleware');

// API Server
const app = express();

// Middleware
setupMiddlewares(app);

// Connect to MongoDB
connectDB();

// Routes
setupRouters(app);

// Crons
setupCrons();

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`\n**** Server running on port ${PORT}`);
});
