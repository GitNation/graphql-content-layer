import hash from 'object-hash';

const createPagesReport = pages => {
  const pagesKeys = Object.keys(pages);
  const report = pagesKeys.map(key => {
    const page = pages[key];
    const {
      id,
      titleSeo,
      description,
      seoDescription,
      titlePage,
      ...rest
    } = page;
    return {
      pageCode: key,
      id,
      titleSeo,
      description,
      seoDescription,
      titlePage,
      content: hash(rest),
    };
  });
  return report;
};

export const createReport = content => {
  try {
    const {
      pages,
      conference,
      speakers,
      sponsors,
      schedule,
      tracks,
      talks,
      workshops,
      ...rest
    } = content;
    return {
      pages: createPagesReport(pages),
      conference,
    };
  } catch (err) {
    console.error(err);
    return {};
  }
};
