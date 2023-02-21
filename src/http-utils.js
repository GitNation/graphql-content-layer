const fetch = require('node-fetch');

const BASE_URL = 'https://ems.gitnation.org';

const getSpeakers = async (eventId) => {
    if (!eventId) {
        return null;
    }

    const res = await fetch(`${BASE_URL}/api/events/${eventId}/speakers`);

    if (res.ok) {
        return res.json();
    }
}

module.exports = {
    getSpeakers,
}