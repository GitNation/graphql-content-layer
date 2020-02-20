const { createSlug, contentTypeMap } = require('./utils');

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
  const rawData = await client
    .request(queryPages, vars)
    .then(res => res.conf.year[0].schedule);

  const dataTalks = rawData
    .map(({ talks }) => talks)
    .reduce((flatArray, dayTalks) => [...flatArray, ...dayTalks], []);

  if (!dataTalks.length) {
    throw new Error('Schedule not set for this event yet');
  }

  const additionalEvents = rawData[0].additionalEvents || [];

  const talks = dataTalks
    .map(({ title, description, timeString, track, speaker, ...talk }) => ({
      ...talk,
      title,
      text: description,
      description,
      time: timeString,
      track: track && track.name,
      name: speaker && speaker.name,
      place: speaker && `${speaker.company}, ${speaker.country}`,
      pieceOfSpeakerInfoes: speaker.pieceOfSpeakerInfoes[0] || {},
      slug: createSlug({ title }, 'talk'),
      speakerSlug: createSlug(speaker, 'user'),
    }))
    .map(({ pieceOfSpeakerInfoes, ...talk }) => ({
      ...talk,
      contentType: contentTypeMap.talk,
      speaker: talk.name,
      from: talk.place,
      label: pieceOfSpeakerInfoes.label,
    }));

  const lightningTalks = talks.filter(({ isLightning }) => isLightning);

  const tracks = [...new Set(talks.map(({ track }) => track))]
    .map(track =>
      dataTalks.find(talk => talk.track && talk.track.name === track),
    )
    .filter(Boolean)
    .map(({ track }) => track)
    .sort((a, b) => {
      return +b.isPrimary - +a.isPrimary;
    })
    .map(({ name }) => name);

  const schedule = tracks.map((track, ind) => ({
    tab: track,
    title: track,
    name: `${10 + ind}`,
    list: [...additionalEvents, ...talks]
      .filter(event => event.track === track)
      .sort(byTime),
  }));

  let scheduleTitle = 'Schedule';
  let noTracks = false;

  if (schedule.length === 1) {
    schedule[0].list = talks.map(talk => ({ ...talk, time: null }));
    scheduleTitle = 'First Talks';
    noTracks = true;
  }

  schedule[0].active = true;

  return {
    scheduleTitle,
    schedule,
    tracks,
    talks,
    lightningTalks,
    noTracks,
  };
};

module.exports = {
  fetchData,
  queryPages,
  getData: data => data.conf.year[0].schedule,
  story: 'schedule/talks',
};
