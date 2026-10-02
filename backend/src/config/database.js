const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,

    /* Connection pool — critical for 1000-1500 concurrent users */
    pool: {
      max: 50,        // max connections in pool
      min: 2,         // keep 2 alive always
      acquire: 30000, // max ms to wait for connection
      idle: 10000,    // ms before releasing idle connection
    },

    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
    },
  }
);

module.exports = sequelize;
