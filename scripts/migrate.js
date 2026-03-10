/**
 * Run database migrations (adds missing columns/tables).
 * Loads .env.local from project root. Run: node scripts/migrate.js
 */
const fs = require("fs");
const path = require("path");

const localPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(localPath)) {
  fs.readFileSync(localPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
      }
    });
}

const mysql = require("mysql2/promise");

async function hasColumn(conn, table, column) {
  const [[db]] = await conn.execute("SELECT DATABASE() AS db");
  const schema = (db && (db).db) || process.env.DB_NAME || "ecommerce_support";
  const [rows] = await conn.execute(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?",
    [schema, table, column]
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function run() {
  const url = process.env.MYSQL_URL || process.env.DATABASE_URL;
  let conn;
  if (url) {
    console.log("Connecting via MYSQL_URL...");
    conn = await mysql.createConnection(url);
  } else {
    const host = process.env.DB_HOST || "localhost";
    const port = parseInt(process.env.DB_PORT || "3306", 10);
    const user = process.env.DB_USER || "root";
    const password = process.env.DB_PASSWORD || "";
    const database = process.env.DB_NAME || "ecommerce_support";
    console.log("Connecting to MySQL...");
    conn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
    });
  }

  const [[dbRow]] = await conn.execute("SELECT DATABASE() AS db");
  const database = (dbRow && dbRow.db) || process.env.DB_NAME || "ecommerce_support";

  try {
    // 002: forward_email on users
    if (!(await hasColumn(conn, "users", "forward_email"))) {
      console.log("Adding users.forward_email...");
      await conn.execute("ALTER TABLE users ADD COLUMN forward_email VARCHAR(255) DEFAULT NULL");
      console.log("  OK");
    } else {
      console.log("users.forward_email already exists, skip.");
    }

    // 004: limit-reached tracking for upgrade emails
    if (!(await hasColumn(conn, "users", "limit_reached_period"))) {
      console.log("Adding users.limit_reached_period...");
      await conn.execute("ALTER TABLE users ADD COLUMN limit_reached_period CHAR(7) DEFAULT NULL COMMENT 'YYYY-MM when limit-reached email was sent'");
      console.log("  OK");
    } else {
      console.log("users.limit_reached_period already exists, skip.");
    }
    if (!(await hasColumn(conn, "users", "last_upgrade_reminder_at"))) {
      console.log("Adding users.last_upgrade_reminder_at...");
      await conn.execute("ALTER TABLE users ADD COLUMN last_upgrade_reminder_at TIMESTAMP NULL DEFAULT NULL");
      console.log("  OK");
    } else {
      console.log("users.last_upgrade_reminder_at already exists, skip.");
    }

    // 006: Stripe customer and subscription IDs (for Pro recurring billing)
    if (!(await hasColumn(conn, "users", "stripe_customer_id"))) {
      console.log("Adding users.stripe_customer_id...");
      await conn.execute("ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255) DEFAULT NULL");
      console.log("  OK");
    } else {
      console.log("users.stripe_customer_id already exists, skip.");
    }
    if (!(await hasColumn(conn, "users", "stripe_subscription_id"))) {
      console.log("Adding users.stripe_subscription_id...");
      await conn.execute("ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR(255) DEFAULT NULL");
      console.log("  OK");
    } else {
      console.log("users.stripe_subscription_id already exists, skip.");
    }

    // 005: plan enum add 'custom' (free | pro | custom)
    const [planColRows] = await conn.execute(
      "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'plan'",
      [database]
    );
    const planRow = Array.isArray(planColRows) && planColRows[0] ? planColRows[0] : null;
    const planType = planRow ? String(planRow.COLUMN_TYPE || planRow.column_type || "").toLowerCase() : "";
    if (planType && planType.indexOf("custom") === -1) {
      console.log("Adding 'custom' to users.plan enum...");
      await conn.execute("ALTER TABLE users MODIFY COLUMN plan ENUM('free','pro','custom') DEFAULT 'free'");
      console.log("  OK");
    } else {
      console.log("users.plan already has 'custom', skip.");
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

    // chatbots.guard_rails (AI guard rails per chatbot)
    if (!(await hasColumn(conn, "chatbots", "guard_rails"))) {
      console.log("Adding chatbots.guard_rails...");
      await conn.execute("ALTER TABLE chatbots ADD COLUMN guard_rails TEXT DEFAULT NULL");
      console.log("  OK");
    } else {
      console.log("chatbots.guard_rails already exists, skip.");
    }

    // chatbots.uploaded_docs_text (PDF/TXT content for chat context)
    if (!(await hasColumn(conn, "chatbots", "uploaded_docs_text"))) {
      console.log("Adding chatbots.uploaded_docs_text...");
      await conn.execute("ALTER TABLE chatbots ADD COLUMN uploaded_docs_text LONGTEXT DEFAULT NULL");
      console.log("  OK");
    } else {
      console.log("chatbots.uploaded_docs_text already exists, skip.");
    }

    // chatbots.language (response language for the chatbot)
    if (!(await hasColumn(conn, "chatbots", "language"))) {
      console.log("Adding chatbots.language...");
      await conn.execute("ALTER TABLE chatbots ADD COLUMN language VARCHAR(20) DEFAULT 'en'");
      console.log("  OK");
    } else {
      console.log("chatbots.language already exists, skip.");
    }

    // conversation_usage (per-user per-month count for limits)
    const [cuTables] = await conn.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'conversation_usage'",
      [database]
    );
    if (!Array.isArray(cuTables) || cuTables.length === 0) {
      console.log("Creating conversation_usage...");
      await conn.execute(`
        CREATE TABLE conversation_usage (
          id              CHAR(36) PRIMARY KEY,
          user_id         CHAR(36) NOT NULL,
          period_month    CHAR(7) NOT NULL,
          count_used      INT DEFAULT 0,
          created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uk_usage_user_period (user_id, period_month),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_usage_user (user_id)
        )
      `);
      console.log("  OK");
    } else {
      console.log("conversation_usage already exists, skip.");
    }

    // 003: user_external_endpoints (per-user API endpoints for their DB)
    const [uepTables] = await conn.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'user_external_endpoints'",
      [database]
    );
    if (!Array.isArray(uepTables) || uepTables.length === 0) {
      console.log("Creating user_external_endpoints...");
      await conn.execute(`
        CREATE TABLE user_external_endpoints (
          id              CHAR(36) PRIMARY KEY,
          user_id         CHAR(36) NOT NULL,
          chatbot_id      CHAR(36) DEFAULT NULL,
          name            VARCHAR(100) NOT NULL,
          base_url        VARCHAR(500) NOT NULL,
          auth_type       ENUM('none', 'bearer', 'api_key_header', 'basic') DEFAULT 'none',
          auth_value      VARCHAR(500) DEFAULT NULL,
          method_default  VARCHAR(10) DEFAULT 'GET',
          is_active       TINYINT(1) DEFAULT 1,
          created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_uep_user (user_id),
          INDEX idx_uep_chatbot (chatbot_id)
        )
      `);
      console.log("  OK");
    } else {
      console.log("user_external_endpoints already exists, skip.");
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
