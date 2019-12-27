if (!process.env.CMS_ENDPOINT || !process.env.CMS_TOKEN) {
  require('dotenv').config();
}

if (!process.env.CMS_ENDPOINT || !process.env.CMS_TOKEN) {
  throw new Error(`Can't find environment variables: 'CMS_ENDPOINT' and 'CMS_TOKEN'.
  Set them in .env file for local development or pass to env when running on CI.
  `);
}

const conferenceTitle = 'React_Amsterdam';
const eventYear = 'Y2020';

const credentials = {
  endpoint: process.env.CMS_ENDPOINT,
  token: process.env.CMS_TOKEN,
};

module.exports = {
  conferenceTitle,
  eventYear,
  credentials,
};
