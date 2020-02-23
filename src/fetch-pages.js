const { contentTypeMap } = require('./utils');

const queryPages = /* GraphQL */ `
  query($conferenceTitle: ConferenceTitle, $eventYear: EventYear) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      status
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        status
        pages {
          id
          titleSeo
          description
          seoDescription
          key
          titlePage
          pageSlogan
          pageStatistics
          locationTitle
          themeColor {
            hex
          }
          keywords
          pageNavigation
          pageSections
        }
      }
    }
  }
`;

const fetchData = async (client, vars) => {
  const data = await client
    .request(queryPages, vars)
    .then(res => res.conf.year[0].pages);

  const pages = data.reduce(
    (obj, item) => ({
      ...obj,
      [item.key]: {
        ...item,
        contentType: contentTypeMap.Page,
        keywords: item.keywords.join(', '),
      },
    }),
    {},
  );
  return {
    pages,
  };
};

module.exports = {
  fetchData,
  queryPages,
  getData: data => data.conf.year[0].pages,
  story: 'pages',
};
