
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  res.status(500).json({ message: 'Internal server error' });
};

module.exports = { ApiError, errorHandler };
