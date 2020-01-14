const React = require('react');
const ReactJson = require('react-json-view').default;
const {
  Query,
  withGraphCMS,
} = require('@focus-reactive/storybook-addon-graphcms');
const { storiesOf } = require('@storybook/react');

const { credentials, conferenceTitle, eventYear } = require('./config');
const { queriesData, getContent } = require('./index');
const { tagColors } = require('./utils');

const allStories = {};

const AwaitForData = ({ promise }) => {
  const [content, setContent] = React.useState(null);
  React.useEffect(() => {
    promise.then(res => setContent(res));
  }, [getContent]);
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

/**
 * getContent is async
 * but when it starts it populate `queriesData` with queries
 * we need to get it first for creating stories
 * after that we can wait for real data and show inner content
 */
const contentPromise = getContent();

queriesData.forEach(
  ({ queryPages, getData, story, vars }) => {
    allStories[story] = Query({
      name: story,
      query: queryPages,
      vars: { conferenceTitle, eventYear, ...vars },
      searchVars: { search: '' },
      getData,
    });
  },
);

module.exports = {
  default: {
    title: 'GraphCMS content',
    decorators: [withGraphCMS(credentials)],
  },
  ...allStories,
};

storiesOf('Inner structure', module)
  .add('content', () => <AwaitForData promise={contentPromise} />)
  .add('tag colors', () => {
    const tags = Object.keys(tagColors);
    return (
      <div>
        {tags.map(tag => (
          <TagColor key={tag} title={tag} tag={tagColors[tag]} />
        ))}
      </div>
    );
  });
