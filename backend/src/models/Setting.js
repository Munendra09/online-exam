const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Setting — Global key/value settings.
 * Keys: registration_open, registration_deadline, registration_message
 */
const Setting = sequelize.define('Setting', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  key: { type: DataTypes.STRING(60), allowNull: false, unique: true },
  value: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'settings',
  indexes: [{ fields: ['key'] }],
});

const mapKey = (key) => {
  if (key === 'registrationOpen') return 'registration_open';
  if (key === 'registrationDeadline') return 'registration_deadline';
  if (key === 'registrationClosedMessage') return 'registration_message';
  return key;
};

Setting.getValue = async function (key, defaultValue = null) {
  const dbKey = mapKey(key);
  const row = await Setting.findOne({ where: { key: dbKey } });
  if (!row) return defaultValue;
  if (dbKey === 'registration_open') {
    return row.value === 'true';
  }
  return row.value;
};

Setting.setValue = async function (key, value) {
  const dbKey = mapKey(key);
  const [row] = await Setting.findOrCreate({
    where: { key: dbKey },
    defaults: { value: String(value) },
  });
  if (row.value !== String(value)) {
    row.value = String(value);
    await row.save();
  }
  
  // Invalidate cache since settings changed
  try {
    const cache = require('../services/cacheService');
    cache.invalidatePrefix('settings:');
  } catch (err) {
    console.error('Failed to invalidate cache in Setting.setValue:', err.message);
  }

  return row;
};

module.exports = Setting;
