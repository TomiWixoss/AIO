/**
 * Example: Basic Usage - Chỉ định cụ thể provider và model
 */

import { AIO } from "../src/index.js";

// Load environment variables (you need to install dotenv: npm install dotenv)
// import dotenv from "dotenv";
// dotenv.config();

async function main() {
  // Khởi tạo AIO với OpenRouter
  const aio = new AIO({
    providers: [
      {
        provider: "openrouter",
        apiKeys: [
          {
            key: process.env.OPENROUTER_API_KEY || "your-key-here",
            priority: 10,
          },
        ],
        models: [{ modelId: "openrouter/pony-alpha", priority: 10 }],
        priority: 10,
      },
    ],
    autoMode: false, // Chế độ chỉ định cụ thể
  });

  console.log("🚀 AIO Framework - Basic Example\n");

  // Chat với OpenRouter
  console.log("📤 Sending request to OpenRouter...");
  const response = await aio.chatCompletion({
    provider: "openrouter",
    model: "openrouter/pony-alpha",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "What is the capital of Vietnam?" },
    ],
    temperature: 0.7,
    max_tokens: 100,
  });

  console.log("\n✅ Response:");
  console.log(`Provider: ${response.provider}`);
  console.log(`Model: ${response.model}`);
  console.log(`💬 Content: ${response.choices[0].message.content}`);
  console.log(`📊 Tokens: ${response.usage.total_tokens}`);
}

main().catch(console.error);
