const conferenceTitle = 'React_Amsterdam';
const eventYear = 'Y2020';

const tagColors = {
  NodeJS: {
    tagBG: '#7AB464',
    color: '#fff',
  },
  WebGL: {
    tagBG: '#ff7302',
    color: '#ffffff',
  },
  Ecosystem: {
    tagBG: '#fff40d',
    color: '#ae4f01',
  },
  Language: {
    tagBG: '#fff40d',
    color: '#ae4f01',
  },
  GraphQL: {
    tagBG: '#f200fa',
    color: '#400042',
  },
  VueJS: {
    tagBG: '#4EBA87',
    color: '#fff',
  },
  Performance: {
    tagBG: '#00ed24',
    color: '#00410a',
  },
  TypeScript: {
    tagBG: '#61DAFB',
    color: '#030303',
  },
  'Summit Track': {
    tagBG: '#a4ff00',
    color: '#324e00',
  },
  'Base Camp Track': {
    tagBG: '#696969',
    color: '#e7e7e7',
  },
  'Lightning Talk': {
    tagBG: '#2acadd',
    color: '#003238',
  },
  'Panel Discussion': {
    tagBG: '#ddce2a',
    color: '#3f3a00',
  },
  Workshop: {
    tagBG: '#bd2add',
    color: '#f3cbff',
  },
  default: {
    tagBG: 'black',
    color: 'white',
  },
};

const speakerAvatar = {
  dimensions: {
    avatarWidth: 500,
    avatarHeight: 500,
  },
};

module.exports = {
  tagColors,
  speakerAvatar,
  conferenceTitle,
  eventYear,
};
