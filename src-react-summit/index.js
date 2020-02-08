const { GraphQLClient } = require('graphql-request');
const chalk = require('chalk');

const { credentials, conferenceTitle, eventYear } = require('./config');
const textContent = require('./fetch-texts');
const pageContent = require('./fetch-pages');
const brandContent = require('./fetch-brand');
const speakerContent = require('./fetch-speakers');
const sponsorContent = require('./fetch-sponsors');
const talksContent = require('./fetch-talks');
const workshopContent = require('./fetch-workshops');
const mcContent = require('./fetch-mc');
const advisersContent = require('./fetch-advisers');
const faqContent = require('./fetch-faq');
const extContent = require('./fetch-extended');
const jobsContent = require('./fetch-jobs');

const createClient = ({ endpoint, token }) => {
  const GQLClient = new GraphQLClient(endpoint, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  return {
    request: (...args) => {
      return GQLClient.request(...args).catch(err => {
        if (err.request && err.response) {
          const logger = {
            logs: [],
            log: function(...args) {
              this.logs.push(...args, '\n');
            },
            output: function() {
              console.log(...this.logs);
            },
          };
          logger.log('Error in query: \n', chalk.yellow(err.request.query));
          logger.log(
            'variables: ',
            chalk.green(JSON.stringify(err.request.variables, null, 2))
          );
          err.response.errors.forEach(({ message, locations }) =>
            logger.log(
              'error: ',
              chalk.red(message),
              chalk.gray(JSON.stringify(locations))
            )
          );
          logger.output();
          throw 'error in GraphQL query';
        }
        throw err;
      });
    },
  };
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
    advisersContent,
    faqContent,
    extContent,
    jobsContent,
  ].map(async content => {
    try {
      return await content.fetchData(client, { conferenceTitle, eventYear });
    } catch (err) {
      throw err;
      // console.error(err);
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
