const { GraphQLClient } = require('graphql-request');

const { credentials, conferenceTitle, eventYear } = require('./config');
const textContent = require('./fetch-texts');
const pageContent = require('./fetch-pages');
const brandContent = require('./fetch-brand');
const speakerContent = require('./fetch-speakers');
const performanceContent = require('./fetch-performance');
const sponsorContent = require('./fetch-sponsors');
const talksContent = require('./fetch-talks');
const workshopContent = require('./fetch-workshops');
const mcContent = require('./fetch-mc');
const faqContent = require('./fetch-faq');
const extContent = require('./fetch-extended');
const jobsContent = require('./fetch-jobs');
const committeeContent = require('./fetch-committee');

const createClient = ({ endpoint, token }) => {
  return new GraphQLClient(endpoint, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
};

const client = createClient(credentials);
const queriesData = [];

const getQueriesData = content => {
  try {
    const { fetchData, ...data } = content;
    if (!Object.keys(data).length) return;
    queriesData.push(data);
  } catch (err) {}
};

const getContent = async () => {
  const fetchAll = [
    textContent,
    pageContent,
    brandContent,
    speakerContent,
    performanceContent,
    sponsorContent,
    talksContent,
    workshopContent,
    mcContent,
    faqContent,
    extContent,
    jobsContent,
    committeeContent,
  ].map(async content => {
    try {
      getQueriesData(content);
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
  queriesData,
};
