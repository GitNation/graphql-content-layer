const { markdownToHtml } = require('./markdown');
const { prepareSpeakers, trySelectSettings } = require('./utils');
const { speakerInfoFragment } = require('./fragments');

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
      status
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        status
        schedule: daySchedules(where: { workshops_some: {} }) {
          id
          status
          additionalEvents
          date
          workshops {
            id
            status
            title
            toc
            startingTime
            duration
            description
            prerequisites
            content
            additionalInfo
            level
            location
            slogan
            code
            speaker {
              name
              info: pieceOfSpeakerInfoes(
                where: {
                  conferenceEvent: {
                    year: $eventYear
                    conferenceBrand: { title: $conferenceTitle }
                  }
                }
              ) {
                ...speakerInfo
              }
            }
            trainers {
              ...person
            }
          }
        }
      }
    }
  }

  ${speakerInfoFragment}
`;

const createTrainersTitle = (trainers, fallback) => {
  if (!trainers) return null;
  return trainers.map(({ name }) => name).join(', ') || fallback;
};

export const createWorkshopSchedule = (start, duration) => {
  const startTime = start.padStart(5, '0');
};

const fetchData = async (client, vars) => {
  const data = await client
    .request(queryPages, vars)
    .then(res => res.conf.year[0].schedule);

  const workshops = data.reduce(
    (all, day) => [
      ...all,
      ...day.workshops.map(ws => ({
        ...ws,
        date: day.date,
        dateString: new Date(day.date).toDateString(),
        trainer: ws.speaker.name,
        trainersTitle: createTrainersTitle(ws.trainers, ws.speaker.name),
        ...(day.additionalEvents &&
          day.additionalEvents.find(({ title }) => title === ws.title)),
      })),
    ],
    [],
  );

  const allWorkshops = await Promise.all(
    workshops.map(async wrp => ({
      ...wrp,
      toc: wrp.toc && (await markdownToHtml(wrp.toc)),
      location: wrp.location && (await markdownToHtml(wrp.location)),
      description: await markdownToHtml(wrp.description),
      additionalInfo:
        wrp.additionalInfo && (await markdownToHtml(wrp.additionalInfo)),
      finishingTime: '',
    })),
  );

  const trainers = await Promise.all(
    await prepareSpeakers(
      allWorkshops.map(ws => ws.speaker.info[0]),
      {},
    ),
  );

  return {
    trainers,
    workshops: allWorkshops,
    speakers: {
      workshops: trainers,
    },
  };
};

module.exports = {
  fetchData,
  selectSettings,
  queryPages,
  getData: data => data.conf.year[0].schedule,
  story: 'schedule/workshops',
};
