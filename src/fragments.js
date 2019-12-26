const personAvatarFragment = /* GraphQL */ `
  fragment avatarUrl on Speaker {
    avatar {
      url #(
        # transformation: {
        #   image: { resize: { width: 500, height: 500, fit: crop } }
        #   document: { output: { format: jpg } }
        # }
      #)
    }
  }
`;

const sponsorLogoFragment = /* GraphQL */ `
  fragment imageUrl on Asset {
    url #(
      # transformation: {
      #   image: { resize: { width: 500, height: 500, fit: crop } }
      #   document: { output: { format: jpg } }
      # }
    #)
  }
`;

const jobLogoFragment = /* GraphQL */ `
  fragment logo on Job {
    image {
      url #(
        # transformation: {
        #   image: { resize: { width: 555 } }
        #   document: { output: { format: jpg } }
        # }
      #)
    }
  }
`;

const personFragment = /* GraphQL */ `
  fragment person on Speaker {
    id
    name
    company
    country
    bio
    githubUrl
    twitterUrl
    mediumUrl
    ownSite
    ...avatarUrl
  }

  ${personAvatarFragment}
`;

const speakerInfoFragment = /* GraphQL */ `
  fragment speakerInfo on PieceOfSpeakerInfo {
    status
    id
    label
    isNightSpeaker
    order
    speaker {
      ...person
    }
  }

  ${personFragment}
`;

module.exports = {
  speakerInfoFragment,
  personAvatarFragment,
  personFragment,
  sponsorLogoFragment,
  jobLogoFragment,
};
