const { prepareSpeakers, trySelectSettings } = require('./utils');
const { personFragment } = require('./fragments');
const { getCommittee } = require('./http-utils');

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
        emsEventId
        useEmsData
        committee {
          ...person
        }
      }
    }
  }

  ${personFragment}
`;

const fetchData = async (client, vars) => {
  const data = await client.request(queryPages, vars).then(res => ({
    ...res.conf.year[0],
  }));

  const { committee: cmsCommittee, useEmsData, emsEventId } = data;

  // prioritize CMS committee
  const rawCommittee =
    cmsCommittee && cmsCommittee.length
      ? cmsCommittee.map(item => ({ speaker: item }))
      : useEmsData
      ? await getCommittee(emsEventId)
      : [];

  const speakers = await Promise.all(
    prepareSpeakers(
      rawCommittee.map(speaker => ({ ...speaker, decor: true })),
      {},
    ),
  );

  return {
    speakers: { committee: speakers },
  };
};

module.exports = {
  fetchData,
  selectSettings,
  queryPages,
  getData: data => data.conf.year[0].committee,
  story: 'Programme Committee',
};
