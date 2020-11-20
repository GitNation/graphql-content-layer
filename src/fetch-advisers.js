const { trySelectSettings } = require('./utils');
const { personFragment } = require('./fragments');

const selectSettings = trySelectSettings(
  s => ({
    ...s.speakerAvatar.dimensions,
    tagColors: s.tagColors,
    labelColors: s.labelColors,
  }),
  {
    avatarWidth: 500,
    avatarHeight: 500,
    tagColors: {},
  },
);

const queryPages = /* GraphQL */ `
  query(
    $conferenceTitle: ConferenceTitle
    $eventYear: EventYear
    $avatarWidth: Int
    $avatarHeight: Int
  ) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      year: conferenceEvents(
        where: { year: $eventYear, adviceLounges_some: {} }
      ) {
        id
        schedule: adviceLounges {
          expertise
          speaker {
            ...person
          }
        }
      }
    }
  }
  ${personFragment}
`;

const fetchData = async (client, { tagColors, labelColors, ...vars }) => {
  const data = await client
    .request(queryPages, vars)
    .then(res => (res.conf.year[0] ? res.conf.year[0].schedule : []));

  const advisers = data
    .map(({ expertise, speaker }) => ({
      expertise,
      speaker: speaker || {},
    }))
    .map(
      ({
        expertise,
        speaker: {
          name,
          company,
          bio,
          githubUrl,
          twitterUrl,
          mediumUrl,
          ownSite,
          avatar,
        },
      }) => ({
        expertise,
        name,
        photo: avatar && avatar.url,
        company,
        desc: bio,
        github: githubUrl,
        twitter: twitterUrl,
        medium: mediumUrl,
        site: ownSite,
      }),
    );

  return {
    speakers: { advisers },
  };
};

module.exports = {
  fetchData,
  selectSettings,
  queryPages,
  getData: data => data.conf.year[0].schedule[0].adviceLounges,
  story: 'advisers',
};
