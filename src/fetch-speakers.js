const { prepareSpeakers, trySelectSettings } = require('./utils');
const { speakerInfoFragment, sponsorLogoFragment } = require('./fragments');
const dayjs = require('dayjs');

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
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        openForTalks
        speakers: pieceOfSpeakerInfoes {
          ...speakerInfo
          avatar {
            ...imageUrl
          }
          activities: speaker {
            lightningTalks(
              where: {
                track: {
                  conferenceEvent: {
                    year: $eventYear
                    conferenceBrand: { title: $conferenceTitle }
                  }
                }
              }
            ) {
              id
              title
              description
              timeString: isoDate
              track {
                name
                isPrimary
              }
            }
            talks(
              where: {
                track: {
                  conferenceEvent: {
                    year: $eventYear
                    conferenceBrand: { title: $conferenceTitle }
                  }
                }
              }
            ) {
              id
              title
              label
              description
              timeString: isoDate
              track {
                name
                isPrimary
              }
            }
          }
        }
      }
    }
  }

  ${speakerInfoFragment}
  ${sponsorLogoFragment}
`;

const fetchData = async (client, { tagColors, labelColors, ...vars }) => {
  const data = await client.request(queryPages, vars).then(res => ({
    speakers: res.conf.year[0].speakers,
    openForTalks: res.conf.year[0].openForTalks,
  }));

  const { openForTalks } = data;

  const convertDateToIso = item => ({
    ...item,
    timeString: item.timeString ? dayjs(item.timeString).toISOString() : null,
  });

  const speakersWithPlainActivities = data.speakers.map(speaker => ({
    ...speaker,
    activities: {
      talks: [
        ...speaker.activities.lightningTalks.map(convertDateToIso),
        ...speaker.activities.talks.map(convertDateToIso),
      ],
    },
  }));

  const speakers = await prepareSpeakers(
    speakersWithPlainActivities,
    tagColors,
    labelColors,
  );

  const allSpeakers = await Promise.all(speakers);

  const daySpeakers = allSpeakers.filter(
    ({ isNightSpeaker }) => !isNightSpeaker,
  );
  const eveningSpeakers = allSpeakers.filter(
    ({ isNightSpeaker }) => isNightSpeaker,
  );

  return {
    speakers: { main: daySpeakers },
    eveningSpeakers,
    speakersBtn: openForTalks ? 'CALL FOR SPEAKERS' : false,
    labelColors,
  };
};

module.exports = {
  fetchData,
  selectSettings,
  queryPages,
  getData: data => data.conf.year[0].speakers,
  story: 'speakers',
};
