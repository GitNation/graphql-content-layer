const {
  orgEvent,
  talkEvent,
  discussionRoomEvent,
  panelDiscussionEvent,
  speakerRoomEvent,
  groupLTEvent,
  qaEvent,
  zoomBarEvent,
  customEvent,
} = require('./fragments');
const { markdownToHtml } = require('./markdown');
const { contentTypeMap, trySelectSettings } = require('./utils');
const { formatEvent } = require('./formatters');

const selectSettings = trySelectSettings(
  s => ({
    labelColors: s.labelColors,
  }),
  {},
);

const queryPages = /* GraphQL */ `
  query($conferenceTitle: ConferenceTitle, $eventYear: EventYear) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        startDate: isoStartDate
        endDate: isoEndDate
        streamNotAvailableText
        emsEventId
        tracks {
          id
          name
          isPrimary
          events {
            __typename
            ... on OrgEvent {
              ...orgEventFragment
            }
            ... on Talk {
              ...talkEventFragment
            }
            ... on QA {
              ...qaEventFragment
            }
            ... on GroupLT {
              ...groupLTEventFragment
            }
            ... on SpeakersRoom {
              ...speakerRoomEventFragment
            }
            ... on DiscussionRoom {
              ...discussionRoomEventFragment
            }
            ... on PanelDiscussion {
              ...panelDiscussionEventFragment
            }
            ... on ZoomBar {
              ...zoomBarEventFragment
            }
            ... on CustomEvent {
              ...customEventFragment
            }
          }
        }
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
          ogImage {
            handle
            mimeType
            url
          }
          ogUrl
        }
      }
    }
  }

  ${orgEvent}
  ${talkEvent}
  ${discussionRoomEvent}
  ${panelDiscussionEvent}
  ${speakerRoomEvent}
  ${groupLTEvent}
  ${qaEvent}
  ${zoomBarEvent}
  ${customEvent}
`;

const fetchData = async (client, { labelColors, ...vars }) => {
  const {
    pages: data,
    tracks,
    startDate,
    endDate,
    streamNotAvailableText,
    emsEventId,
  } = await client.request(queryPages, vars).then(res => res.conf.year[0]);

  const secondaryTracks = tracks.filter(t => !t.isPrimary);
  const mainTracks = tracks.filter(t => t.isPrimary);

  const formattedMainTracks = await Promise.all(
    mainTracks.map(async (track, ind) => {
      const listWithMarkdown = await Promise.all(
        track.events
          // eslint-disable-next-line no-underscore-dangle
          .map(async event => {
            const result = await formatEvent(event, labelColors, track.name);
            return result;
          }),
      );

      const clearList = await Promise.all(
        listWithMarkdown.map(async el => ({
          ...el,
          text: await markdownToHtml(el.text),
        })),
      );

      return {
        tab: track.name,
        title: track.name,
        name: `${10 + ind}`,
        odd: Boolean(ind % 2),
        list: clearList,
      };
    }),
  );

  const formattedSecondaryTracks = await Promise.all(
    secondaryTracks.map(async (track, ind) => {
      const listWithMarkdown = await Promise.all(
        track.events
          // eslint-disable-next-line no-underscore-dangle
          .map(async event => {
            const result = await formatEvent(event, labelColors, track.name);
            return result;
          }),
      );

      const clearList = await Promise.all(
        listWithMarkdown.map(async el => ({
          ...el,
          text: await markdownToHtml(el.text),
        })),
      );

      return {
        tab: track.name,
        title: track.name,
        name: `${10 + ind}`,
        odd: Boolean(ind % 2),
        list: clearList,
      };
    }),
  );

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

  const videoRooms = formattedSecondaryTracks.reduce((result, currentTrack) => {
    return [
      ...result,
      ...currentTrack.list.filter(
        event => event.eventType === 'DiscussionRoom',
      ),
    ];
  }, []);

  const zoomBars = formattedMainTracks.reduce((result, currentTrack) => {
    return [
      ...result,
      ...currentTrack.list.filter(event => event.eventType === 'ZoomBar'),
    ];
  }, []);

  const customEvents = formattedMainTracks.reduce((result, currentTrack) => {
    return [
      ...result,
      ...currentTrack.list.filter(event => event.eventType === 'CustomEvent'),
    ];
  }, []);

  const customContent = {
    videoRooms: videoRooms.length ? videoRooms : null,
    customEvents: customEvents.length ? customEvents : null,
    zoomBars: zoomBars.length ? zoomBars : null,
    scheduleExtends: [],
    tracks: formattedSecondaryTracks,
    eventInfo: {},
  };

  data.forEach(page => {
    if (page.pageSections && page.pageSections.scheduleExtends) {
      customContent.scheduleExtends = [
        ...customContent.scheduleExtends,
        ...page.pageSections.scheduleExtends,
      ];
    }

    if (page.pageSections && page.pageSections.eventInfo) {
      customContent.eventInfo = {
        ...customContent.eventInfo,
        ...page.pageSections.eventInfo,
        conferenceStart: startDate,
        conferenceFinish: endDate,
        QuakeJS: customEvents.length
          ? customEvents.find(e => e.title === 'QuakeJS Tournament')
          : null,
      };
    }
  });

  if (streamNotAvailableText) {
    customContent.eventInfo.streamNotAvailableText = await markdownToHtml(
      streamNotAvailableText,
    );
  }

  if (emsEventId) {
    customContent.eventInfo.emsEventId = emsEventId;
  }

  return {
    pages,
    customContent,
  };
};

module.exports = {
  fetchData,
  selectSettings,
  queryPages,
  getData: data => data.conf.year[0].pages,
  story: 'pages',
};
