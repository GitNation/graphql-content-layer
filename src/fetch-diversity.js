const { markdownToHtml } = require('./markdown');
const { contentTypeMap } = require('./utils');

const queryPages = /* GraphQL */ `
  query($conferenceTitle: ConferenceTitle, $eventYear: EventYear) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      status
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        status
        diversity {
          id
          status
          title
          description
          maxTickets
          sponsoredTickets
          applyButtonText
          applyButtonLink
          showApplyButton
          sponsorButtonText
          sponsorButtonLink
          showSponsorButton
          sponsors {
            id
            title
            site
            avatar {
              url
            }
          }
        }
      }
    }
  }
`;

const fetchData = async (client, { tagColors, ...vars }) => {
  const data = await client
    .request(queryPages, vars)
    .then(res => res.conf.year[0].diversity);
  if (!data) {
    return {};
  }

  let { maxTickets, sponsoredTickets } = data;

  if (sponsoredTickets < 0) {
    sponsoredTickets = 0;
  }
  if (maxTickets <= 0) {
    maxTickets = 1;
  }
  if (sponsoredTickets > maxTickets) {
    maxTickets = sponsoredTickets;
  }

  const diversity = {
    ...data,
    description: await markdownToHtml(data.description),
    sponsors: data.sponsors.map(({ title, avatar: { url }, id, site }) => ({
      id,
      title,
      site,
      avatar: url,
      contentType: contentTypeMap.Sponsor,
    })),
    progress: Math.round((100 * sponsoredTickets) / maxTickets),
    contentType: contentTypeMap.Diversity,
  };

  return {
    diversity,
  };
};

module.exports = {
  fetchData,
  queryPages,
  getData: data => data.conf.year[0].diversity,
  story: 'diversity',
};
