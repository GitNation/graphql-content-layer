const personAvatarFragment = /* GraphQL */ `
  fragment avatarUrl on Speaker {
    avatar {
      url(
        transformation: {
          image: {
            resize: { width: $avatarWidth, height: $avatarHeight, fit: crop }
          }
          document: { output: { format: jpg } }
        }
      )
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
      url(
        transformation: {
          image: { resize: { width: 700 } }
          document: { output: { format: jpg } }
        }
      )
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

const activitiesFragment = /* GraphQL */ `
  fragment activities on Speaker {
    talks(
      where: {
        daySchedule: {
          conferenceEvent: {
            year: $eventYear
            conferenceBrand: { title: $conferenceTitle }
          }
        }
      }
    ) {
      title
      description
      timeString
      isLightning
      track {
        name
        isPrimary
      }
    }
    workshops(
      where: {
        daySchedules_some: {
          conferenceEvent: {
            year: $eventYear
            conferenceBrand: { title: $conferenceTitle }
          }
        }
      }
    ) {
      title
    }
    workshopsActivity: runinigWorkshops(
      where: {
        daySchedules_some: {
          conferenceEvent: {
            year: $eventYear
            conferenceBrand: { title: $conferenceTitle }
          }
        }
      }
    ) {
      title
    }
  }
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
  activitiesFragment,
};
