const { markdownToHtml } = require('./markdown');

const prepareSpeakers = async speakers => {
  const allSpeakersAsync = speakers
    .filter(Boolean)
    .map(item => ({
      ...item.speaker,
      ...item,
      avatar: (item.speaker && item.speaker.avatar) || item.avatar || {},
    }))
    .map(
      async ({
        bio,
        githubUrl,
        twitterUrl,
        mediumUrl,
        ownSite,
        speaker,
        avatar,
        ...item
      }) => ({
        ...item,
        company: `${item.company}, ${item.country}`,
        photo: avatar && avatar.url,
        desc: await markdownToHtml(bio),
        github: githubUrl,
        twitter: twitterUrl,
        medium: mediumUrl,
        site: ownSite,
      })
    );
  const allSpeakers = await Promise.all(allSpeakersAsync)
  const uniqueSpeakers = new Set(allSpeakers.map(({ name }) => name));
  const readySpeakers = [...uniqueSpeakers].map(name => allSpeakers.find(speaker => speaker.name === name));
  return readySpeakers;
};

module.exports = {
  prepareSpeakers,
};
