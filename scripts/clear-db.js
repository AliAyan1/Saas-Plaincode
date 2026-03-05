/**
 * Clear all data from MySQL. Cross-platform (Windows, Mac, Linux).
 * Run: node scripts/clear-db.js
 * Or: npm run db:clear
 */
const fs = require("fs");
const path = require("path");

// Load .env.local
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) process.env[match[1].trim()] = match[2].trim();
    });
}

const mysql = require("mysql2/promise");

async function clear() {
  const host = process.env.DB_HOST || "localhost";
  const port = parseInt(process.env.DB_PORT || "3306", 10);
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "ecommerce_support";

  console.log("Connecting to MySQL...");
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true,
  });

  const sqlPath = path.join(__dirname, "..", "database", "clear.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  await conn.query(sql);
  await conn.end();

  console.log("Database cleared successfully.");
}

clear().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
