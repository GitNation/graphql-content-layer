const { prepareSpeakers } = require('./utils');
const { speakerFragment } = require('./fragments');

const queryPages = /* GraphQL */ `
  query($conferenceTitle: ConferenceTitle, $eventYear: EventYear) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      status
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        status
        openForTalks
        speakers: pieceOfSpeakerInfoes(orderBy: order_DESC) {
          ...speaker
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

  ${speakerFragment}
`;

const fetchData = async (client, vars) => {
  const data = await client.request(queryPages, vars).then(res => ({
    speakers: res.conf.year[0].speakers,
    openForTalks: res.conf.year[0].openForTalks,
  }));

  const { openForTalks } = data;
  const speakers = await prepareSpeakers(data.speakers);

  const allSpeakers = await Promise.all(speakers);

  const daySpeakers = allSpeakers.filter(
    ({ isNightSpeaker }) => !isNightSpeaker
  );
  const eveningSpeakers = allSpeakers.filter(
    ({ isNightSpeaker }) => isNightSpeaker
  );

  return {
    speakers: { main: daySpeakers },
    eveningSpeakers,
    speakersBtn: openForTalks ? 'Submit a talk' : false,
  };
};

module.exports = {
  fetchData,
};
