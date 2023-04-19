const dayJS = require('dayjs');

const { createSlug, labelTag, contentTypeMap, range } = require('./utils');
const { markdownToHtml } = require('./markdown');

const formatEvent = async (event, labelColors, trackName) => {
  const overlay = label => labelTag({ prefix: 'talk', labelColors, label });

  const {
    extension,
    speaker,
    isoDate,
    __typename,
    description,
    title,
    track,
    groupLT,
    lightningTalks = [],
    additionalLightningTalks = [],
    ...rest
  } = event;

  const contentType = contentTypeMap[`${__typename}`];

  const pieceOfSpeakerInfoes =
    (speaker && speaker.pieceOfSpeakerInfoes[0]) || {};
  const speakerPlace = speaker && `${speaker.company}, ${speaker.country}`;

  const lightningTalksWithMarkup = await Promise.all(
    [...lightningTalks, ...additionalLightningTalks].map(async e => {
      const result = await formatEvent(e, labelColors, trackName);
      return result;
    }),
  );

  const clearLightningTalks = await Promise.all(
    lightningTalksWithMarkup.map(async el => ({
      ...el,
      text: await markdownToHtml(el.text),
    })),
  );

  return {
    ...rest,
    ...speaker,

    eventType: __typename,
    title,
    text: description,
    description,
    time: isoDate ? dayJS(isoDate).toISOString() : null,
    dayISO: isoDate
      ? dayJS(isoDate)
          .set('hour', 0)
          .set('minute', 0)
          .format('YYYY-MM-DDTHH:mm:ss.000[Z]')
      : null,
    track: trackName,
    name: speaker && speaker.name,
    place: speakerPlace,

    slug: title ? createSlug({ title }, 'talk') : null,
    speakerSlug: speaker ? createSlug(speaker || {}, 'user') : null,
    contentType,
    isLightning: __typename === 'LightningTalk' || __typename === 'GroupLT',
    isoDate: isoDate ? dayJS(isoDate).toISOString() : null,
    speaker: speaker && speaker.name,
    from: speakerPlace,
    label: pieceOfSpeakerInfoes.label,
    tag: pieceOfSpeakerInfoes.label
      ? overlay(pieceOfSpeakerInfoes.label)
      : null,
    lightningTalks: clearLightningTalks.length ? clearLightningTalks : null,
    ...extension,
  };
};

const groupByTimeFactory = () => {
  const dayMap = new Map();
  const minMaxByDay = new Map();

  const dayMapAdd = (iso, track, event) => {
    const date = iso.split('T')[0];

    if (!dayMap.get(date)) {
      dayMap.set(date, new Map());
    }

    const trackMap = dayMap.get(date);
    if (!trackMap.get(track.name)) {
      trackMap.set(track.name, new Map());
    }

    const timeMap = trackMap.get(track.name);
    if (!timeMap.get(iso)) {
      timeMap.set(iso, []);
    }
    timeMap.get(iso).push(event);
  }

  const minMaxAdd = (iso) => {
    const date = iso.split('T')[0];

    if (!minMaxByDay.get(date)) {
      minMaxByDay.set(date, { min: iso, max: iso });
    } else {
      const container = minMaxByDay.get(date);
      if (iso < container.min) {
        container.min = iso;
      }
      if (iso > container.max) {
        container.max = iso;
      }
    }
  }

  // removes gaps in time interval (e.g. 12-13, 14-15)
  const normalizeDayMap = () => {
    for (const [day, trackMap] of dayMap.entries()) {
      const minMax = minMaxByDay.get(day);
      const min = dayJS(minMax.min);
      const max = dayJS(minMax.max);
      const diffHours = max.diff(min, 'hour');

      for (const diff of range(0, diffHours, 1)) {
        const date = min.add(diff, 'hour').toISOString();

        for (const timeMap of trackMap.values()) {
          if (!timeMap.get(date)) {
            timeMap.set(date, null)
          }
        }
      }
    }
  }

  const mapToObject = (orderedTracks) => {
    const result = [];
    for (const [day, trackMap] of dayMap.entries()) {
      const dayBucket = [];

      for (const track of orderedTracks) {
        const timeMap = trackMap.get(track);
        if (!timeMap) {
          continue;
        }
        const trackBucket = [];

        const dates = Array.from(timeMap.keys());
        dates.sort();

        for (const date of dates) {
          const dateObj = new Date(date);
          const hour = dateObj.getUTCHours();
          const day = dateObj.getUTCDate();

          dateObj.setMinutes(59);
          dateObj.setSeconds(59);

          const events = timeMap.get(date);
          events && events.sort((a, b) => a.time > b.time);

          trackBucket.push({
            id: `time-${day}-${hour}-${hour + 1}`,
            start: date,
            end: dateObj.toISOString(),
            list: events,
          });
        }
        dayBucket.push({ track, list: trackBucket })
      }
      result.push({ day, list: dayBucket });
    }
    return result;
  }

  return {
    groupTrack: (eventList, track) => {
      for (const event of eventList) {
        if (!event.time) {
          continue;
        }

        const beginDate = dayJS(event.time);
        const beginHour = beginDate.set('minute', 0).set('second', 0);
        const time = beginHour.toISOString();

        minMaxAdd(time);
        dayMapAdd(time, track, event);
      }
    },
    buildObject: (orderedTracks) => {
      normalizeDayMap();
      return mapToObject(orderedTracks);
    }
  }
}

const formatActivity = async (event, labelColors, trackName) => {
  return event;
  // const overlay = label => labelTag({ prefix: 'talk', labelColors, label });

  // const {
  //   extension,
  //   speaker,
  //   isoDate,
  //   __typename,
  //   description,
  //   title,
  //   track,
  //   groupLT,
  //   lightningTalks = [],
  //   additionalLightningTalks = [],
  //   ...rest
  // } = event;

  // const contentType = contentTypeMap[`${__typename}`];

  // const pieceOfSpeakerInfoes =
  //   (speaker && speaker.pieceOfSpeakerInfoes[0]) || {};
  // const speakerPlace = speaker && `${speaker.company}, ${speaker.country}`;

  // const lightningTalksWithMarkup = await Promise.all(
  //   [...lightningTalks, ...additionalLightningTalks].map(async e => {
  //     const result = await formatEvent(e, labelColors, trackName);
  //     return result;
  //   }),
  // );

  // const clearLightningTalks = await Promise.all(
  //   lightningTalksWithMarkup.map(async el => ({
  //     ...el,
  //     text: await markdownToHtml(el.text),
  //   })),
  // );

  // return {
  //   ...rest,
  //   ...speaker,

  //   eventType: __typename,
  //   title,
  //   text: description,
  //   description,
  //   time: isoDate ? dayJS(isoDate).toISOString() : null,
  //   dayISO: isoDate
  //     ? dayJS(isoDate)
  //         .set('hour', 0)
  //         .set('minute', 0)
  //         .format('YYYY-MM-DDTHH:mm:ss.000[Z]')
  //     : null,
  //   track: trackName,
  //   name: speaker && speaker.name,
  //   place: speakerPlace,

  //   slug: title ? createSlug({ title }, 'talk') : null,
  //   speakerSlug: speaker ? createSlug(speaker || {}, 'user') : null,
  //   contentType,
  //   isLightning: __typename === 'LightningTalk' || __typename === 'GroupLT',
  //   isoDate: isoDate ? dayJS(isoDate).toISOString() : null,
  //   speaker: speaker && speaker.name,
  //   from: speakerPlace,
  //   label: pieceOfSpeakerInfoes.label,
  //   tag: pieceOfSpeakerInfoes.label
  //     ? overlay(pieceOfSpeakerInfoes.label)
  //     : null,
  //   lightningTalks: clearLightningTalks.length ? clearLightningTalks : null,
  //   ...extension,
  // };
};

const groupEmsScheduleByTimeFactory = () => {
  const dayMap = new Map();
  const minMaxByDay = new Map();

  const dayMapAdd = (iso, track, event) => {
    const date = iso.split('T')[0];

    if (!dayMap.get(date)) {
      dayMap.set(date, new Map());
    }

    const trackMap = dayMap.get(date);
    if (!trackMap.get(track.name)) {
      trackMap.set(track.name, new Map());
    }

    const timeMap = trackMap.get(track.name);
    if (!timeMap.get(iso)) {
      timeMap.set(iso, []);
    }
    timeMap.get(iso).push(event);
  }

  const minMaxAdd = (iso) => {
    const date = iso.split('T')[0];

    if (!minMaxByDay.get(date)) {
      minMaxByDay.set(date, { min: iso, max: iso });
    } else {
      const container = minMaxByDay.get(date);
      if (iso < container.min) {
        container.min = iso;
      }
      if (iso > container.max) {
        container.max = iso;
      }
    }
  }

  // removes gaps in time interval (e.g. 12-13, 14-15)
  const normalizeDayMap = () => {
    for (const [day, trackMap] of dayMap.entries()) {
      const minMax = minMaxByDay.get(day);
      const min = dayJS(minMax.min);
      const max = dayJS(minMax.max);
      const diffHours = max.diff(min, 'hour');

      for (const diff of range(0, diffHours, 1)) {
        const date = min.add(diff, 'hour').toISOString();

        for (const timeMap of trackMap.values()) {
          if (!timeMap.get(date)) {
            timeMap.set(date, null)
          }
        }
      }
    }
  }

  const mapToObject = (orderedTracks) => {
    const result = [];
    for (const [day, trackMap] of dayMap.entries()) {
      const dayBucket = [];

      for (const track of orderedTracks) {
        const timeMap = trackMap.get(track);
        if (!timeMap) {
          continue;
        }
        const trackBucket = [];

        const dates = Array.from(timeMap.keys());
        dates.sort();

        for (const date of dates) {
          const dateObj = new Date(date);
          const hour = dateObj.getUTCHours();
          const day = dateObj.getUTCDate();

          dateObj.setMinutes(59);
          dateObj.setSeconds(59);

          const events = timeMap.get(date);
          events && events.sort((a, b) => a.startDate > b.startDate);

          trackBucket.push({
            id: `time-${day}-${hour}-${hour + 1}`,
            start: date,
            end: dateObj.toISOString(),
            list: events,
          });
        }
        dayBucket.push({ track, list: trackBucket })
      }
      result.push({ day, list: dayBucket });
    }
    return result;
  }

  return {
    groupTrack: (eventList, track) => {
      for (const event of eventList) {
        if (!event.startDate) {
          continue;
        }

        const beginDate = dayJS(event.startDate);
        const beginHour = beginDate.set('minute', 0).set('second', 0);
        const time = beginHour.toISOString();

        minMaxAdd(time);
        dayMapAdd(time, track, event);
      }
    },
    buildObject: (orderedTracks) => {
      normalizeDayMap();
      return mapToObject(orderedTracks);
    }
  }
}

module.exports = {
  formatEvent,
  groupByTimeFactory,
  formatActivity,
  groupEmsScheduleByTimeFactory
};
