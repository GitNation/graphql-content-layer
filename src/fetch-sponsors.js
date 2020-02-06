const { sponsorLogoFragment } = require('./fragments');

const queryPages = /* GraphQL */ `
  query($conferenceTitle: ConferenceTitle, $eventYear: EventYear) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      status
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        status
        sponsors: pieceOfSponsorInfoes {
          status
          id
          category
          order
          avatar {
            ...imageUrl
          }
          sponsor {
            id
            status
            title
            site
            avatar {
              ...imageUrl
            }
          }
          width
        }
      }
    }
  }

  ${sponsorLogoFragment}
`;

const sortByOrder = (a, b) => {
  const aInd = a.order || 0;
  const bInd = b.order || 0;
  return aInd - bInd;
};

const fetchData = async (client, vars) => {
  const data = await client
    .request(queryPages, vars)
    .then(res => res.conf.year[0].sponsors);

  const sponsorsList = data
    .map(item => ({
      ...item.sponsor,
      ...item,
      avatar: item.avatar || item.sponsor.avatar || {},
    }))
    .map(({ site, avatar, title, width, category }) => ({
      category,
      alt: title,
      img: avatar.url,
      link: site,
      width,
    }));

  const sponsors = [
    {
      title: 'Platinum',
      list: sponsorsList
        .filter(({ category }) => category === 'Platinum')
        .sort(sortByOrder),
    },
    {
      title: 'Production Partners',
      mod: 'logos_sm',
      list: sponsorsList
        .filter(({ category }) => category === 'ProductionPartner')
        .sort(sortByOrder),
    },
    {
      title: 'Gold',
      mod: 'logos_md',
      list: sponsorsList
        .filter(({ category }) => category === 'Gold')
        .sort(sortByOrder),
    },
    {
      title: 'Silver',
      mod: 'logos_sm',
      list: sponsorsList
        .filter(({ category }) => category === 'Silver')
        .sort(sortByOrder),
    },
    {
      title: 'Media Partners',
      mod: 'logos_xs',
      list: sponsorsList
        .filter(({ category }) => category === 'MediaPartner')
        .sort(sortByOrder),
    },
    {
      title: 'Partner',
      mod: 'logos_xs',
      list: sponsorsList
        .filter(({ category }) => category === 'Partner')
        .sort(sortByOrder),
    },
  ].filter(({ list }) => list.length);

  return {
    sponsors,
  };
};

module.exports = {
  fetchData,
  queryPages,
  getData: res => res.conf.year[0].sponsors,
  story: 'sponsors',
};
