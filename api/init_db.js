const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const initDB = async () => {
  console.log('Connecting to default postgres database...');
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'postgres',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    await client.connect();
    
    // Check if line_manager_db exists
    const res = await client.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = $1`, [process.env.DB_NAME]);
    
    if (res.rowCount === 0) {
      console.log(`Database ${process.env.DB_NAME} not found, creating it...`);
      await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log('Database created successfully.');
    } else {
      console.log(`Database ${process.env.DB_NAME} already exists.`);
    }
  } catch (err) {
    console.error('Error connecting to or creating database:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }

  console.log(`Connecting to ${process.env.DB_NAME} to run schema...`);
  const dbClient = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    await dbClient.connect();
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Executing schema.sql...');
    await dbClient.query(schema);
    console.log('Schema executed successfully. Default users inserted.');
  } catch (err) {
    console.error('Error executing schema:', err.message);
  } finally {
    await dbClient.end();
  }
};

initDB();
