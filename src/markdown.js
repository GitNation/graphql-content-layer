const unified = require('unified');
const markdown = require('remark-parse');
const html = require('remark-html');

const markdownToHtml = text =>
  text
    ? new Promise((resolve, reject) => {
        unified()
          .use(markdown)
          .use(html)
          .process(text, (err, markup) => {
            if (err) reject(err);
            resolve(String(markup));
          });
      })
    : null;

module.exports = {
  markdownToHtml,
};
