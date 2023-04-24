const fetch = require('node-fetch');

const BASE_URL = 'https://ems.gitnation.org';
// const BASE_URL = 'http://localhost:3000';

const baseEventFetch = (path) => {
    return async (eventId) => {
        if (!eventId) {
            return null;
        }

        const res = await fetch(`${BASE_URL}/api/events/${eventId}/${path}`);
        if (res.ok) {
            return res.json();
        }
    }
}

const getSpeakers = baseEventFetch('speakers');
const getPartners = baseEventFetch('partners');
const getTopSpeaker = baseEventFetch('speakers/top')
const getSchedule = baseEventFetch('schedule');


module.exports = {
    getSpeakers,
    getPartners,
    getSchedule,
    getTopSpeaker,
}