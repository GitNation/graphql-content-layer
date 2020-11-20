const fallback = require('./fallback-settings');

const confCodes = [
  'jsn',
  'gqconf',
  'mlconf',
  'qaconf',
  'doconf',
  'nodeconf',
  'rs',
];

const getSettings = () => {
  const settings = confCodes.reduce(
    (acc, code) => ({ ...acc, [code]: fallback }),
    {},
  );
  try {
    confCodes.forEach(code => {
      settings[
        code
      ] = require(`../../live-conferences/src/conferences/${code}/conference-settings`);
    });
    return settings;
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.log(
        `\n\nCan't find live-conferences folder. Fallback settings will be used!\n\n`,
      );
      return settings;
    }
    throw err;
  }
};

module.exports = { getSettings };
