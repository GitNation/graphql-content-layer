const { labelColors } = require('./config');

const labelTag = prefix => label => {
  const colorInfo =
    labelColors.find(c => c.label === label) ||
    labelColors.find(c => c.label === null);
  return `${prefix}--${colorInfo.tag}`;
};

module.exports = {
  labelTag
};
