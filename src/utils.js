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
      activities: Object.entries(activities).reduce(
        (all, [key, value]) => ({
          ...all,
          ...(value && value.length ? { [key]: value } : undefined),
        }),
        {},
      ),
    }));

const trySelectSettings = (selector, defaultSettings) => settings => {
  try {
    return selector(settings) || defaultSettings;
  } catch (err) {
    console.warn(err);
    return defaultSettings;
  }
};

module.exports = {
  getLabelColor,
  prepareSpeakers,
  // tagColors,
  trySelectSettings,
};
