/**
 * Example: Priority Management - Quản lý độ ưu tiên
 */

import { AIO } from "../src/index.js";

async function main() {
  const aio = new AIO({
    providers: [
      {
        provider: "groq",
        apiKeys: [
          { key: process.env.GROQ_API_KEY || "key1", priority: 100 }, // Key chính
          { key: process.env.GROQ_API_KEY_BACKUP || "key2", priority: 50 }, // Backup
        ],
        models: [
          { modelId: "openai/gpt-oss-120b", priority: 100 }, // Model ưu tiên
          { modelId: "llama-3.3-70b-versatile", priority: 50 }, // Fallback
        ],
        priority: 100, // Provider ưu tiên cao nhất
        isActive: true,
      },
      {
        provider: "cerebras",
        apiKeys: [
          { key: process.env.CEREBRAS_API_KEY || "key", priority: 100 },
        ],
        models: [{ modelId: "zai-glm-4.7", priority: 100 }],
        priority: 80, // Fallback provider
        isActive: true,
      },
    ],
    autoMode: true,
  });

  console.log("🚀 AIO Framework - Priority Management Example\n");

  console.log("📊 Priority Order:");
  console.log("1. Groq (priority: 100)");
  console.log("   - openai/gpt-oss-120b (priority: 100)");
  console.log("   - llama-3.3-70b-versatile (priority: 50)");
  console.log("   Keys: primary (100) → backup (50)");
  console.log("\n2. Cerebras (priority: 80)");
  console.log("   - zai-glm-4.7 (priority: 100)");

  console.log("\n📤 Sending request with auto fallback...\n");

  const response = await aio.chatCompletion({
    messages: [{ role: "user", content: "What is 2+2?" }],
    max_tokens: 50,
  });

  console.log("✅ Response:");
  console.log(`Provider: ${response.provider}`);
  console.log(`Model: ${response.model}`);
  console.log(`Content: ${response.choices[0].message.content}`);

  if (response.auto_fallback) {
    console.log("\n⚠️ Fallback Info:");
    console.log(`Fallback count: ${response.auto_fallback.fallback_count}`);
    console.log(
      `Original: ${response.auto_fallback.original_provider}:${response.auto_fallback.original_model}`
    );
    console.log(
      `Final: ${response.auto_fallback.final_provider}:${response.auto_fallback.final_model}`
    );
  }
}

main().catch(console.error);
