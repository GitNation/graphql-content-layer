const { markdownToHtml } = require('./markdown');
const { labelColors } = require('./config');
const { labelTag } = require('./utils');

const queryPages = /* GraphQL */ `
  query($conferenceTitle: ConferenceTitle, $eventYear: EventYear) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      status
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        status
        speakers: pieceOfSpeakerInfoes {
          status
          id
          label
          speaker {
            id
            name
            company
            country
            bio
            githubUrl
            twitterUrl
            avatar {
              url(
                transformation: {
                  image: { resize: { width: 500, height: 500, fit: crop } },
                  document: { output: { format: jpg } } 
                }
              )
            }
          }
        }
      }
    }
  }
`;

const overlay = labelTag('speaker');

const fetchData = async(client, vars) => {
  const data = await client
    .request(queryPages, vars)
    .then(res => res.conf.year[0].speakers);

  const speakers = data
    .map(item => ({
      ...item.speaker,
      ...item,
      avatar: item.speaker.avatar || {},
      tag: overlay(item.label),
    }))
    .map(async({ bio, githubUrl, twitterUrl, speaker, avatar, ...item }) => ({
      ...item,
      company: `${item.company}, ${item.country}`,
      avatar: avatar.url,
      text: await markdownToHtml(bio),
      github: githubUrl,
      twitter: twitterUrl,
    }));

  return {
    speakers: await Promise.all(speakers),
    labelColors,
  };
};

module.exports = {
  fetchData,
};
