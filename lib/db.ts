import mysql from "mysql2/promise";

function getDbConfig() {
  const host = process.env.DB_HOST || "localhost";
  const port = parseInt(process.env.DB_PORT || "3306", 10);
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "ecommerce_support";

  return { host, port, user, password, database };
}

export async function getDbConnection() {
  const config = getDbConfig();
  return mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
  });
}

export async function testConnection(): Promise<{
  ok: boolean;
  message: string;
  details?: Record<string, unknown>;
}> {
  try {
    const conn = await getDbConnection();
    const [rows] = await conn.execute("SELECT 1 as ping");
    await conn.end();

    return {
      ok: true,
      message: "Database connection successful",
      details: { ping: (rows as { ping: number }[])[0]?.ping },
    };
  } catch (err: unknown) {
    const e = err as Error;
    return {
      ok: false,
      message: e.message || "Connection failed",
      details: {
        code: (err as { code?: string })?.code,
        errno: (err as { errno?: number })?.errno,
      },
    };
  }
}
