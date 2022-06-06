const { contentTypeMap } = require('./utils');

const queryPages = /* GraphQL */ `
  query($conferenceTitle: ConferenceTitle, $eventYear: EventYear) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        sponsors: pieceOfSponsorInfoes {
          id
          category
          order
          site
          avatar {
            handle
            mimeType
            url
          }
          sponsor {
            id
            title
            site
            avatar {
              handle
              mimeType
              url
            }
          }
          width
        }
      }
    }
  }
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
    .map(item => {
      const correctSite = item.site ? item.site : item.sponsor.site;

      return {
        ...item.sponsor,
        ...item,
        site: correctSite,
        avatar: item.avatar || item.sponsor.avatar || {},
        idAlt: item.id,
        id: item.sponsor ? item.sponsor.id : 'error: no sponsor object',
        contentType: contentTypeMap.Sponsor,
        contentTypeAlt: contentTypeMap.PieceOfSponsorInfo,
      };
    })
    .map(({ site, avatar, title, width, category, ...item }) => ({
      ...item,
      category,
      alt: title,
      img: avatar.url,
      imgHandle: avatar.handle,
      imgMimeType: avatar.mimeType,
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
      title: 'Bronze',
      mod: 'logos_sm sponsors-block_lg',
      list: sponsorsList
        .filter(({ category }) => category === 'Bronze')
        .sort(sortByOrder),
      category: 'Bronze',
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
    {
      title: 'Tech Partners',
      mod: 'logos_xs sponsors-block_xs',
      list: sponsorsList
        .filter(({ category }) => category === 'TechPartner')
        .sort(sortByOrder),
      category: 'TechPartner',
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
