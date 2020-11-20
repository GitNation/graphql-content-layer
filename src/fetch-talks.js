const { markdownToHtml } = require('./markdown');

const { trySelectSettings } = require('./utils');
const { formatEvent } = require('./formatters');

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
      groupLT {
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

const fetchData = async (client, { labelColors, ...vars }) => {
  const {
    conf: {
      events: [rawData],
    },
    lightningEvents,
  } = await client.request(updatedQuery, vars).then(res => res);

  const tracksData = rawData.tracks.filter(track => track.isPrimary);
  const tracks = tracksData.map(track => track.name);

  const schedule = await Promise.all(
    tracksData.map(async (track, ind) => {
      const listWithMarkdown = await Promise.all(
        track.events
          // eslint-disable-next-line no-underscore-dangle
          .filter(event => event.__typename !== 'LightningTalk')
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
        list: clearList,
      };
    }),
  );

  const formattedLightningEvents = await Promise.all(
    lightningEvents.map(async event => {
      const result = await formatEvent(
        event,
        labelColors,
        event.groupLT.track.name,
      );
      return result;
    }),
  );

  const talks = schedule.reduce((result, cur) => {
    return [...result, [...cur.list].filter(({ isLightning }) => !isLightning)];
  }, []);

  return {
    scheduleTitle: 'Schedule',
    schedule,
    tracks,
    talks,
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
