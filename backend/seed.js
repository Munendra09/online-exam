/**
 * Database Seed / Setup Script
 *
 * - Existing tables are NOT deleted.
 * - Existing tables are NOT modified.
 * - Missing tables are created automatically.
 * - Creates the default admin account.
 */

require('dotenv').config();

const bcrypt = require('bcryptjs');
const { sequelize, User } = require('./src/models');

async function seed() {
  try {
    console.log('🔄 Checking database...');
    console.log('⚠️ Existing tables and data will NOT be deleted.\n');

    await sequelize.sync();

    console.log('✅ Database tables checked successfully!');
    console.log('✅ Missing tables (if any) were created.\n');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@exam.com';

    const existingAdmin = await User.findOne({
      where: {
        email: adminEmail,
      },
    });

    if (existingAdmin) {
      console.log('ℹ️ Admin account already exists.');
      console.log(`   Email: ${adminEmail}`);
      console.log('   No new admin account was created.\n');
    } else {
      const adminPassword = await bcrypt.hash(
        process.env.ADMIN_PASSWORD || 'Admin@12345',
        Number(process.env.BCRYPT_ROUNDS || 12)
      );

      await User.create({
        name: 'Lucky Tech Academy Admin',
        email: adminEmail,
        registrationId: 'ADMIN-LTA',
        password: adminPassword,
        role: 'ADMIN',
        isActive: true,
        emailVerified: true,
        city: 'Kasganj',
        state: 'Uttar Pradesh',
      });

      console.log('✅ Default admin account created successfully!');
      console.log('');
      console.log('📌 Admin Login Credentials:');
      console.log(`   Email:    ${adminEmail}`);
      console.log(
        `   Password: ${process.env.ADMIN_PASSWORD || 'Admin@12345'}`
      );
      console.log('');
    }

    console.log('========================================');
    console.log('✅ DATABASE SETUP COMPLETED');
    console.log('========================================');
    console.log('');
    console.log('🔹 Existing tables/data were preserved.');
    console.log('🔹 Missing tables were created.');
    console.log('🔹 Existing admin was not duplicated.');
    console.log('');

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Database setup failed:');
    console.error(err.message || err);

    await sequelize.close().catch(() => { });
    process.exit(1);
  }
}

seed();