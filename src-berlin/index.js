const { GraphQLClient } = require('graphql-request');

const { credentials, conferenceTitle, eventYear } = require('./config');
const textContent = require('./fetch-texts');
const pageContent = require('./fetch-pages');
const brandContent = require('./fetch-brand');
const speakerContent = require('./fetch-speakers');
const sponsorContent = require('./fetch-sponsors');
const talksContent = require('./fetch-talks');
const workshopContent = require('./fetch-workshops');
const mcContent = require('./fetch-mc');
const jobsContent = require('./fetch-jobs');

const createClient = ({ endpoint, token }) => {
  return new GraphQLClient(endpoint, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
};

const client = createClient(credentials);

const getContent = async () => {
  const fetchAll = [
    textContent,
    pageContent,
    brandContent,
    speakerContent,
    sponsorContent,
    talksContent,
    workshopContent,
    mcContent,
    jobsContent,
  ].map(async content => {
    try {
      return await content.fetchData(client, { conferenceTitle, eventYear });
    } catch (err) {
      console.error(err);
    }
  });

  const contentArray = await Promise.all(fetchAll);
  const contentMap = contentArray.reduce((content, piece) => {
    try {
      const newKeys = Object.keys(piece);
      const existentKeys = Object.keys(content);
      const intersectedKeys = newKeys.filter(k => existentKeys.includes(k));
      intersectedKeys.forEach(k => {
        piece[k] = { ...content[k], ...piece[k] };
      });
    } catch (err) {}
    return { ...content, ...piece };
  }, {});
  return contentMap;
};

module.exports = {
  getContent,
};
