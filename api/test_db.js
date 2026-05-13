const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
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
