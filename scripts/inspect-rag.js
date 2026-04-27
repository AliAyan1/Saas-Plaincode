/* eslint-disable no-console */
const mysql = require("mysql2/promise");
require("dotenv").config({ path: ".env.local" });

async function main() {
  const url = process.env.MYSQL_URL || process.env.DATABASE_URL;
  const conn = url
    ? await mysql.createConnection(url)
    : await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || "3306"),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      });

  const [bots] = await conn.execute(
    "SELECT id, website_url AS websiteUrl, website_title AS websiteTitle, created_at AS createdAt FROM chatbots ORDER BY created_at DESC LIMIT 10"
  );
  console.log("chatbots (latest 10):");
  console.table(bots);

  const ids = (bots || []).map((b) => b.id).filter(Boolean);
  if (ids.length > 0) {
    const [docCounts] = await conn.execute(
      `SELECT chatbot_id AS chatbotId, COUNT(*) AS docCount
       FROM chatbot_documents
       WHERE chatbot_id IN (${ids.map(() => "?").join(",")})
       GROUP BY chatbot_id`,
      ids
    );
    const [chunkCounts] = await conn.execute(
      `SELECT chatbot_id AS chatbotId, COUNT(*) AS chunkCount
       FROM chatbot_knowledge_chunks
       WHERE chatbot_id IN (${ids.map(() => "?").join(",")})
       GROUP BY chatbot_id`,
      ids
    );
    const [lens] = await conn.execute(
      `SELECT id AS chatbotId,
              LENGTH(COALESCE(website_content,'')) AS websiteChars,
              LENGTH(COALESCE(products_json,'')) AS productsChars,
              LENGTH(COALESCE(uploaded_docs_text,'')) AS legacyDocsChars
       FROM chatbots
       WHERE id IN (${ids.map(() => "?").join(",")})`,
      ids
    );
    const docMap = new Map(docCounts.map((r) => [r.chatbotId, Number(r.docCount || 0)]));
    const chunkMap = new Map(chunkCounts.map((r) => [r.chatbotId, Number(r.chunkCount || 0)]));
    const merged = lens.map((r) => ({
      chatbotId: r.chatbotId,
      websiteChars: Number(r.websiteChars || 0),
      productsChars: Number(r.productsChars || 0),
      legacyDocsChars: Number(r.legacyDocsChars || 0),
      docCount: docMap.get(r.chatbotId) ?? 0,
      chunkCount: chunkMap.get(r.chatbotId) ?? 0,
    }));
    console.log("content + docs + chunk summary (latest 10):");
    console.table(merged);
  }

  const [hasChunks] = await conn.execute("SHOW TABLES LIKE 'chatbot_knowledge_chunks'");
  console.log("has chatbot_knowledge_chunks:", hasChunks.length > 0);

  if (hasChunks.length > 0) {
    const [counts] = await conn.execute(
      "SELECT chatbot_id AS chatbotId, COUNT(*) AS chunkCount FROM chatbot_knowledge_chunks GROUP BY chatbot_id ORDER BY chunkCount DESC LIMIT 20"
    );
    console.log("knowledge chunk counts:");
    console.table(counts);
  }

  const [hasDocs] = await conn.execute("SHOW TABLES LIKE 'chatbot_documents'");
  console.log("has chatbot_documents:", hasDocs.length > 0);

  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

