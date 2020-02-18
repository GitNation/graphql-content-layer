const queryPages = /* GraphQL */ `
  query($conferenceTitle: ConferenceTitle, $eventYear: EventYear) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      status
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        status
        schedule: daySchedules(where: { talks_some: {} }) {
          id
          status
          additionalEvents
          date
          talks {
            id
            status
            timeString
            title
            description
            isLightning
            track {
              id
              status
              name
              isPrimary
            }
            speaker {
              name
              company
              country
              pieceOfSpeakerInfoes(
                where: { conferenceEvent: { year: $eventYear } }
              ) {
                label
              }
            }
          }
        }
      }
    }
  }
`;

const byTime = (a, b) => {
  const aTime = new Date(`1970/01/01 ${a.time}`);
  const bTime = new Date(`1970/01/01 ${b.time}`);
  return aTime - bTime;
};

const fetchData = async (client, vars) => {
  const data = await client
    .request(queryPages, vars)
    .then(res => res.conf.year[0].schedule[0]);

  const talks = data.talks
    .map(({ title, description, timeString, track, speaker, isLightning }) => {
      try {
        return {
          title,
          text: description,
          time: timeString,
          track: track.name,
          name: speaker && speaker.name,
          place: speaker && `${speaker.company}, ${speaker.country}`,
          isLightning,
        };
      }
      catch (err) {
        console.warn('\nError for talk entry', { title, description, timeString, track, speaker, isLightning });
        console.error(err);
        return null;
      }
    })
    .filter(Boolean)
    .map(({ pieceOfSpeakerInfoes, ...talk }) => ({
      ...talk,
      author: talk.name,
      company: talk.place,
      theme: talk.title,
    }));

  const tracks = [...new Set(talks.map(({ track }) => track))]
    .map(track => data.talks.find(talk => talk.track && talk.track.name === track).track)
    .sort((a, b) => {
      return +b.isPrimary - +a.isPrimary;
    })
    .map(({ name }) => name);

  const scheduleList = tracks.map(track => ({
    title: track,
    schedule: [...data.additionalEvents, ...talks]
      .filter(event => event.track === track && !event.isLightning)
      .sort(byTime),
  }));
  scheduleList[0].active = true;

  const lightningTalks = talks.filter(({ isLightning }) => isLightning);

  const hideSchedule = tracks.length < 2;

  return {
    scheduleList,
    tracks,
    talks,
    lightningTalks,
    hideSchedule
  };
};

module.exports = {
  fetchData,
};
