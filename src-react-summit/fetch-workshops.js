const { markdownToHtml } = require('./markdown');
const { prepareSpeakers } = require('./utils');
const { imageUrlFragment } = require('./fragments');
const dayjs = require('dayjs');


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
          date
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
              id
              name
              company
              country
              bio
              githubUrl
              twitterUrl
              mediumUrl
              ownSite
              ...imageUrl
            }
          }
        }
      }
    }
  }

  ${imageUrlFragment}
`;

const fetchData = async (client, vars) => {
  const data = await client
    .request(queryPages, vars)
    .then(res => res.conf.year[0].schedule);

  const workshops = data.reduce(
    (all, day) => {
      try {
        return [
          ...all,
          ...day.workshops.map(ws => {
            try {
              return {
                ...ws,
                trainer: ws.speaker && ws.speaker.name,
                ...(day.additionalEvents &&
                  day.additionalEvents.find(({ title }) => title === ws.title)),
                date: dayjs(day.date).format('MMMM DD'),
              };
            } catch (err) {
              console.warn('\nError in:', ws);
              console.error(err);
              return null;
            }
          }).filter(Boolean),
        ];
      } catch (err) {
        console.warn('\nError in:', day);
        console.error(err)
        return all;
      }
    },
    []
  );


  const allWorkshops = await Promise.all(
    workshops.map(async wrp => ({
      ...wrp,
      location: wrp.location && await markdownToHtml(wrp.location),
      description: wrp.description && await markdownToHtml(wrp.description),
      prerequisites: wrp.prerequisites && await markdownToHtml(wrp.prerequisites),
      additionalInfo: wrp.additionalInfo && await markdownToHtml(wrp.additionalInfo),
    }))
  );

  const trainers = await Promise.all(await prepareSpeakers(allWorkshops.map(ws => ws.speaker)));

  return {
    trainers,
    workshopDays: data.length,
    workshops: allWorkshops,
    speakers: {
      workshops: trainers
    }
  };
};

module.exports = {
  fetchData,
};
