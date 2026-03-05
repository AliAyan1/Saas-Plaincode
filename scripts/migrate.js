/**
 * Run database migrations (adds missing columns/tables).
 * Loads .env.local from project root. Run: node scripts/migrate.js
 */
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        process.env[match[1].trim()] = match[2].trim();
      }
    });
}

const mysql = require("mysql2/promise");

async function hasColumn(conn, table, column) {
  const [rows] = await conn.execute(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?",
    [process.env.DB_NAME || "ecommerce_support", table, column]
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function run() {
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
  });

  try {
    // 002: forward_email on users
    if (!(await hasColumn(conn, "users", "forward_email"))) {
      console.log("Adding users.forward_email...");
      await conn.execute("ALTER TABLE users ADD COLUMN forward_email VARCHAR(255) DEFAULT NULL");
      console.log("  OK");
    } else {
      console.log("users.forward_email already exists, skip.");
    }

    // 002: forwarded_conversations table
    const [tables] = await conn.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'forwarded_conversations'",
      [database]
    );
    if (!Array.isArray(tables) || tables.length === 0) {
      console.log("Creating forwarded_conversations...");
      await conn.execute(`
        CREATE TABLE forwarded_conversations (
          id              CHAR(36) PRIMARY KEY,
          user_id         CHAR(36) NOT NULL,
          conversation_id CHAR(36) NOT NULL,
          customer        VARCHAR(255) DEFAULT NULL,
          customer_email  VARCHAR(255) DEFAULT NULL,
          preview         TEXT DEFAULT NULL,
          forwarded_as    ENUM('email', 'ticket') NOT NULL DEFAULT 'email',
          ticket_ref      VARCHAR(100) DEFAULT NULL,
          reply_text      TEXT DEFAULT NULL,
          replied_at      TIMESTAMP NULL DEFAULT NULL,
          created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_forwarded_user (user_id),
          INDEX idx_forwarded_created (created_at),
          INDEX idx_forwarded_conversation (conversation_id)
        )
      `);
      console.log("  OK");
    } else {
      if (!(await hasColumn(conn, "forwarded_conversations", "reply_text"))) {
        console.log("Adding forwarded_conversations.reply_text...");
        await conn.execute("ALTER TABLE forwarded_conversations ADD COLUMN reply_text TEXT DEFAULT NULL");
        console.log("  OK");
      }
      if (!(await hasColumn(conn, "forwarded_conversations", "replied_at"))) {
        console.log("Adding forwarded_conversations.replied_at...");
        await conn.execute("ALTER TABLE forwarded_conversations ADD COLUMN replied_at TIMESTAMP NULL DEFAULT NULL");
        console.log("  OK");
      }
      if (!(await hasColumn(conn, "forwarded_conversations", "customer_email"))) {
        console.log("Adding forwarded_conversations.customer_email...");
        await conn.execute("ALTER TABLE forwarded_conversations ADD COLUMN customer_email VARCHAR(255) DEFAULT NULL");
        console.log("  OK");
      }
    }

    // tickets table (for all plans)
    const [ticketTables] = await conn.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tickets'",
      [database]
    );
    if (!Array.isArray(ticketTables) || ticketTables.length === 0) {
      console.log("Creating tickets table...");
      await conn.execute(`
        CREATE TABLE tickets (
          id              CHAR(36) PRIMARY KEY,
          user_id         CHAR(36) NOT NULL,
          conversation_id CHAR(36) DEFAULT NULL,
          ticket_ref      VARCHAR(50) NOT NULL,
          type            ENUM('ai_resolved', 'forwarded_email', 'forwarded_human', 'database_check', 'escalated', 'other') NOT NULL,
          customer        VARCHAR(255) DEFAULT NULL,
          query_preview   TEXT DEFAULT NULL,
          outcome         TEXT DEFAULT NULL,
          status          ENUM('open', 'resolved', 'in_progress') DEFAULT 'open',
          created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uk_ticket_ref (ticket_ref),
          INDEX idx_tickets_user (user_id),
          INDEX idx_tickets_conversation (conversation_id),
          INDEX idx_tickets_created (created_at)
        )
      `);
      console.log("  OK");
    }

    console.log("\nMigrations finished.");
  } finally {
    await conn.end();
  }
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
