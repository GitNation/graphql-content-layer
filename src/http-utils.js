const fetch = require('node-fetch');

const BASE_URL = 'https://ems.gitnation.org';
// const BASE_URL = 'http://localhost:3000';

const baseEventFetch = path => {
  return async eventId => {
    if (!eventId) {
      return null;
    }

    const res = await fetch(`${BASE_URL}/api/events/${eventId}/${path}`);
    if (res.ok) {
      return res.json();
    }
  };
};

const getSpeakers = baseEventFetch('speakers');
const getPastSpeakers = baseEventFetch('speakers/past');
const getPartners = baseEventFetch('partners');
const getTopSpeaker = baseEventFetch('speakers/top');
const getSchedule = baseEventFetch('schedule');
const getBrand = baseEventFetch('brand');
const getDiscussionRooms = baseEventFetch('discussion-rooms');
const getMcs = baseEventFetch('users?role=MC');
const getCommittee = baseEventFetch('users?role=PC');
const getFreeWorkshops = baseEventFetch('free-workshops');
const getEvent = baseEventFetch('');

module.exports = {
  getSpeakers,
  getPastSpeakers,
  getPartners,
  getSchedule,
  getTopSpeaker,
  getBrand,
  getDiscussionRooms,
  getMcs,
  getCommittee,
  getEvent,
  getFreeWorkshops,
};
