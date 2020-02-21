const { markdownToHtml } = require('./markdown');
const {
  createSlug,
  labelTag,
  trySelectSettings,
  contentTypeMap,
} = require('./utils');

const selectSettings = trySelectSettings(
  s => ({
    labelColors: s.labelColors,
  }),
  {},
);

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

const fetchData = async (client, { labelColors, ...vars }) => {
  const overlay = label => labelTag({ prefix: 'talk', labelColors, label });

  const rawData = await client
    .request(queryPages, vars)
    .then(res => res.conf.year[0].schedule);

  const dataTalks = rawData
    .map(({ talks }) => talks)
    .reduce((flatArray, dayTalks) => [...flatArray, ...dayTalks], []);

  if (!dataTalks.length) {
    throw new Error('Schedule not set for this event yet');
  }

  const additionalEvents = (rawData[0].additionalEvents || []).map(event => ({
    ...event,
    id: rawData[0] && rawData[0].id,
    contentType: contentTypeMap.DaySchedule,
  }));

  const talksRaw = dataTalks
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
      contentType: contentTypeMap.Talk,
    }))
    .map(({ pieceOfSpeakerInfoes, ...talk }) => ({
      ...talk,
      contentType: contentTypeMap.Talk,
      speaker: talk.name,
      from: talk.place,
      label: pieceOfSpeakerInfoes.label,
      tag: overlay(pieceOfSpeakerInfoes.label),
    }))
    .map(async item => ({
      ...item,
      text: await markdownToHtml(item.text),
    }));

  const allTalks = await Promise.all(talksRaw);

  const talks = allTalks.filter(({ isLightning }) => !isLightning);
  const lightningTalks = allTalks.filter(({ isLightning }) => isLightning);

  const tracks = [...new Set(allTalks.map(({ track }) => track))]
    .map(track =>
      dataTalks.find(talk => talk.track && talk.track.name === track),
    )
    .filter(Boolean)
    .map(({ track }) => track)
    .sort((a, b) => {
      return +b.isPrimary - +a.isPrimary;
    })
    .map(({ name }) => name);

  const ltTalksScheduleItems = tracks
    .map(track => {
      const ltTalks = lightningTalks.filter(lt => lt.track === track);
      if (!ltTalks.length) return null;

      const timeGroups = new Set(ltTalks.map(({ time }) => time));
      const lightningTalksGroups = [...timeGroups].map(time =>
        ltTalks.filter(lt => lt.time === time),
      );

      return lightningTalksGroups.map(ltGroup => ({
        title: 'tbd',
        time: ltGroup[0].time,
        isLightning: true,
        track,
        lightningTalks: ltGroup,
      }));
    })
    .filter(Boolean);

  const ltTalksScheduleItemsFlatMap = ltTalksScheduleItems.reduce(
    (array, subArray) => [...array, ...subArray],
    [],
  );

  const schedule = tracks.map((track, ind) => ({
    tab: track,
    title: track,
    name: `${10 + ind}`,
    list: [...talks, ...ltTalksScheduleItemsFlatMap, ...additionalEvents]
      .filter(event => event.track === track)
      .reduce((list, talk) => {
        const findSameTalk = (ls, tk) => {
          const sameTalkInd = ls.findIndex(
            ({ title, time, isLightning }) =>
              title === tk.title ||
              (time === tk.time && isLightning && tk.isLightning),
          );
          const sameTalk = ls[sameTalkInd];
          if (!sameTalk) return {};

          if (!sameTalk.time) {
            return { sameTalk, sameTalkInd };
          }

          return tk.time === sameTalk.time ? { sameTalk, sameTalkInd } : {};
        };

        const { sameTalk, sameTalkInd } = findSameTalk(list, talk);

        if (sameTalk) {
          const newList = [...list];
          newList[sameTalkInd] = {
            ...sameTalk,
            ...talk,
          };
          return newList;
        }
        return [...list, talk];
      }, [])
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
  selectSettings,
  queryPages,
  getData: data => data.conf.year[0].schedule,
  story: 'schedule/talks',
};
