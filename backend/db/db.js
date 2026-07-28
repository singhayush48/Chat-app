const { Pool } = require("pg");
require("dotenv").config();

const isProduction = process.env.DATABASE_URL;

const pool = new Pool(
    isProduction
        ? {
              connectionString: process.env.DATABASE_URL,
              ssl: {
                  rejectUnauthorized: false,
              },
          }
        : {
              user: process.env.DB_USER,
              password: process.env.DB_PASSWORD,
              host: process.env.DB_HOST,
              port: process.env.DB_PORT,
              database: process.env.DB_NAME,
          }
);

pool.connect()
    .then((client) => {
        console.log("✅ Database connected");
        client.release();
    })
    .catch((err) => {
        console.error("❌ Database connection failed:", err.message);
    });

module.exports = pool;



