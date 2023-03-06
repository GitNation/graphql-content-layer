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

const prepareSpeakers = (speakers, tagColors, labelColors, isCommonSpeakers) =>
  speakers
    .filter(Boolean)
    .map(item => {
      if (isCommonSpeakers) {
        const avatarHandle = item.avatar
          ? item.avatar.handle
          : item.speaker.avatar.handle || null;
        const avatarMimeType = item.avatar
          ? item.avatar.mimeType
          : item.speaker.avatar.mimeType || null;

        return {
          ...item.speaker,
          ...item,
          avatar: item.avatar || item.speaker.avatar || {},
          avatarHandle,
          avatarMimeType,
          id: item.speaker.id,
        };
      }
      return {
        ...item.speaker,
        ...item,
        avatar: item.avatar || item.speaker.avatar || {},
        avatarHandle: item.handle || item.speaker.avatar.handle || null,
        avatarMimeType: item.mimeType || item.speaker.avatar.mimeType || null,
        id: item.speaker.id,
      };
    })
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
    offlineTalks: obj => obj.title,
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

function newSponsorCategoryToOld(category) {
  switch (category) {
    case 'Media':
      return 'MediaPartner'
    case 'Community':
      return 'Partner'
    default:
      return category;
  }
}

function sortByOrder(a, b) {
  const aInd = a.order || Infinity;
  const bInd = b.order || Infinity;
  return aInd - bInd;
};

module.exports = {
  getLabelColor,
  prepareSpeakers,
  // tagColors,
  trySelectSettings,
  createSlug,
  labelTag,
  contentTypeMap,
  newSponsorCategoryToOld,
  sortByOrder
};
