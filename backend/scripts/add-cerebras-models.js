#!/usr/bin/env node

/**
 * Script thêm Cerebras provider và models
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:4000";

const cerebrasModels = [
  // Production Models
  {
    model_id: "llama3.1-8b",
    display_name: "Llama 3.1 8B",
    context_length: 131072,
  },
  {
    model_id: "llama-3.3-70b",
    display_name: "Llama 3.3 70B",
    context_length: 131072,
  },
  {
    model_id: "gpt-oss-120b",
    display_name: "OpenAI GPT OSS 120B",
    context_length: 131072,
  },
  {
    model_id: "qwen-3-32b",
    display_name: "Qwen 3 32B",
    context_length: 131072,
  },
  // Preview Models
  {
    model_id: "qwen-3-235b-a22b-instruct-2507",
    display_name: "Qwen 3 235B Instruct",
    context_length: 131072,
  },
  {
    model_id: "zai-glm-4.6",
    display_name: "Z.ai GLM 4.6",
    context_length: 131072,
  },
];

async function getToken() {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@localhost",
      password: "admin123",
    }),
  });
  const data = await response.json();
  return data.data.token;
}

async function createProvider(token) {
  console.log("📡 Creating Cerebras provider...");
  const response = await fetch(`${BASE_URL}/providers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: "cerebras",
      display_name: "Cerebras",
      base_url: "https://api.cerebras.ai/v1",
      is_active: true,
      priority: 4,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    console.log(`✓ Cerebras provider created (ID: ${data.data.id})\n`);
    return data.data.id;
  } else {
    const error = await response.json();
    throw new Error(error.error || "Failed to create provider");
  }
}

async function getProviderId(token) {
  const response = await fetch(`${BASE_URL}/providers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  const cerebras = data.data.find((p) => p.name === "cerebras");
  return cerebras?.id;
}

async function addModel(token, providerId, model) {
  try {
    const response = await fetch(`${BASE_URL}/models`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        provider_id: providerId,
        model_id: model.model_id,
        display_name: model.display_name,
        context_length: model.context_length,
        is_fallback: false,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✓ Added: ${model.display_name} (ID: ${data.data.id})`);
      return true;
    } else {
      const error = await response.json();
      console.log(
        `✗ Failed: ${model.display_name} - ${error.error || "Unknown error"}`
      );
      return false;
    }
  } catch (error) {
    console.log(`✗ Error: ${model.display_name} - ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("🚀 Adding Cerebras Models...\n");

  try {
    // Get token
    console.log("🔑 Logging in...");
    const token = await getToken();

    // Check if provider exists, if not create it
    let providerId = await getProviderId(token);

    if (!providerId) {
      providerId = await createProvider(token);
    } else {
      console.log(`✓ Cerebras provider already exists (ID: ${providerId})\n`);
    }

    console.log(`📦 Adding ${cerebrasModels.length} models...\n`);

    let added = 0;
    let failed = 0;

    for (const model of cerebrasModels) {
      const success = await addModel(token, providerId, model);
      if (success) {
        added++;
      } else {
        failed++;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log("\n" + "=".repeat(60));
    console.log(`✅ Summary: ${added} added, ${failed} failed`);
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
  }
}

main();
