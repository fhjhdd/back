const crypto = require('crypto');

const generatePassword = () => {
  return crypto.randomBytes(4).toString('hex'); // 8-char password
};

module.exports = generatePassword;
