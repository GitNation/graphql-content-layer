const React = require('react');
const ReactJson = require('react-json-view').default;
const {
  QueryParams,
  withGraphCMS,
} = require('@focus-reactive/storybook-addon-graphcms');
const { storiesOf } = require('@storybook/react');

const { credentials, conferenceTitle, eventYear } = require('./config');
const { queriesData, getContent } = require('./index');

const AwaitForData = ({ content }) => {
  if (!content) return 'Loading data from GraphCMS';
  return <ReactJson src={content} name="content" collapsed={2} />;
};

const TagColor = ({ title, tag }) => (
  <div
    style={{
      margin: 16,
      padding: 8,
      color: tag.color,
      backgroundColor: tag.tagBG,
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 18,
      fontFamily: 'sans-serif',
    }}
  >
    <b>{title}</b>
    <span>{`[color: ${tag.color}, bg: ${tag.tagBG}]`}</span>
  </div>
);

const passConferenceSettings = async conferenceSettings => {
  const content = await getContent(conferenceSettings);

  storiesOf('Content Layer', module)
    .add('content', () => <AwaitForData content={content} />)
    .add('tag colors', () => {
      const { tagColors } = content.conferenceSettings;
      const tags = Object.keys(tagColors);
      return (
        <div>
          {tags.map(tag => (
            <TagColor key={tag} title={tag} tag={tagColors[tag]} />
          ))}
        </div>
      );
    });

  const cmsStories = storiesOf('CMS Layer', module).addDecorator(
    withGraphCMS(credentials),
  );

  queriesData.forEach(({ queryPages, getData, story, vars }) => {
    cmsStories.add(
      story,
      () => null,
      QueryParams({
        name: story,
        query: queryPages,
        vars: { conferenceTitle, eventYear, ...vars },
        searchVars: { search: '' },
        getData,
        isConnected: true,
      }),
    );
  });
};

module.exports = {
  passConferenceSettings,
};
