const { markdownToHtml } = require('./markdown');
const { contentTypeMap } = require('./utils');

const queryPages = /* GraphQL */ `
  query($conferenceTitle: ConferenceTitle, $eventYear: EventYear) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        extendeds {
          id
          key
          title
          subtitle
          description
          location
          slackChannelName
          itemID
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

const fetchData = async (client, vars) => {
  const data = await client
    .request(queryPages, vars)
    .then(res => res.conf.year[0].extendeds);

  const allExtendeds = await Promise.all(
    data.map(async item => ({
      ...item,
      title: await markdownToHtml(item.title),
      subtitle: item.subtitle && (await markdownToHtml(item.subtitle)),
      description: item.description && (await markdownToHtml(item.description)),
      location: item.location && (await markdownToHtml(item.location)),
      contentType: contentTypeMap.Extended,
    })),
  );

  const keys = new Set(allExtendeds.map(e => e.key));
  const extendeds = [...keys].reduce(
    (obj, key) => ({
      ...obj,
      [key]: allExtendeds.filter(e => e.key === key),
    }),
    {},
  );

  return {
    extendeds,
  };
};

module.exports = {
  fetchData,
  queryPages,
  getData: data => data.conf.year[0].extendeds,
  story: 'extended',
};
