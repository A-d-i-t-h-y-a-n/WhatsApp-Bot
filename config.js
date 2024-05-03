require('dotenv').config();

const toBool = (x) => x == 'true'
module.exports = {
  HANDLERS: (process.env.HANDLERS || '^[.,!]').trim(),
  MODE: (process.env.MODE || 'public').toLowerCase(),
  ERROR_MSG: toBool(process.env.ERROR_MSG) || true,
  LOG_MSG: toBool(process.env.LOG_MSG) || true,
  READ_CMD: toBool(process.env.READ_CMD),
  READ_MSG: toBool(process.env.READ_MSG),
  SUDO: process.env.SUDO || '',
};