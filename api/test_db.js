const { Pool } = require('pg');
require('dotenv').config({ path: 'C:/Users/lenovo/Desktop/line-manager/server/.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.query('SELECT * FROM reports', (err, res) => {
  if (err) {
    console.error('DATABASE ERROR:', err.message);
  } else {
    console.log(`Reports in database: ${res.rows.length}`);
    console.log(res.rows);
  }
  process.exit();
});
