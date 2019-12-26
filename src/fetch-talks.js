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

const fetchData = async(client, vars) => {
  const data = await client
    .request(queryPages, vars)
    .then(res => res.conf.year[0].schedule[0]);

    if (!data) {
      throw new Error('Schedule not set for this event yet');
    }

  const talks = data.talks
    .map(({ title, description, timeString, track, speaker }) => ({
      title,
      text: description,
      time: timeString,
      track: track.name,
      name: speaker.name,
      place: `${speaker.company}, ${speaker.country}`,
      pieceOfSpeakerInfoes: speaker.pieceOfSpeakerInfoes[0] || {},
    }))
    .map(({ pieceOfSpeakerInfoes, ...talk }) => ({
      ...talk,
      speaker: talk.name,
      from: talk.place,
      label: pieceOfSpeakerInfoes.label,
    }));

  const tracks = [...new Set(talks.map(({ track }) => track))]
    .map(track => data.talks.find(talk => talk.track.name === track).track)
    .sort((a, b) => {
      return +b.isPrimary - +a.isPrimary;
    })
    .map(({ name }) => name);

  const schedule = tracks.map((track, ind) => ({
    tab: track,
    title: track,
    name: `${10 + ind}`,
    list: [...data.additionalEvents, ...talks]
      .filter(event => event.track === track)
      .sort(byTime),
  }));

  schedule[0].active = true;

  return {
    schedule,
    tracks,
    talks,
  };
};

module.exports = {
  fetchData,
  queryPages,
  getData: data => data.conf.year[0].schedule,
  story: 'schedule/talks',
};
