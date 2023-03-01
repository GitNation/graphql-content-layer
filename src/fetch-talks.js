/* eslint-disable no-underscore-dangle */
const { markdownToHtml } = require('./markdown');

const { trySelectSettings } = require('./utils');
const { formatEvent, groupByTimeFactory } = require('./formatters');

const {
  orgEvent,
  talkEvent,
  discussionRoomEvent,
  panelDiscussionEvent,
  speakerRoomEvent,
  groupLTEvent,
  qaEvent,
} = require('./fragments');

const selectSettings = trySelectSettings(
  s => ({
    labelColors: s.labelColors,
  }),
  {},
);

const updatedQuery = /* GraphQL */ `
  query($conferenceTitle: ConferenceTitle, $eventYear: EventYear) {
    lightningEvents: lightningTalks(
      where: {
        track: {
          conferenceEvent: {
            year: $eventYear
            conferenceBrand: { title: $conferenceTitle }
          }
        }
      }
    ) {
      label
      title
      description
      duration
      youtubeUrl
      extension
      secondaryLabel
      isoDate
      speaker {
        name
        company
        country
        pieceOfSpeakerInfoes {
          label
        }
      }
      track {
        name
      }
      groupAdditionalLTs {
        track {
          name
        }
      }
    }
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      title
      events: conferenceEvents(where: { year: $eventYear }) {
        id
        title
        tracks {
          id
          name
          emptyMessage
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
          }
        }
        tracksOffline {
          id
          name
          emptyMessage
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
          }
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
`;

const notVisibleEventTypes = ['LightningTalk', 'ZoomBar', 'CustomEvent'];

const getSchedule = (tracksData, labelColors) =>
  Promise.all(
    tracksData.map(async (track, ind) => {
      const listWithMarkdown = await Promise.all(
        track.events
          .filter(
            event => notVisibleEventTypes.indexOf(event.__typename) === -1,
          )
          .map(async event => {
            const result = await formatEvent(event, labelColors, track.name);
            return result;
          }),
      );

      const clearList = await Promise.all(
        listWithMarkdown.map(async el => ({
          ...el,
          text: await markdownToHtml(el.text),
          description: await markdownToHtml(el.description),
        })),
      );
      // const listByTime = groupByTime(clearList);

      return {
        tab: track.name,
        tabEmptyMessage: track.emptyMessage,
        title: track.name,
        name: `${10 + ind}`,
        list: clearList,
        // listByTime,
      };
    }),
  );

const getNewSchedule = async (tracksData, labelColors) => {
  const { groupTrack, buildObject } = groupByTimeFactory();

  await Promise.all(
    tracksData.map(async (track, ind) => {
      const listWithMarkdown = await Promise.all(
        track.events
          .filter(
            event => notVisibleEventTypes.indexOf(event.__typename) === -1,
          )
          .map(async event => {
            const result = await formatEvent(event, labelColors, track.name);
            return result;
          }),
      );

      const clearList = await Promise.all(
        listWithMarkdown.map(async el => ({
          ...el,
          text: await markdownToHtml(el.text),
          description: await markdownToHtml(el.description),
        })),
      );

      groupTrack(clearList, track);
    }),
  );

  return buildObject();
}

const fetchData = async (client, { labelColors, ...vars }) => {
  const {
    conf: {
      events: [rawData],
    },
    lightningEvents,
  } = await client.request(updatedQuery, vars).then(res => res);

  const tracksData = rawData.tracks.filter(track => track.isPrimary);
  const tracksOfflineData = rawData.tracksOffline;
  const tracks = tracksData.map(track => track.name);
  const tracksOffline = tracksOfflineData.map(track => track.name);

  // const schedule = await getSchedule(tracksData, labelColors);
  // const scheduleOffline = await getSchedule(tracksOfflineData, labelColors);
  // const newSchedule = await getNewSchedule(tracksData, labelColors);
  const [
    schedule,
    scheduleOffline,
    newSchedule,
    newScheduleOffline
  ] = await Promise.all([
    getSchedule(tracksData, labelColors),
    getSchedule(tracksOfflineData, labelColors),
    getNewSchedule(tracksData, labelColors),
    getNewSchedule(tracksOfflineData, labelColors)
  ]);

  const formattedLightningEvents = await Promise.all(
    lightningEvents.map(async event => {
      const ownTrack = event.track.name;
      const extraTracks = event.groupAdditionalLTs
        ? event.groupAdditionalLTs
            .map(group => group && group.track.name)
            .filter(Boolean)
        : [];
      const trackTitle = [ownTrack, ...extraTracks].join(', ');
      const result = await formatEvent(event, labelColors, trackTitle);
      return result;
    }),
  );

  const talks = schedule.reduce((result, cur) => {
    return [...result, [...cur.list].filter(({ isLightning }) => !isLightning)];
  }, []);

  return {
    scheduleTitle: 'Schedule',
    schedule,
    scheduleOffline,
    newSchedule,
    newScheduleOffline,
    tracks,
    tracksOffline,
    talks,
    zoomBars: [],
    lightningTalks: formattedLightningEvents,
    noTracks: false,
  };
};

module.exports = {
  fetchData,
  selectSettings,
  queryPages: updatedQuery,
  getData: data => data.conf.year[0].schedule,
  story: 'schedule/talks',
};
