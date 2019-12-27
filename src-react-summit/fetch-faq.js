const { markdownToHtml } = require('./markdown');

const queryTexts = /* GraphQL */ `
  query($conferenceTitle: ConferenceTitle, $eventYear: EventYear) {
    conf: conferenceBrand(where: { title: $conferenceTitle }) {
      id
      status
      year: conferenceEvents(where: { year: $eventYear }) {
        id
        status
        faqs {
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
    .request(queryTexts, vars)
    .then(res => res.conf.year[0].faqs);

  const faqsItems = await Promise.all(
    faqsRow.map(async item => ({
      ...item,
      question: await markdownToHtml(item.question),
      answer: await markdownToHtml(item.answer),
    }))
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
};
