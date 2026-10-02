const fs = require('fs');
const path = require('path');
const cache = require('../services/cacheService');
const { Class } = require('../models');

const CLASSES_FILE = path.join(__dirname, '..', 'data', 'classes.json');
const CACHE_KEY = 'classes:list';
const CACHE_TTL = 600; // 10 minutes

/**
 * Seed classes from JSON to DB if database has 0 classes.
 * This runs on startup / first API call to guarantee backward compatibility and easy migration.
 */
async function ensureClassesSeeded() {
  try {
    const count = await Class.count();
    if (count === 0 && fs.existsSync(CLASSES_FILE)) {
      console.log('🔄 First run/Empty classes table: Migrating classes from JSON to database...');
      const raw = fs.readFileSync(CLASSES_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      const list = parsed.classes || [];
      if (list.length > 0) {
        await Class.bulkCreate(list.map(c => ({
          name: c.name,
          minAge: Number(c.minAge) || 0,
          maxAge: Number(c.maxAge) || 100
        })));
        console.log(`✅ Seeded ${list.length} classes from JSON into DB.`);
      }
    }
  } catch (err) {
    console.error('❌ Failed to auto-seed classes from JSON:', err.message);
  }
}

// Trigger auto-seeding immediately on module load
ensureClassesSeeded();

/* ============================================================
 * GET /api/classes — List all classes (public)
 * ============================================================ */
exports.list = async (req, res) => {
  let classes = cache.get(CACHE_KEY);
  if (!classes) {
    await ensureClassesSeeded();
    const dbClasses = await Class.findAll({
      order: [['id', 'ASC']]
    });
    classes = dbClasses.map(c => ({
      name: c.name,
      minAge: c.minAge,
      maxAge: c.maxAge
    }));
    cache.set(CACHE_KEY, classes, CACHE_TTL);
  }
  res.json({ success: true, classes });
};

/* ============================================================
 * POST /api/classes — Add a new class (admin)
 * Body: { name, minAge, maxAge }
 * ============================================================ */
exports.add = async (req, res) => {
  const { name, minAge, maxAge } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Class name is required' });
  }

  const trimmedName = name.trim();

  // Check duplicate
  const existing = await Class.findOne({ where: { name: trimmedName } });
  if (existing) {
    return res.status(409).json({ success: false, message: `Class "${trimmedName}" already exists` });
  }

  await Class.create({
    name: trimmedName,
    minAge: Number(minAge) || 0,
    maxAge: Number(maxAge) || 100,
  });

  cache.invalidate(CACHE_KEY);

  // Get fresh list
  const dbClasses = await Class.findAll({ order: [['id', 'ASC']] });
  const classes = dbClasses.map(c => ({
    name: c.name,
    minAge: c.minAge,
    maxAge: c.maxAge
  }));

  res.status(201).json({
    success: true,
    message: `Class "${trimmedName}" added successfully`,
    classes,
  });
};

/* ============================================================
 * PUT /api/classes/:name — Update a class (admin)
 * Body: { newName, minAge, maxAge }
 * ============================================================ */
exports.update = async (req, res) => {
  const oldName = decodeURIComponent(req.params.name);
  const { newName, minAge, maxAge } = req.body;

  const cls = await Class.findOne({ where: { name: oldName } });

  if (!cls) {
    return res.status(404).json({ success: false, message: `Class "${oldName}" not found` });
  }

  // If renaming, check duplicate
  if (newName && newName.trim() !== oldName) {
    const trimmedNew = newName.trim();
    const existing = await Class.findOne({ where: { name: trimmedNew } });
    if (existing) {
      return res.status(409).json({ success: false, message: `Class "${trimmedNew}" already exists` });
    }
    cls.name = trimmedNew;
  }

  if (minAge !== undefined) cls.minAge = Number(minAge) || 0;
  if (maxAge !== undefined) cls.maxAge = Number(maxAge) || 100;

  await cls.save();
  cache.invalidate(CACHE_KEY);

  // Get fresh list
  const dbClasses = await Class.findAll({ order: [['id', 'ASC']] });
  const classes = dbClasses.map(c => ({
    name: c.name,
    minAge: c.minAge,
    maxAge: c.maxAge
  }));

  res.json({
    success: true,
    message: `Class "${cls.name}" updated successfully`,
    classes,
  });
};

/* ============================================================
 * DELETE /api/classes/:name — Remove a class (admin)
 * ============================================================ */
exports.remove = async (req, res) => {
  const name = decodeURIComponent(req.params.name);
  const deletedCount = await Class.destroy({ where: { name } });

  if (deletedCount === 0) {
    return res.status(404).json({ success: false, message: `Class "${name}" not found` });
  }

  cache.invalidate(CACHE_KEY);

  // Get remaining list
  const dbClasses = await Class.findAll({ order: [['id', 'ASC']] });
  const classes = dbClasses.map(c => ({
    name: c.name,
    minAge: c.minAge,
    maxAge: c.maxAge
  }));

  res.json({
    success: true,
    message: `Class "${name}" removed successfully`,
    classes,
  });
};

// Export readClasses (asynchronous helper for backward compatibility)
exports.readClasses = async () => {
  await ensureClassesSeeded();
  const dbClasses = await Class.findAll({ order: [['id', 'ASC']] });
  return dbClasses.map(c => ({
    name: c.name,
    minAge: c.minAge,
    maxAge: c.maxAge
  }));
};
