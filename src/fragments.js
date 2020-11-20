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
    idMain: id
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
    lightningTalks(
      where: {
        track: {
          conferenceEvent: {
            year: $eventYear
            conferenceBrand: { title: $conferenceTitle }
          }
        }
      }
    ) {
      id
      title
      description
      timeString: isoDate
      track {
        name
        isPrimary
      }
    }
    talks(
      where: {
        track: {
          conferenceEvent: {
            year: $eventYear
            conferenceBrand: { title: $conferenceTitle }
          }
        }
      }
    ) {
      id
      title
      description
      timeString: isoDate
      track {
        name
        isPrimary
      }
    }
    workshops(
      where: {
        conferenceEvents_some: {
          year: $eventYear
          conferenceBrand: { title: $conferenceTitle }
        }
      }
    ) {
      title
    }
    workshopsActivity: runinigWorkshops(
      where: {
        conferenceEvents_some: {
          year: $eventYear
          conferenceBrand: { title: $conferenceTitle }
        }
      }
    ) {
      title
    }
  }
`;

const speakerInfoFragment = /* GraphQL */ `
  fragment speakerInfo on PieceOfSpeakerInfo {
    id
    idAlt: id
    label
    isNightSpeaker
    order
    speaker {
      ...person
    }
  }

  ${personFragment}
`;

const orgEvent = /* GraphQL */ `
  fragment orgEventFragment on OrgEvent {
    title
    description
    isoDate
    duration
    extension
  }
`;
const talkEvent = /* GraphQL */ `
  fragment talkEventFragment on Talk {
    speaker {
      name
      company
      country
      pieceOfSpeakerInfoes {
        label
      }
      avatar {
        url
      }
    }
    label
    title
    description
    isoDate
    duration
    secondaryLabel
    extension
    youtubeUrl
  }
`;
const qaEvent = /* GraphQL */ `
  fragment qaEventFragment on QA {
    title
    description
    isoDate
    duration
    extension
  }
`;
const groupLTEvent = /* GraphQL */ `
  fragment groupLTEventFragment on GroupLT {
    title
    description
    isoDate
    duration
    extension
    youtubeUrl
    extension
    lightningTalks {
      id
      title
      label
      description
      isoDate
      track {
        name
        isPrimary
      }
    }
  }
`;
const speakerRoomEvent = /* GraphQL */ `
  fragment speakerRoomEventFragment on SpeakersRoom {
    title
    speakers {
      name
      company
      country
      pieceOfSpeakerInfoes {
        label
      }
      avatar {
        url
      }
    }
    description
    isoDate
    duration
    extension
    roomLink
    subTrackIndex
  }
`;
const discussionRoomEvent = /* GraphQL */ `
  fragment discussionRoomEventFragment on DiscussionRoom {
    title
    speakers {
      name
      company
      country
      pieceOfSpeakerInfoes {
        label
      }
      avatar {
        url
      }
    }
    description
    isoDate
    duration
    extension
    pic {
      id
      url
    }
    roomLink
    roomLinkText
    subTrackIndex
  }
`;

module.exports = {
  speakerInfoFragment,
  personAvatarFragment,
  personFragment,
  sponsorLogoFragment,
  jobLogoFragment,
  activitiesFragment,
  orgEvent,
  talkEvent,
  discussionRoomEvent,
  speakerRoomEvent,
  groupLTEvent,
  qaEvent,
};
