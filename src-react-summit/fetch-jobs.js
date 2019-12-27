const { markdownToHtml } = require('./markdown');

const queryPages = /* GraphQL */ `
  query($conferenceTitle: ConferenceTitle, $eventYear: EventYear) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      status
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        status
        jobs {
          id
          title
          slogan
          subtitle
          description
          image {
            url(
              transformation: {
                image: { resize: { width: 700 } },
                document: { output: { format: jpg } }
              }
            )
          }
          link
        }
      }
    }
  }
`;

const fetchData = async(client, vars) => {
  const data = await client
    .request(queryPages, vars)
    .then(res => res.conf.year[0].jobs);

  const jobsRaw = data.map(async jb => ({
    ...jb,
    slogan: await markdownToHtml(jb.slogan),
    subtitle: await markdownToHtml(jb.subtitle),
    description: await markdownToHtml(jb.description),
    image: jb.image && jb.image.url,
  }));

  const jobs = await Promise.all(jobsRaw);

  return {
    jobs,
  };
};

module.exports = {
  fetchData,
};
