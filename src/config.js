if (!process.env.CMS_ENDPOINT || !process.env.CMS_TOKEN) {
  // eslint-disable-next-line global-require
  require('dotenv').config();
}

if (!process.env.CMS_ENDPOINT || !process.env.CMS_TOKEN) {
  throw new Error(`Can't find environment variables: 'CMS_ENDPOINT' and 'CMS_TOKEN'.
  Set them in .env file for local development or pass to env when running on CI.
  `);
}

const credentials = {
  endpoint: process.env.CMS_ENDPOINT,
  token: process.env.CMS_TOKEN,
};

module.exports = {
  credentials,
};
