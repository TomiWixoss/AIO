import mysql from "mysql2/promise";

async function fixToolUrls() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "LlmGateway2026!Secure",
    database: process.env.DB_NAME || "llm_gateway",
  });

  try {
    console.log("🔧 Fixing tool URLs from 'backend' to 'llm-backend'...\n");

    // Update all tools with backend URL
    const [result] = await connection.execute(
      `UPDATE tools 
       SET endpoint_url = REPLACE(endpoint_url, 'http://backend:', 'http://llm-backend:')
       WHERE endpoint_url LIKE 'http://backend:%'`
    );

    console.log(`✅ Updated ${result.affectedRows} tools\n`);

    // Show updated tools
    const [tools] = await connection.execute(
      "SELECT id, name, endpoint_url FROM tools ORDER BY id"
    );

    console.log("📋 Current tools:");
    console.table(tools);

    console.log("\n✨ Done!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

fixToolUrls();
