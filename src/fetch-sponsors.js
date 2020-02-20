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
  const aInd = a.order || Infinity;
  const bInd = b.order || Infinity;
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
    .map(({ site, avatar, title, width, category, ...item }) => ({
      ...item,
      category,
      alt: title,
      img: avatar.url,
      link: site,
      width,
    }));

  const sponsors = [
    {
      title: 'Platinum',
      /* TODO: deprecate mode in favor of category */
      mod: 'sponsors-block_xl',
      list: sponsorsList
        .filter(({ category }) => category === 'Platinum')
        .sort(sortByOrder),
      category: 'Platinum',
    },
    {
      title: 'Gold',
      mod: 'logos_md sponsors-block_lg',
      list: sponsorsList
        .filter(({ category }) => category === 'Gold')
        .sort(sortByOrder),
      category: 'Gold',
    },
    {
      title: 'Silver',
      mod: 'logos_sm sponsors-block_lg',
      list: sponsorsList
        .filter(({ category }) => category === 'Silver')
        .sort(sortByOrder),
      category: 'Silver',
    },
    {
      title: 'Party Partners',
      mod: 'logos_sm sponsors-block_lg',
      list: sponsorsList
        .filter(({ category }) => category === 'PartyPartner')
        .sort(sortByOrder),
      category: 'PartyPartner',
    },
    {
      title: 'Production Partners',
      mod: 'logos_sm sponsors-block_lg',
      list: sponsorsList
        .filter(({ category }) => category === 'ProductionPartner')
        .sort(sortByOrder),
      category: 'ProductionPartner',
    },
    {
      title: 'Media Partners',
      mod: 'logos_xs sponsors-block_xs',
      list: sponsorsList
        .filter(({ category }) => category === 'MediaPartner')
        .sort(sortByOrder),
      category: 'MediaPartner',
    },
    {
      title: 'Partners',
      mod: 'logos_xs sponsors-block_xs',
      list: sponsorsList
        .filter(({ category }) => category === 'Partner')
        .sort(sortByOrder),
      category: 'Partner',
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
