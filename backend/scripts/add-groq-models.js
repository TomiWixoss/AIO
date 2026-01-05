#!/usr/bin/env node

/**
 * Script thêm Groq provider và models
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:4000";

const groqModels = [
  {
    model_id: "llama-3.1-8b-instant",
    display_name: "Llama 3.1 8B Instant",
    context_length: 131072,
  },
  {
    model_id: "llama-3.3-70b-versatile",
    display_name: "Llama 3.3 70B Versatile",
    context_length: 131072,
  },
  {
    model_id: "meta-llama/llama-guard-4-12b",
    display_name: "Llama Guard 4 12B",
    context_length: 131072,
  },
  {
    model_id: "openai/gpt-oss-120b",
    display_name: "GPT OSS 120B",
    context_length: 131072,
  },
  {
    model_id: "openai/gpt-oss-20b",
    display_name: "GPT OSS 20B",
    context_length: 131072,
  },
  {
    model_id: "meta-llama/llama-4-maverick-17b-128e-instruct",
    display_name: "Llama 4 Maverick 17B 128E",
    context_length: 131072,
  },
  {
    model_id: "meta-llama/llama-4-scout-17b-16e-instruct",
    display_name: "Llama 4 Scout 17B 16E",
    context_length: 131072,
  },
  {
    model_id: "meta-llama/llama-prompt-guard-2-22m",
    display_name: "Llama Prompt Guard 2 22M",
    context_length: 512,
  },
  {
    model_id: "meta-llama/llama-prompt-guard-2-86m",
    display_name: "Prompt Guard 2 86M",
    context_length: 512,
  },
  {
    model_id: "moonshotai/kimi-k2-instruct-0905",
    display_name: "Kimi K2 0905",
    context_length: 262144,
  },
  {
    model_id: "openai/gpt-oss-safeguard-20b",
    display_name: "Safety GPT OSS 20B",
    context_length: 131072,
  },
  {
    model_id: "qwen/qwen3-32b",
    display_name: "Qwen3-32B",
    context_length: 131072,
  },
  {
    model_id: "groq/compound",
    display_name: "Compound",
    context_length: 131072,
  },
  {
    model_id: "groq/compound-mini",
    display_name: "Compound Mini",
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
  console.log("📡 Creating Groq provider...");
  const response = await fetch(`${BASE_URL}/providers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: "groq",
      display_name: "Groq",
      base_url: "https://api.groq.com/openai/v1",
      is_active: true,
      priority: 3,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    console.log(`✓ Groq provider created (ID: ${data.data.id})\n`);
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
  const groq = data.data.find((p) => p.name === "groq");
  return groq?.id;
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
  console.log("🚀 Adding Groq Models...\n");

  try {
    // Get token
    console.log("🔑 Logging in...");
    const token = await getToken();

    // Check if provider exists, if not create it
    let providerId = await getProviderId(token);

    if (!providerId) {
      providerId = await createProvider(token);
    } else {
      console.log(`✓ Groq provider already exists (ID: ${providerId})\n`);
    }

    console.log(`📦 Adding ${groqModels.length} models...\n`);

    let added = 0;
    let failed = 0;

    for (const model of groqModels) {
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
