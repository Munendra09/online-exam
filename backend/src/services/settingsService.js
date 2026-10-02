const { Setting } = require('../models');
const cache = require('./cacheService');

const KEYS = {
  REGISTRATION_OPEN: 'registration_open',
  REGISTRATION_DEADLINE: 'registration_deadline',
  REGISTRATION_MESSAGE: 'registration_message',
};

const CACHE_KEY = 'settings:registration';
const CACHE_TTL = 300; // 5 minutes

async function get(key) {
  const row = await Setting.findOne({ where: { key } });
  return row ? row.value : null;
}

async function set(key, value) {
  const [row] = await Setting.findOrCreate({ where: { key }, defaults: { value } });
  if (row.value !== value) { row.value = value; await row.save(); }
  // Invalidate registration cache when any setting changes
  cache.invalidatePrefix('settings:');
  return row;
}

async function getAllRegistration() {
  return cache.getOrSet(CACHE_KEY, async () => {
    const [openVal, deadlineVal, messageVal] = await Promise.all([
      get(KEYS.REGISTRATION_OPEN),
      get(KEYS.REGISTRATION_DEADLINE),
      get(KEYS.REGISTRATION_MESSAGE),
    ]);

    const registrationOpen = openVal !== 'false' && openVal !== null ? true : openVal === 'true';
    let isOpen = !!registrationOpen;

    let deadline = null;
    if (deadlineVal) {
      const d = new Date(deadlineVal);
      if (!isNaN(d.getTime())) {
        deadline = d.toISOString();
        if (new Date() > d) isOpen = false;
      }
    }

    const message = messageVal || 'Registration is currently closed. Please contact admin.';
    return { isOpen, registrationOpen, deadline, message };
  }, CACHE_TTL);
}

module.exports = { KEYS, get, set, getAllRegistration };

