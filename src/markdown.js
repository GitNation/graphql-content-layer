var unified = require('unified');
var markdown = require('remark-parse');
var html = require('remark-html');

const markdownToHtml = text =>
  new Promise((resolve, reject) => {
    unified()
      .use(markdown)
      .use(html)
      .process(text, (err, markup) => {
        if (err) reject(err);
        resolve(String(markup));
      });
  });

module.exports = {
  markdownToHtml,
};
