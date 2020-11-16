const fs = require('fs');
const path = require('path');

const { getContent } = require('../dist');
const { getSettings } = require('./conference-settings');

const CURRENT_CONF = 'qaconf';

const testLaunch = async () => {
  const settings = getSettings();
  const content = await getContent(settings[CURRENT_CONF]);

  fs.writeFileSync(
    path.resolve(__dirname, '../content-log.json'),
    JSON.stringify(content, null, 2),
  );
  // console.log('content', content);
};

testLaunch();
