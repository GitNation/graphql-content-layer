const { prepareSpeakers, trySelectSettings } = require('./utils');
const { speakerInfoFragment } = require('./fragments');

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
      status
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        status
        openForTalks
        speakers: pieceOfSpeakerInfoes(orderBy: order_DESC) {
          ...speakerInfo
          activities: speaker {
            talks(
              where: {
                daySchedule: {
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
              timeString
              isLightning
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
  }));

  const { openForTalks } = data;

  const speakers = await prepareSpeakers(data.speakers, tagColors, labelColors);

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
