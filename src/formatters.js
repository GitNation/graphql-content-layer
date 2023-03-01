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

const groupByTime = (eventList) => {
  const minMaxByDay = new Map();
  const map = new Map();

  const mapAdd = (key, value) => {
    if (!map.get(key)) {
      map.set(key, []);
    }
    map.get(key).push(value);
  }

  const minMaxAdd = (iso) => {
    const day = new Date(iso).getUTCDate();

    if (!minMaxByDay.get(day)) {
      minMaxByDay.set(day, { min: iso, max: iso });
    } else {
      const container = minMaxByDay.get(day);
      if (iso < container.min) {
        container.min = iso;
      }
      if (iso > container.max) {
        container.max = iso;
      }
    }
  }

  // removes gaps in time interval (e.g. 12-13, 14-15)
  const normalizeDateMap = () => {
    for (const minMax of minMaxByDay.values()) {
      const min = dayJS(minMax.min);
      const max = dayJS(minMax.max);
      const diffHours = max.diff(min, 'hour');

      for (const diff of range(0, diffHours, 1)) {
        const date = min.add(diff, 'hour').toISOString();
        if (!map.get(date)) {
          map.set(date, null);
        }
      }
    }
  }

  for (const event of eventList) {
    if (!event.time) {
      continue;
    }

    const beginDate = dayJS(event.time);
    const endDate = event.duration && beginDate.add(event.duration, 'minute').subtract(1, 'second');
    const beginHour = beginDate.set('minute', 0).set('second', 0);
    const endHour = endDate ? endDate.set('minute', 0).set('second', 0) : beginHour;

    const diffHours = endHour.diff(beginHour, 'hour');
    for (const diff of range(0, diffHours, 1)) {
      const time = beginHour.add(diff, 'hour').toISOString();

      minMaxAdd(time);
      mapAdd(time, event);
    }
  }

  normalizeDateMap();

  const dates = Array.from(map.keys());
  dates.sort();

  return dates.map(date => {
    const dateObj = new Date(date);
    const hour = dateObj.getUTCHours();

    dateObj.setMinutes(59);
    dateObj.setSeconds(59);

    const events = map.get(date);
    events && events.sort((a, b) => a.time > b.time);
    return {
      id: `time-${hour}-${hour + 1}`,
      start: date,
      end: dateObj.toISOString(),
      list: events,
    }
  });
}

module.exports = {
  formatEvent,
  groupByTime,
};
