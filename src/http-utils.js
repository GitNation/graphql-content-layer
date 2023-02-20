const fetch = require('node-fetch');

const BASE_URL = 'https://ems.gitnation.org';

const getPartners = async (eventId) => {
    if (!eventId) {
        return null;
    }

    const res = await fetch(`${BASE_URL}/api/events/${eventId}/partners`);

    if (res.ok) {
        return res.json();
    }
}

module.exports = {
    getPartners,
}