const { prepareSpeakers, trySelectSettings } = require('./utils');
const { speakerInfoFragment } = require('./fragments');

const selectSettings = trySelectSettings(s => s.speakerAvatar.dimensions, {
  avatarWidth: 500,
  avatarHeight: 500,
});

const queryPages = /* GraphQL */ `
  query($conferenceTitle: ConferenceTitle, $eventYear: EventYear, $avatarWidth: Int, $avatarHeight: Int) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      status
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        status
        openForTalks
        speakers: pieceOfSpeakerInfoes {
          ...speakerInfo
        }
      }
    }
  }

  ${speakerInfoFragment}
`;

const fetchData = async (client, vars) => {
  const data = await client.request(queryPages, vars).then(res => ({
    speakers: res.conf.year[0].speakers,
    openForTalks: res.conf.year[0].openForTalks,
  }));

  const { openForTalks } = data;

  const speakers = await prepareSpeakers(data.speakers);

  return {
    speakers: { main: await Promise.all(speakers) },
    speakersBtn: openForTalks ? 'CALL FOR SPEAKERS' : false,
  };
};

module.exports = {
  fetchData,
  selectSettings,
  queryPages,
  getData: data => data.conf.year[0].speakers,
  story: 'speakers',
};
