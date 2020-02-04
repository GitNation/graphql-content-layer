const slugify = require('url-slug');
const { markdownToHtml } = require('./markdown');

const getSocials = speaker => {
  const ICONS = {
    githubUrl: 'gh',
    twitterUrl: 'tw',
    mediumUrl: 'med',
    ownSite: 'site',
  };
  const { githubUrl, twitterUrl, mediumUrl, ownSite, companySite } = speaker;
  const socials = Object.entries({
    githubUrl,
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

const prepareSpeakers = (speakers, tagColors) =>
  speakers
    .map(item => ({
      ...item.speaker,
      ...item,
      avatar: item.speaker.avatar || {},
    }))
    .map(async ({ bio, speaker, avatar, activities = {}, ...item }) => ({
      ...item,
      company: `${item.company}, ${item.country}`,
      avatar: avatar.url,
      bio: await markdownToHtml(bio),
      socials: getSocials(item),
      ...getLabelColor(item.label, tagColors),
      activities: prepareActivities(activities),
      slug: createSlug(item, 'user'),
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
};
