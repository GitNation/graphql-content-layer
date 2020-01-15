# GitNation GraphQL Content Layer [![npm version](https://badge.fury.io/js/%40focus-reactive%2Fgraphql-content-layer.svg)](https://badge.fury.io/js/%40focus-reactive%2Fgraphql-content-layer)

package for fetching conference content from GraphCMS

it's published on NPM as

`@focus-reactive/graphql-content-layer`

This package is intended for:

1. Fetching data from GraphCMS, process and building content layer
2. Generate Storybook with output of:
   1. GraphCMS queries (CMS Layer)
   2. Processed content (Content Layer)


## API and Configuring

1. GraphCMS connection should be configured via env variables: `CMS_ENDPOINT` and `CMS_TOKEN`

2. The package exposes `getContent` async function for generating content layer

Usage:

```js
const { getContent } = require('@focus-reactive/graphql-content-layer');

const content = await getContent(conferenceSettings);

```

see [conferenceSettings](#conferencesettings) for details

3. The package generates Storybook with CMS and Content layers

to use it:

```js
// story.js

const {
  passConferenceSettings,
} = require('@focus-reactive/graphql-content-layer/dist/content.stories');

passConferenceSettings(conferenceSettings);
```


### conferenceSettings

Pass `conferenceSettings` with conference specific ("hardcoded") data

I should contain:

`tagColors` - colors settings for "tech" badges, tags, labels

 ```js
speakerAvatar = {
  dimensions: {
    avatarWidth: 500,
    avatarHeight: 500,
  }
}
 ```
 - image transformation settings for speakers/trainers/mcs and so on avatars

## Develop

`yarn dev` to start watching and compiling the code

`yarn storybook` to launch Storybook

`yarn tdd` - Jest tests in watching mode

`yarn start` - starts dev, storybook and tests (each in independent watch mode)

`yarn update-schema` for updating GraphQL introspection schema

For publishing to NPM:

```shell
npm publish
```

it will transpile the code and publish the package

