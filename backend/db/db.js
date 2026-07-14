const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
});

pool.connect()
  .then((client) => {
    client.release();
    console.log('Database connected');
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
  });
module.exports = pool;
