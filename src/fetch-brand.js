const { markdownToHtml } = require('./markdown');
const { contentTypeMap } = require('./utils');

const queryPages = /* GraphQL */ `
  query($conferenceTitle: ConferenceTitle) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      city
      url
      title
      slackUrl
      twitterUrl
      facebookUrl
      mediumUrl
      youtubeUrl
      discordUrl
      gnPortal
      codeOfConductIntro
      codeOfConductMain
    }
  }
`;

const fetchData = async (client, vars) => {
  const conference = await client
    .request(queryPages, vars)
    .then(res => res.conf)
    .then(async conf => ({
      ...conf,
      codeOfConductIntro: await markdownToHtml(conf.codeOfConductIntro),
      codeOfConductMain: await markdownToHtml(conf.codeOfConductMain),
      contentType: contentTypeMap.ConferenceBrand,
    }));

  return {
    conference,
  };
};

module.exports = {
  fetchData,
  queryPages,
  getData: data => data.conf,
  story: 'brand',
};
