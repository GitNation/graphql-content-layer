const { getLandingLinks } = require('./http-utils');

const queryPages = /* GraphQL */ `
  query($conferenceTitle: ConferenceTitle, $eventYear: EventYear) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        emsEventId
      }
    }
  }
`;

const fetchData = async (client, vars) => {
  const data = await client.request(queryPages, vars).then(res => {
    return res.conf.year[0].emsEventId;
  });

  const landingLinks = (await getLandingLinks(data)) || [];

  return {
    landingLinks,
  };
};

module.exports = {
  fetchData,
  queryPages,
  getData: res => res,
  story: 'landingLinks',
};
