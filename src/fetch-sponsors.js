const {
  contentTypeMap,
  newSponsorCategoryToOld,
  sortByOrder,
} = require('./utils');
const { getPartners } = require('./http-utils');

const queryPages = /* GraphQL */ `
  query($conferenceTitle: ConferenceTitle, $eventYear: EventYear) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        emsEventId
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

const fetchData = async (client, vars) => {
  let emsEventId = null;
  const data = await client.request(queryPages, vars).then(res => {
    // eslint-disable-next-line prefer-destructuring
    emsEventId = res.conf.year[0].emsEventId;
    return res.conf.year[0].sponsors;
  });

  const emsSponsors = (await getPartners(emsEventId)) || [];

  const emsSponsorsToOldFormat = emsSponsors.map(item => ({
    id: item.name,
    category: newSponsorCategoryToOld(item.type),
    site: item.url,
    order: null,
    avatar: {
      id: item.name,
      handle: item.logoHandle || null,
      url: item.logo,
    },
    sponsor: {
      id: item.name,
      title: item.name,
      site: item.url,
      avatar: null,
      idAlt: item.name,
    },
    width: item.width,
  }));

  const fullData = [...data, ...emsSponsorsToOldFormat];

  const sponsorsList = fullData
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
