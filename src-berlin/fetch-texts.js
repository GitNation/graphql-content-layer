const { markdownToHtml } = require('./markdown');

const renderStyles = {
  None_Default: 'None_Default',
  Standard_Markdown: 'Standard_Markdown',
};

const queryTexts = /* GraphQL */ `
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

const markdownRender = async (text, style) => {
  const renders = {
    [renderStyles.None_Default]: t => t,
    [renderStyles.Standard_Markdown]: async t => await markdownToHtml(t),
  };
  const defaultRender = renders[renderStyles.None_Default];

  return await (renders[style] || defaultRender)(text);
}

const fetchData = async(client, vars) => {
  const pieceOfTexts = await client
    .request(queryTexts, vars)
    .then(res => res.conf.year[0].pieceOfTexts);

  const pieceOfHTMLs = await Promise.all(
    pieceOfTexts.map(async item => ({
      ...item,
      html: await markdownRender(item.markdown, item.renderStyle),
    }))
  );

  const subContent = pieceOfHTMLs.reduce(
    (obj, item) => ({
      ...obj,
      [item.key]: item.html,
    }),
    {}
  );
  return {
    pagesPieceOfTexts: subContent,
  };
};

module.exports = {
  fetchData,
};
