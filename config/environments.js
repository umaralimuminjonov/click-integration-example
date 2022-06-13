const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  PORT: process.env.PORT || 5000,
  CLICK_SECRET_KEY: process.env.CLICK_SECRET_KEY,
};
