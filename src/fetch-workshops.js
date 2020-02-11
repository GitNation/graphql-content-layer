const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const { markdownToHtml } = require('./markdown');
const { prepareSpeakers, trySelectSettings, createSlug } = require('./utils');
const { speakerInfoFragment, activitiesFragment } = require('./fragments');

dayjs.extend(customParseFormat);

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
          startingTime
          workshops {
            id
            status
            title
            toc
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
              ...person
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
              ...activities
            }
            trainers {
              ...person
              ...activities
            }
          }
        }
      }
    }
  }

  ${speakerInfoFragment}
  ${activitiesFragment}
`;

const createTrainersTitle = (trainers, fallback) => {
  if (!trainers) return null;
  return trainers.map(({ name }) => name).join(', ') || fallback;
};

const createWorkshopSchedule = (start, duration) => {
  if (!start) return null;
  if (!duration) return null;

  const startTime = dayjs(start, 'HH:mm');
  const endTime = startTime.add(duration, 'h');
  return {
    starting: startTime.format('H:mm'),
    ending: endTime.format('H:mm'),
  };
};

const byDate = (a, b) => {
  const orderA = new Date(a.date);
  const orderB = new Date(b.date);
  return orderA.getTime() - orderB.getTime();
};

const byOrder = (a, b) => {
  const orderA = a.order;
  const orderB = b.order;
  return orderA - orderB;
};

const fetchData = async (client, vars) => {
  const data = await client
    .request(queryPages, vars)
    .then(res => res.conf.year[0].schedule);

  let workshops = data
    .reduce(
      (all, day) => [
        ...all,
        ...day.workshops
          .map(({ speaker, trainers, ...ws }) => ({
            speaker: speaker || {
              info: [],
            },
            trainers:
              trainers.map(tr => ({ ...tr, slug: createSlug(tr, 'user') })) ||
              [],
            ...ws,
          }))
          .map(ws => ({
            ...ws,
            date: day.date,
            dateString: dayjs(day.date)
              .format('MMMM D')
              .trim(),
            startingTime: day.startingTime,
            schedule: createWorkshopSchedule(day.startingTime, ws.duration),
            trainer: ws.speaker.name,
            trainersTitle: createTrainersTitle(ws.trainers, ws.speaker.name),
            slug: createSlug(ws, 'workshop'),
            ...(day.additionalEvents &&
              day.additionalEvents.find(({ title }) => title === ws.title)),
          })),
      ],
      [],
    )
    .sort(byDate)
    .map(({ order, ...ws }, ind) => ({
      ...ws,
      order: order || 1010 + ind * 10,
    }))
    .sort(byOrder);

  const allWorkshops = await Promise.all(
    workshops.map(async wrp => ({
      ...wrp,
      toc: await markdownToHtml(wrp.toc),
      location: await markdownToHtml(wrp.location),
      description: await markdownToHtml(wrp.description),
      additionalInfo: await markdownToHtml(wrp.additionalInfo),
      prerequisites: await markdownToHtml(wrp.prerequisites),
      finishingTime: '',
    })),
  );

  const rawTrainers = allWorkshops
    .reduce(
      (list, { speaker, trainers }) => [
        ...list,
        speaker.info[0] || { speaker },
        ...trainers.map(tr => ({ speaker: tr })),
      ],
      [],
    )
    .filter(Boolean)
    .filter(({ speaker: { name } }) => !!name);

  const trainersIDs = [
    ...new Set(rawTrainers.map(({ speaker: { id } }) => id)),
  ];

  const trainers = await Promise.all(
    await prepareSpeakers(
      trainersIDs.map(id => {
        const person = rawTrainers.find(trainer => trainer.speaker.id === id);
        const activeTrainer = {
          ...person,
          activities: {
            workshops: [
              ...(person.speaker.workshopsActivity || []),
              ...(person.speaker.workshops || []),
            ],
          },
        };
        return activeTrainer;
      }),
      {},
    ),
  );

  return {
    trainers,
    workshopDays: data.length,
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
