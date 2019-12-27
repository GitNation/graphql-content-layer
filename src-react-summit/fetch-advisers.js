const queryPages = /* GraphQL */ `
  query($conferenceTitle: ConferenceTitle, $eventYear: EventYear) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      status
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        status
        schedule: daySchedules(where: { adviceLounges_some: {} }) {
          id
          status
          additionalEvents
          adviceLounges {
            status
            id
            expertise
            speaker {
              id
              name
              company
              country
              bio
              githubUrl
              twitterUrl
              mediumUrl
              ownSite
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
  }
`;

const fetchData = async(client, vars) => {
  const data = await client
    .request(queryPages, vars)
    .then(res => res.conf.year[0].schedule);

  const advicers = data.reduce(
    (all, day) => [
      ...all,
      ...day.adviceLounges.map(
        ({
          expertise,
          speaker: {
            name,
            company,
            bio,
            githubUrl,
            twitterUrl,
            mediumUrl,
            ownSite,
            avatar
          },
        }) => ({
          expertise,
          name,
          photo: avatar && avatar.url,
          company,
          desc: bio,
          github: githubUrl,
          twitter: twitterUrl,
          medium: mediumUrl,
          site: ownSite,
        })
      ),
    ],
    []
  );

  return {
    advicers,
  };
};

module.exports = {
  fetchData,
};
