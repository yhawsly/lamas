import * as dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function inspectColumns() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Course';
    `);
    console.log("📊 Course Table Columns in DB:");
    console.log(res.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

inspectColumns().catch(console.error);
