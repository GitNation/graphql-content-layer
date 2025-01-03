const { prepareSpeakers, trySelectSettings, sortByOrder } = require('./utils');
const { speakerInfoFragment, sponsorLogoFragment } = require('./fragments');
const dayjs = require('dayjs');
const { getSpeakers, getPastSpeakers } = require('./http-utils');

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
        emsEventId
        useEmsData
        speakers: pieceOfSpeakerInfoes {
          ...speakerInfo
          avatar {
            handle
            mimeType
            url(
              transformation: {
                image: {
                  resize: {
                    width: $avatarWidth
                    height: $avatarHeight
                    fit: crop
                  }
                }
                document: { output: { format: jpg } }
              }
            )
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
          offlineActivities: speaker {
            lightningTalks(
              where: {
                track: {
                  conferenceOfflineEvent: {
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
                  conferenceOfflineEvent: {
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
`;

const fetchData = async (client, { tagColors, labelColors, ...vars }) => {
  const data = await client.request(queryPages, vars).then(res => ({
    speakers: res.conf.year[0].speakers,
    openForTalks: res.conf.year[0].openForTalks,
    emsEventId: res.conf.year[0].emsEventId,
    useEmsData: res.conf.year[0].useEmsData,
  }));

  let emsSpeakers, pastSpeakers;
  if (data.useEmsData) {
    [emsSpeakers, pastSpeakers] = await Promise.all([
      getSpeakers(data.emsEventId),
      getPastSpeakers(data.emsEventId),
    ]);
  }

  const { openForTalks } = data;

  const [
    { daySpeakers, eveningSpeakers },
    { daySpeakers: daySpeakersPast, eveningSpeakers: eveningSpeakersPast },
  ] = await Promise.all(
    [emsSpeakers || data.speakers || [], pastSpeakers || []].map(speakers =>
      processSpeakers(speakers, tagColors, labelColors),
    ),
  );

  return {
    speakers: { main: daySpeakers },
    eveningSpeakers,
    pastSpeakers: {
      main: daySpeakersPast,
      eveningSpeakers: eveningSpeakersPast,
    },
    speakersBtn: openForTalks ? 'CALL FOR SPEAKERS' : false,
    labelColors,
  };
};

const convertDateToIso = item => ({
  ...item,
  timeString: item.timeString ? dayjs(item.timeString).toISOString() : null,
});

const processSpeakers = async (rawSpeakers, tagColors, labelColors) => {
  const speakersWithPlainActivities = rawSpeakers.map(speaker => {
    if (!speaker.activities) {
      console.log('invalid activities', JSON.stringify(speaker));
    }

    if (!speaker.speaker || !speaker.speaker.avatar) {
      console.log('invalid speaker', JSON.stringify(speaker));
    }

    const {
      activities,
      offlineActivities,
      allActivities,
      ...restSpeakerData
    } = speaker;

    return {
      ...restSpeakerData,
      activities: {
        talks: [
          ...(activities
            ? activities.lightningTalks.map(convertDateToIso)
            : []),
          ...(activities ? activities.talks.map(convertDateToIso) : []),
        ],
        offlineTalks: [
          ...(offlineActivities
            ? offlineActivities.lightningTalks.map(convertDateToIso)
            : []),
          ...(offlineActivities
            ? offlineActivities.talks.map(convertDateToIso)
            : []),
        ],
        allTalks: [
          ...(allActivities
            ? allActivities.lightningTalks.map(convertDateToIso)
            : []),
          ...(allActivities ? allActivities.talks.map(convertDateToIso) : []),
        ],
      },
    };
  });

  const speakers = await prepareSpeakers(
    speakersWithPlainActivities,
    tagColors,
    labelColors,
    true,
  );

  const allSpeakers = await Promise.all(speakers);

  const daySpeakers = allSpeakers.filter(
    ({ isNightSpeaker }) => !isNightSpeaker,
  );
  const eveningSpeakers = allSpeakers.filter(
    ({ isNightSpeaker }) => isNightSpeaker,
  );

  return { daySpeakers, eveningSpeakers };
};

module.exports = {
  fetchData,
  selectSettings,
  queryPages,
  getData: data => data.conf.year[0].speakers,
  story: 'speakers',
};
