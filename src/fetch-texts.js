const { markdownToHtml } = require('./markdown');

const renderStyles = {
  None_Default: 'None_Default',
  Standard_Markdown: 'Standard_Markdown',
};

const queryPages = /* GraphQL */ `
  query($conferenceTitle: ConferenceTitle, $eventYear: EventYear) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      status
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        status
        pieceOfTexts {
          key
          renderStyle
          markdown
        }
      }
    }
  }
`;

const markdownRender = (text, style) => {
  const renders = {
    [renderStyles.None_Default]: t => t,
    [renderStyles.Standard_Markdown]: t => markdownToHtml(t),
  };
  const defaultRender = renders[renderStyles.None_Default];

  return (renders[style] || defaultRender)(text);
};

const fetchData = async (client, vars) => {
  const pieceOfTexts = await client
    .request(queryPages, vars)
    .then(res => res.conf.year[0].pieceOfTexts);

  const pieceOfHTMLs = await Promise.all(
    pieceOfTexts.map(async item => ({
      ...item,
      html: await markdownRender(item.markdown, item.renderStyle),
    })),
  );

  const subContent = pieceOfHTMLs.reduce(
    (obj, item) => ({
      ...obj,
      [item.key]: item.html,
    }),
    {},
  );
  return {
    pagesPieceOfTexts: subContent,
  };
};

module.exports = {
  fetchData,
  queryPages,
  getData: data => data.conf.year[0].pieceOfTexts,
  story: 'texts',
};
