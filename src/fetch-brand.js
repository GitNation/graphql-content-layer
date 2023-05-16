const { markdownToHtml } = require('./markdown');
const { contentTypeMap } = require('./utils');
const { getBrand } = require('./http-utils');

const queryPages = /* GraphQL */ `
  query($conferenceTitle: ConferenceTitle, $eventYear: EventYear) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      city
      url
      title
      slackUrl
      twitterUrl
      facebookUrl
      instagramUrl
      tiktokUrl
      linkedinUrl
      mediumUrl
      youtubeUrl
      discordUrl
      gnPortal
      codeOfConductIntro
      codeOfConductMain
      events: conferenceEvents(where: { year: $eventYear }) {
        emsEventId
      }
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

  const { emsEventId } = conference.events[0];
  const emsBrand = await getBrand(emsEventId);

  return {
    conference,
    emsBrand,
  };
};

module.exports = {
  fetchData,
  queryPages,
  getData: data => data.conf,
  story: 'brand',
};
