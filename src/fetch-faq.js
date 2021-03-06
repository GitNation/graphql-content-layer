const { markdownToHtml } = require('./markdown');
const { contentTypeMap } = require('./utils');

const queryPages = /* GraphQL */ `
  query($conferenceTitle: ConferenceTitle, $eventYear: EventYear) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        faqs {
          id
          category
          question
          answer
        }
      }
    }
  }
`;

const fetchData = async (client, vars) => {
  const faqsRow = await client
    .request(queryPages, vars)
    .then(res => res.conf.year[0].faqs);

  const faqsItems = await Promise.all(
    faqsRow.map(async item => ({
      ...item,
      question: await markdownToHtml(item.question),
      answer: await markdownToHtml(item.answer),
      contentType: contentTypeMap.Faq,
    })),
  );

  const categories = [...new Set(faqsItems.map(i => i.category))];

  const faqs = categories.map(cat => ({
    sectionTitle: cat,
    items: faqsItems.filter(i => i.category === cat),
  }));

  return {
    faqs,
  };
};

module.exports = {
  fetchData,
  queryPages,
  getData: data => data.conf.year[0].faqs,
  story: 'FAQ',
};
