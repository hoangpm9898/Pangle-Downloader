const cors = require('cors');
const express = require('express');

const setupMiddlewares = (app) => {

  const corsOptions = {
    origin: '*',                                          // Chỉ định origin cụ thể hoặc '*' cho tất cả
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Cho phép các method cần thiết
    allowedHeaders: ['Content-Type', 'Authorization'],    // Cho phép các header client gửi
    credentials: true,                                    // Cho phép gửi cookie/credentials (nếu cần)
    preflightContinue: false,                             // Ngăn server tự động trả về response cho OPTIONS
    optionsSuccessStatus: 204,                            // Trả về 204 No Content cho preflight
    maxAge: 86400,                                        // Cache preflight request trong 24h để giảm số lượng request OPTIONS
  };

  // CORS
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
}

module.exports = { setupMiddlewares }
