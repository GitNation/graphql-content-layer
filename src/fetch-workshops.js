const { markdownToHtml } = require('./markdown');
const { prepareSpeakers } = require('./utils');
const { speakerInfoFragment } = require('./fragments');

const queryPages = /* GraphQL */ `
  query ($conferenceTitle: ConferenceTitle, $eventYear: EventYear) {
    conf: conferenceBrand(where: {title: $conferenceTitle}) {
      id
      status
      year: conferenceEvents(where: {year: $eventYear}) {
        id
        status
        schedule: daySchedules(where: {workshops_some: {}}) {
          id
          status
          additionalEvents
          workshops {
            id
            status
            title
            description
            prerequisites
            content
            additionalInfo
            level
            speaker {
              name
              info: pieceOfSpeakerInfoes(where: {conferenceEvent: {year: $eventYear, conferenceBrand: {title: $conferenceTitle}}}) {
                ...speakerInfo
              }
            }
          }
        }
      }
    }
  }

  ${speakerInfoFragment}
`;

const fetchData = async (client, vars) => {
  const data = await client
    .request(queryPages, vars)
    .then(res => res.conf.year[0].schedule);

  const workshops = data.reduce(
    (all, day) => [
      ...all,
      ...day.workshops.map(ws => ({
        ...ws,
        trainer: ws.speaker.name,
        ...(day.additionalEvents &&
          day.additionalEvents.find(({ title }) => title === ws.title)),
      })),
    ],
    []
  );


  const allWorkshops = await Promise.all(
    workshops.map(async wrp => ({
      ...wrp,
      description: await markdownToHtml(wrp.description),
      additionalInfo: await markdownToHtml(wrp.additionalInfo),
    }))
  );

  const trainers = await Promise.all(await prepareSpeakers(allWorkshops.map(ws => ws.speaker.info[0])));

  return {
    trainers,
    workshops: allWorkshops,
    speakers: {
      workshops: trainers
    }
  };
};

module.exports = {
  fetchData,
  queryPages,
  getData: data => data.conf.year[0].schedule,
  story: 'schedule/workshops',
};
