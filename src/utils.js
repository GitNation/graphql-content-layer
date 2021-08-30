const slugify = require('url-slug');
const { markdownToHtml } = require('./markdown');
const { contentTypeMap } = require('./content-type-map');

const getSocials = speaker => {
  const ICONS = {
    githubUrl: 'gh',
    portalUrl: 'portal',
    twitterUrl: 'tw',
    mediumUrl: 'med',
    ownSite: 'site',
  };
  const {
    githubUrl,
    portalUrl,
    twitterUrl,
    mediumUrl,
    ownSite,
    companySite,
  } = speaker;
  const socials = Object.entries({
    githubUrl,
    portalUrl,
    twitterUrl,
    mediumUrl,
    ownSite,
    companySite,
  })
    .map(([key, val]) => val && { link: val, icon: ICONS[key] })
    .filter(Boolean);
  return socials;
};

const getLabelColor = (label, tagColors) => {
  const colors = tagColors[label] || tagColors.default;
  return colors;
};

const prepareActivities = rawActivities => {
  const activities = Object.entries(rawActivities).reduce(
    (all, [key, value]) => ({
      ...all,
      ...(value && value.length ? { [key]: value } : undefined),
    }),
    {},
  );
  Object.entries(activities).forEach(([key, value]) => {
    value.forEach(item => {
      item.slug = createSlug(item, key);
    });
  });
  return activities;
};

const labelTag = ({ prefix, labelColors = [], label }) => {
  const colorInfo =
    labelColors.find(c => c.label === label) ||
    labelColors.find(c => c.label === null) ||
    {};
  return `${prefix}--${colorInfo.tag}`;
};

const prepareSpeakers = (speakers, tagColors, labelColors) =>
  speakers
    .filter(Boolean)
    // .filter(({ speaker }) => !!speaker)
    .map(item => ({
      ...item.speaker,
      ...item,
      avatar: item.avatar || item.speaker.avatar || {},
      id: item.speaker.id,
    }))
    .map(async ({ bio, speaker, avatar, activities, ...item }) => ({
      ...item,
      company: [item.company, item.country].filter(Boolean).join(', '),
      avatar: avatar.url,
      bio: await markdownToHtml(bio),
      socials: getSocials(item),
      ...getLabelColor(item.label, tagColors),
      activities: prepareActivities(activities || {}),
      slug: createSlug(item, 'user'),
      tag: labelTag({ label: item.label, prefix: 'speaker', labelColors }),
      contentType: contentTypeMap.Speaker,
      contentTypeAlt: contentTypeMap.PieceOfSpeakerInfo,
    }));

const trySelectSettings = (selector, defaultSettings) => settings => {
  try {
    return selector(settings) || defaultSettings;
  } catch (err) {
    console.warn(err);
    return defaultSettings;
  }
};

const createSlug = (object, type) => {
  const keys = {
    user: obj => obj.name,
    sponsor: obj => obj.title,
    talk: obj => obj.title,
    talks: obj => obj.title,
    workshop: obj => obj.title,
    workshops: obj => obj.title,
    other: obj => {
      throw new Error(
        `Can't create slug for object of type [${type}]\n${JSON.stringify(
          obj,
          null,
          2,
        )}`,
      );
    },
  };
  const getValue = keys[type] || keys.other;
  const value = getValue(object);
  const slug = slugify(value);
  return slug;
};

module.exports = {
  getLabelColor,
  prepareSpeakers,
  // tagColors,
  trySelectSettings,
  createSlug,
  labelTag,
  contentTypeMap,
};
