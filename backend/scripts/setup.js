#!/usr/bin/env node

/**
 * Script setup: tạo admin và provider OpenRouter
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:4000";

async function createAdmin() {
  console.log("👤 Creating admin...");
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@localhost",
      password: "admin123",
      name: "Admin",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create admin");
  }

  const data = await response.json();
  console.log("✓ Admin created: admin@localhost / admin123");
  return data.data.token;
}

async function createProvider(token) {
  console.log("\n📡 Creating OpenRouter provider...");
  const response = await fetch(`${BASE_URL}/providers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: "openrouter",
      display_name: "OpenRouter",
      base_url: "https://openrouter.ai/api/v1",
      is_active: true,
      priority: 1,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create provider");
  }

  const data = await response.json();
  console.log(`✓ OpenRouter provider created (ID: ${data.data.id})`);
}

async function main() {
  console.log("🚀 Setup Initial Data\n");

  try {
    const token = await createAdmin();
    await createProvider(token);
    console.log("\n✅ Setup completed!");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

main();
