const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const { markdownToHtml } = require('./markdown');
const {
  prepareSpeakers,
  trySelectSettings,
  createSlug,
  contentTypeMap,
} = require('./utils');
const { speakerInfoFragment, activitiesFragment } = require('./fragments');
const { getFreeWorkshops } = require('./http-utils');

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
      events: conferenceEvents(where: { year: $eventYear }) {
        emsEventId
        useEmsData
        isoStartDate
        isoEndDate
        workshops {
          id
          title
          toc
          duration
          description
          prerequisites
          content
          toc
          additionalInfo
          level
          location
          slogan
          code
          workshopExtensions(
            where: {
              conferenceEvent: {
                year: $eventYear
                conferenceBrand: { title: $conferenceTitle }
              }
            }
          ) {
            isoDate
            location
            includedToPackage
            extension
          }
          speaker {
            ...person
            ...activities
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
            ...activities
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

const mergeWorkshops = (gqlWorkshops, emsWorkshops) => {
  return [
    ...gqlWorkshops,
    ...emsWorkshops.filter(emsWs => {
      const emsWsTitle = emsWs.title.toLowerCase();
      return !gqlWorkshops.some(gqlWs => {
        const gqlWsTitle = gqlWs.title.toLowerCase();
        return (
          gqlWsTitle === emsWsTitle ||
          gqlWsTitle.includes(emsWsTitle) ||
          emsWsTitle.includes(gqlWsTitle)
        );
      });
    }),
  ];
};

const fetchData = async (client, vars) => {
  const data = await client
    .request(queryPages, vars)
    .then(res => res.conf.events[0]);

  const { isoStartDate, useEmsData, emsEventId } = data;

  const emsWorkshops = useEmsData ? await getFreeWorkshops(emsEventId) : [];

  const confStartDate = dayjs(isoStartDate);

  const mergedWorkshops = mergeWorkshops(
    data.workshops || [],
    emsWorkshops || [],
  );
  const workshops = mergedWorkshops
    .map(({ speaker, trainers, ...ws }) => ({
      speaker: speaker || {
        info: [],
      },
      trainers:
        trainers.map(tr => ({ ...tr, slug: createSlug(tr, 'user') })) || [],
      ...ws,
      contentType: contentTypeMap.Workshop,
    }))
    .map(ws => {
      const extensionData =
        ws.workshopExtensions && ws.workshopExtensions[0]
          ? ws.workshopExtensions[0]
          : {};

      const { extension, ...restExtensionFields } = extensionData;

      const resultData = {
        ...ws,
        date: confStartDate.toISOString(),
        dateString: confStartDate.format('MMMM D').trim(),
        startingTime: confStartDate.format('HH:mm'),
        schedule: createWorkshopSchedule(
          confStartDate.format('HH:mm'),
          ws.duration,
        ),
        trainer: ws.speaker.name,
        trainersTitle: createTrainersTitle(ws.trainers, ws.speaker.name),
        slug: createSlug(ws, 'workshop'),

        ...(restExtensionFields || {}),
        ...(extension || {}),
      };

      return {
        ...resultData,
        isoDate: resultData.isoDate
          ? dayjs(resultData.isoDate).toISOString()
          : null,
      };
    });

  const allWorkshops = await Promise.all(
    workshops.map(async wrp => {
      let djsStartDate = wrp.location && dayjs(wrp.location, 'MMMM D, HH');
      if (djsStartDate && !djsStartDate.isValid()) {
        djsStartDate = dayjs(wrp.location, 'MMMM D');
      }

      return {
        ...wrp,
        content: wrp.toc && wrp.toc.length ? wrp.toc : wrp.content,
        location: await markdownToHtml(wrp.location),
        description: await markdownToHtml(wrp.description),
        additionalInfo: await markdownToHtml(wrp.additionalInfo),
        prerequisites: await markdownToHtml(wrp.prerequisites),
        finishingTime: '',
        startDate:
          wrp.startDate ||
          (djsStartDate && djsStartDate.isValid()
            ? djsStartDate.toISOString()
            : null),
      };
    }),
  );

  const rawTrainers = allWorkshops
    .reduce(
      (list, { speaker, trainers }) => [
        ...list,
        (speaker.info && speaker.info[0]) || { speaker },
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

  const sortedWorkshops = allWorkshops.sort((a, b) => {
    return (
      Number(a.includedToPackage) - Number(b.includedToPackage) ||
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  });

  return {
    trainers,
    workshopDays: data.length,
    workshops: sortedWorkshops,
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
