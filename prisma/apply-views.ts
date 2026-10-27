import "dotenv/config";
import fs from "fs";
import path from "path";
import { Pool } from "pg";

async function applyViews() {
  const sqlPath = path.join(process.cwd(), "prisma", "views.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log("Applying views from prisma/views.sql...");
    await client.query(sql);
    console.log("View 'AvailableProduct' successfully updated in PostgreSQL!");

    const result = await client.query('SELECT * FROM "AvailableProduct" LIMIT 1;');
    console.log("Sample record from AvailableProduct view:", result.rows[0] || "No records yet");
  } finally {
    client.release();
    await pool.end();
  }
}

applyViews().catch((err) => {
  console.error("Error applying views:", err);
  process.exit(1);
});