const mysql = require('mysql2/promise');
const loadEnv = require('./loadEnv');
loadEnv();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'clinique_mada',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  connectTimeout: 10000
};

const pool = mysql.createPool(dbConfig);

// Test de connexion
pool.getConnection()
  .then(conn => {
    console.log('✅ Connexion MySQL établie', { host: dbConfig.host, port: dbConfig.port });
    conn.release();
  })
  .catch(err => {
    console.error('❌ Erreur connexion MySQL:', err.message, { host: dbConfig.host, port: dbConfig.port });
  });

module.exports = pool;