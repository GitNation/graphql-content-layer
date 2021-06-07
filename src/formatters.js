const dayJS = require('dayjs');

const { createSlug, labelTag, contentTypeMap } = require('./utils');
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
    lightningTalks: clearLightningTalks.length ? clearLightningTalks : [],
    ...extension,
  };
};

module.exports = {
  formatEvent,
};
