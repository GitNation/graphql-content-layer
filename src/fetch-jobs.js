const { markdownToHtml } = require('./markdown');
const { jobLogoFragment } = require('./fragments');
const { contentTypeMap } = require('./utils');

const queryPages = /* GraphQL */ `
  query($conferenceTitle: ConferenceTitle, $eventYear: EventYear) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      status
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        status
        jobAds {
          id
          title
          slogan
          subtitle
          description
          ...logo
          link
          events {
            title
          }
        }
        jobs {
          id
          title
          slogan
          subtitle
          description
          ...logo
          link
        }
      }
    }
  }

  ${jobLogoFragment}
`;

const fetchData = async (client, vars) => {
  const data = await client
    .request(queryPages, vars)
    .then(res => res.conf.year[0]);

  const fetchedJobs = data.jobs;
  const fetchedJobAds = data.jobAds;

  const jobsRaw = [...fetchedJobAds, ...fetchedJobs].map(async jb => ({
    ...jb,
    slogan: await markdownToHtml(jb.slogan),
    subtitle: await markdownToHtml(jb.subtitle),
    description: await markdownToHtml(jb.description),
    image: jb.image && jb.image.url,
    contentType: contentTypeMap.Job,
  }));

  const jobs = await Promise.all(jobsRaw);

  return {
    jobs,
  };
};

module.exports = {
  fetchData,
  queryPages,
  getData: data => data.conf.year[0].jobs,
  story: 'Jobs',
};
