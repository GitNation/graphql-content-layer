const { prepareSpeakers, trySelectSettings } = require('./utils');
const { personFragment } = require('./fragments');

const selectSettings = trySelectSettings(s => s.speakerAvatar.dimensions, {
  avatarWidth: 500,
  avatarHeight: 500,
});

const queryPages = /* GraphQL */ `
  query(
    $conferenceTitle: ConferenceTitle
    $eventYear: EventYear
    $avatarWidth: Int
    $avatarHeight: Int
  ) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        performanceTeam {
          ...person
        }
      }
    }
  }

  ${personFragment}
`;

const fetchData = async (client, vars) => {
  const data = await client
    .request(queryPages, vars)
    .then(res => res.conf.year[0].performanceTeam);

  const speakers = await prepareSpeakers(
    data.map(speaker => ({ speaker, decor: true })),
    {},
  );

  return {
    speakers: { performanceTeam: await Promise.all(speakers) },
  };
};

module.exports = {
  fetchData,
  selectSettings,
  queryPages,
  getData: data => data.conf.year[0].performanceTeam,
  story: 'performance',
};
