const fetch = require('node-fetch');

const BASE_URL = 'https://ems.gitnation.org';
// const BASE_URL = 'http://localhost:3000';

const getSpeakers = async (eventId) => {
    if (!eventId) {
        return null;
    }

    const res = await fetch(`${BASE_URL}/api/events/${eventId}/speakers`);

    if (res.ok) {
        return res.json();
    }
}

const getPartners = async (eventId) => {
    if (!eventId) {
        return null;
    }

    const res = await fetch(`${BASE_URL}/api/events/${eventId}/partners`);

    if (res.ok) {
        return res.json();
    }
}

const getSchedule = async (eventId) => {
    if (!eventId) {
        return null;
    }

    const res = await fetch(`${BASE_URL}/api/events/${eventId}/schedule`);
    if (res.ok) {
        return res.json();
    }
}

module.exports = {
    getSpeakers,
    getPartners,
    getSchedule,
}