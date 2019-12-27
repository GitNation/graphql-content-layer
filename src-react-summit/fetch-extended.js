const { markdownToHtml } = require('./markdown');

const renderStyles = {
  None_Default: 'None_Default',
  Standard_Markdown: 'Standard_Markdown',
};

const queryTexts = /* GraphQL */ `
  query($conferenceTitle: ConferenceTitle, $eventYear: EventYear) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      status
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        status
        extendeds {
          key
          title
          subtitle
          description
          location
          slackChannelName
          registerLink
          locationLink
          image {
            url
          }
        }
      }
    }
  }
`;

const markdownRender = async (text, style) => {
  const renders = {
    [renderStyles.None_Default]: t => t,
    [renderStyles.Standard_Markdown]: async t => await markdownToHtml(t),
  };
  const defaultRender = renders[renderStyles.None_Default];

  return await (renders[style] || defaultRender)(text);
}

const fetchData = async (client, vars) => {
  const data = await client
    .request(queryTexts, vars)
    .then(res => res.conf.year[0].extendeds);

  const allExtendeds = await Promise.all(
    data.map(async item => ({
      ...item,
      title: await markdownToHtml(item.title),
      subtitle: item.subtitle && await markdownToHtml(item.subtitle),
      description: item.description && await markdownToHtml(item.description),
      location: item.location && await markdownToHtml(item.location),
    }))
  );

  const keys = new Set(allExtendeds.map(e => e.key));
  const extendeds = [...keys].reduce((obj, key) => ({
    ...obj,
    [key]: allExtendeds.filter(e => e.key === key)
  }), {});

  return {
    extendeds,
  };
};

module.exports = {
  fetchData,
};
