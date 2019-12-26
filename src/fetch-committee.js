const { prepareSpeakers } = require('./utils');

const queryPages = /* GraphQL */ `
  query($conferenceTitle: ConferenceTitle, $eventYear: EventYear) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      status
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        status
        committee {
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
                image: { resize: { width: 500, height: 500, fit: crop } }
                document: { output: { format: jpg } }
              }
            )
          }
        }
      }
    }
  }
`;

const fetchData = async (client, vars) => {
  const data = await client
    .request(queryPages, vars)
    .then(res => res.conf.year[0].committee);

  const speakers = await prepareSpeakers(
    data.map(speaker => ({ speaker, decor: true }))
  );

  return {
    speakers: { committee: await Promise.all([...speakers]) },
  };
};

module.exports = {
  fetchData,
  queryPages,
  getData: data => data.conf.year[0].committee,
  story: 'Programme Committee',
};
