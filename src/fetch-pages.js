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

  const customContent = {
    videoRooms: [],
    scheduleExtends: [],
    tracks: [],
    eventInfo: {},
  };

  data.forEach(page => {
    if (page.pageSections && page.pageSections.tracks) {
      const customTracks = page.pageSections.tracks;
      customTracks.forEach(({ list }) => {
        if (!list) {
          return;
        }
        list.forEach(customEvent => {
          if (customEvent.type === 'videoRoom') {
            customContent.videoRooms.push(customEvent);
          }
        });
      });
    }
    if (page.pageSections && page.pageSections.scheduleExtends) {
      customContent.scheduleExtends = [
        ...customContent.scheduleExtends,
        ...page.pageSections.scheduleExtends,
      ];
    }
    if (page.pageSections && page.pageSections.tracks) {
      customContent.tracks = [
        ...customContent.tracks,
        ...page.pageSections.tracks,
      ];
    }
    if (page.pageSections && page.pageSections.eventInfo) {
      customContent.eventInfo = {
        ...customContent.eventInfo,
        ...page.pageSections.eventInfo,
      };
    }
  });

  customContent.videoRooms = customContent.videoRooms.sort((a, b) => {
    const orderA = a.orderAsc || Infinity;
    const orderB = b.orderAsc || Infinity;
    return orderA >= orderB;
  });

  return {
    pages,
    customContent,
  };
};

module.exports = {
  fetchData,
  queryPages,
  getData: data => data.conf.year[0].pages,
  story: 'pages',
};
