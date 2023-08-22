const crypto = require('crypto');

function generateApiKey() {
  const apiKey = crypto.randomBytes(16).toString('hex');
  return apiKey;
}

const apiKey = generateApiKey();
console.log('Generated API Key:', apiKey);
