const { markdownToHtml } = require('./markdown');

const tagColors = {
  NodeJS: {
    tagBG: '#7AB464',
    color: '#fff',
  },
  WebGL: {
    tagBG: '#ff7302',
    color: '#ffffff',
  },
  Ecosystem: {
    tagBG: '#fff40d',
    color: '#ae4f01',
  },
  Language: {
    tagBG: '#fff40d',
    color: '#ae4f01',
  },
  GraphQL: {
    tagBG: '#f200fa',
    color: '#400042',
  },
  VueJS: {
    tagBG: '#4EBA87',
    color: '#fff',
  },
  Performance: {
    tagBG: '#00ed24',
    color: '#00410a',
  },
  TypeScript: {
    tagBG: '#61DAFB',
    color: '#030303',
  },
  default: {
    tagBG: 'black',
    color: 'white',
  },
};

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

const getLabelColor = label => {
  const colors = tagColors[label] || tagColors.default;
  return colors;
};

const prepareSpeakers = speakers =>
  speakers
    .map(item => ({
      ...item.speaker,
      ...item,
      avatar: item.speaker.avatar || {},
    }))
    .map(async ({ bio, speaker, avatar, ...item }) => ({
      ...item,
      company: `${item.company}, ${item.country}`,
      avatar: avatar.url,
      bio: await markdownToHtml(bio),
      socials: getSocials(item),
      ...getLabelColor(item.label),
    }));

const trySelectSettings = (selector, defaultSettings) => settings => {
  try {
    return selector(settings) || defaultSettings;
  } catch {
    return defaultSettings;
  }
};

module.exports = {
  getLabelColor,
  prepareSpeakers,
  tagColors,
  trySelectSettings,
};
