const imageUrlFragment = /* GraphQL */ `
  fragment imageUrl on Speaker {
    avatar {
      url(transformation: {image: {resize: {width: 500, height: 500, fit: crop}}, document: {output: {format: jpg}}})
    }
  }
`;

const speakerFragment = /* GraphQL */ `
  fragment speaker on PieceOfSpeakerInfo {
    status
    id
    label
    isNightSpeaker
    order
    speaker {
      id
      name
      company
      country
      bio
      githubUrl
      twitterUrl
      mediumUrl
      ownSite
      ...imageUrl
    }
  }

  ${imageUrlFragment}
`;

module.exports = {
  speakerFragment,
  imageUrlFragment,
};
