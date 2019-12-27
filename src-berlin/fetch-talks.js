/*
  Note: schedule is creating from talks linked to tracks and daySchedules
  additionally you can override schedule via providing data inside `additionalEvents`
  to override existing talk follow the rules:
  1. If talk has unfalsy `time` field you should add entry with the same `title` and `time`
  2. if talk doesn't have `time` field you may add entry with the same `title`
  3. if no one exist before the new entry will be created
  4. if talk isLightning and have the same time - all such talks will be collapsed to the single item with sublist of these talks
  all fields from additionalEvents will be merged to original talk entry
*/

const { markdownToHtml } = require('./markdown');
const { labelTag } = require('./utils');

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

const overlay = labelTag('talk');

const byTime = (a, b) => {
  const aTime = new Date(`1970/01/01 ${a.time}`);
  const bTime = new Date(`1970/01/01 ${b.time}`);
  return aTime - bTime;
};


const fetchData = async (client, vars) => {
  const data = await client
    .request(queryPages, vars)
    .then(res => res.conf.year[0].schedule[0]);

  const talksRaw = data.talks
    .map(({ title, description, timeString, track, speaker, isLightning }) => {
      try {
        return {
          isLightning,
          title,
          text: description,
          time: timeString,
          track: track && track.name,
          name: speaker && speaker.name,
          place: speaker && `${speaker.company}, ${speaker.country}`,
          pieceOfSpeakerInfoes:
            (speaker && speaker.pieceOfSpeakerInfoes[0]) || {},
        };
      } catch (err) {
        console.log('\nError in parsing talks');
        console.error(err);
        return {};
      }
    })
    .map(({ pieceOfSpeakerInfoes, ...talk }) => {
      try {
        return (
          talk.title && {
            ...talk,
            speaker: talk.name,
            from: talk.place,
            label: pieceOfSpeakerInfoes.label,
            tag: overlay(pieceOfSpeakerInfoes.label),
          }
        );
      } catch (err) {
        console.log('\nError in parsing talks', talk);
        console.error(err);
        return null;
      }
    })
    .filter(Boolean)
    .map(async item => ({
      ...item,
      text: await markdownToHtml(item.text),
    }));

  const allTalks = await Promise.all(talksRaw);

  const talks = allTalks.filter(t => !t.isLightning);
  const ltTalks = allTalks.filter(t => t.isLightning);

  const tracks = [
    ...new Set(allTalks.map(({ track }) => track).filter(Boolean)),
  ]
    .map(track => data.talks.find(talk => talk.track.name === track).track)
    .sort((a, b) => {
      return +b.isPrimary - +a.isPrimary;
    })
    .map(({ name }) => name);

  const ltTalksScheduleItems = tracks
    .map(track => {
      const lightningTalks = ltTalks.filter(lt => lt.track === track);
      if (!lightningTalks.length) return null;

      const timeGroups = new Set(lightningTalks.map(({ time }) => time));
      const lightningTalksGroups = [...timeGroups].map(time =>
        lightningTalks.filter(lt => lt.time === time)
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
    []
  );

  const schedule = tracks
    .map(track => ({
      tab: track,
      list: [...talks, ...ltTalksScheduleItemsFlatMap, ...data.additionalEvents]
        .filter(event => event.track === track)
        .reduce((list, talk) => {
          const findSameTalk = (list, talk) => {
            const sameTalkInd = list.findIndex(
              ({ title, time, isLightning }) => (title === talk.title) || (time === talk.time && isLightning && talk.isLightning)
            );
            const sameTalk = list[sameTalkInd];
            if (!sameTalk) return {};

            if (!sameTalk.time) {
              return { sameTalk, sameTalkInd };
            }

            return talk.time === sameTalk.time ? { sameTalk, sameTalkInd } : {};
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
    }))
    .filter(({ list }) => list.length);

  return {
    schedule,
    tracks,
    talks: allTalks,
    ltTalks,
    fullTalks: talks,
  };
};

module.exports = {
  fetchData,
};
