#!/usr/bin/env node

/**
 * Script thêm Google AI provider và models
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:4000";

const googleModels = [
  {
    model_id: "gemini-2.5-flash-lite",
    display_name: "Gemini 2.5 Flash Lite",
    context_length: 1048576, // 1M tokens
  },
  {
    model_id: "gemini-2.5-flash",
    display_name: "Gemini 2.5 Flash",
    context_length: 1048576,
  },
  {
    model_id: "gemini-3-flash",
    display_name: "Gemini 3 Flash",
    context_length: 1048576,
  },
  {
    model_id: "gemini-robotics-er-1.5-preview",
    display_name: "Gemini Robotics ER 1.5 Preview",
    context_length: 1048576,
  },
  {
    model_id: "gemma-3-1b",
    display_name: "Gemma 3 1B (IT)",
    context_length: 32768,
  },
  {
    model_id: "gemma-3-4b",
    display_name: "Gemma 3 4B (IT)",
    context_length: 131072,
  },
  {
    model_id: "gemma-3-12b",
    display_name: "Gemma 3 12B (IT)",
    context_length: 131072,
  },
  {
    model_id: "gemma-3-27b",
    display_name: "Gemma 3 27B (IT)",
    context_length: 131072,
  },
  {
    model_id: "shield-gemma-2",
    display_name: "Shield Gemma 2",
    context_length: 8192,
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
  console.log("📡 Creating Google AI provider...");
  const response = await fetch(`${BASE_URL}/providers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: "google-ai",
      display_name: "Google AI",
      base_url: "https://generativelanguage.googleapis.com/v1beta",
      is_active: true,
      priority: 2,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    console.log(`✓ Google AI provider created (ID: ${data.data.id})\n`);
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
  const googleAi = data.data.find((p) => p.name === "google-ai");
  return googleAi?.id;
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
  console.log("🚀 Adding Google AI Models...\n");

  try {
    // Get token
    console.log("🔑 Logging in...");
    const token = await getToken();

    // Check if provider exists, if not create it
    let providerId = await getProviderId(token);

    if (!providerId) {
      providerId = await createProvider(token);
    } else {
      console.log(`✓ Google AI provider already exists (ID: ${providerId})\n`);
    }

    console.log(`📦 Adding ${googleModels.length} models...\n`);

    let added = 0;
    let failed = 0;

    for (const model of googleModels) {
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
