const { prepareSpeakers } = require('./utils');
const { personFragment } = require('./fragments');

const queryPages = /* GraphQL */ `
  query($conferenceTitle: ConferenceTitle, $eventYear: EventYear) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      status
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        status
        mcs {
          id
          speaker {
          ...person
          }
        }
      }
    }
  }

  ${personFragment}
`;

const fetchData = async(client, vars) => {
  const data = await client
    .request(queryPages, vars)
    .then(res => res.conf.year[0].mcs);

  const mcs = await prepareSpeakers(data);

  return {
    mcs: await Promise.all(mcs),
  };
};

module.exports = {
  fetchData,
  queryPages,
  getData: data => data.conf.year[0].mcs,
  story: 'MCs',
};
