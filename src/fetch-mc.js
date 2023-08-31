const { prepareSpeakers, trySelectSettings } = require('./utils');
const { personFragment } = require('./fragments');
const { getMcs } = require('./http-utils');

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

const fetchData = async (client, vars) => {
  const data = await client.request(queryPages, vars).then(res => ({
    ...res.conf.year[0],
  }));

  const { mcs: cmsMcs, useEmsData, emsEventId } = data;

  // prioritize CMS MCs
  const rawMcs =
    cmsMcs && cmsMcs.length
      ? cmsMcs
      : useEmsData
      ? await getMcs(emsEventId)
      : [];
  const mcs = await Promise.all(prepareSpeakers(rawMcs, {}));

  return {
    mcs,
  };
};

module.exports = {
  fetchData,
  selectSettings,
  queryPages,
  getData: data => data.conf.year[0].mcs,
  story: 'MCs',
};
