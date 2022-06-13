module.exports = (error, req, res, next) => {
  // Logger
  console.log(error);

  // Responder
  res.status(error.statusCode).json({
    error,
  });
};
