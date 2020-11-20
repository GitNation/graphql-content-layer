const { markdownToHtml } = require('./markdown');
const { contentTypeMap } = require('./utils');

const renderStyles = {
  None_Default: 'None_Default',
  Standard_Markdown: 'Standard_Markdown',
};

const queryPages = /* GraphQL */ `
  query($conferenceTitle: ConferenceTitle, $eventYear: EventYear) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        pieceOfTexts {
          id
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
  const data = await client
    .request(queryPages, vars)
    .then(res => res.conf.year[0].pieceOfTexts);

  const pieceOfHTMLs = await Promise.all(
    data.map(async item => ({
      ...item,
      html: await markdownRender(item.markdown, item.renderStyle),
      contentType: contentTypeMap.PieceOfText,
    })),
  );

  const pagesPieceOfTexts = pieceOfHTMLs.reduce(
    (obj, item) => ({
      ...obj,
      [item.key]: item.html,
    }),
    {},
  );

  const pieceOfTexts = pieceOfHTMLs.reduce(
    (obj, item) => ({
      ...obj,
      [item.key]: item,
    }),
    {},
  );
  return {
    pagesPieceOfTexts,
    pieceOfTexts,
  };
};

module.exports = {
  fetchData,
  queryPages,
  getData: data => data.conf.year[0].pieceOfTexts,
  story: 'texts',
};
