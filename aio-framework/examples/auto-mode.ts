/**
 * Example: Auto Mode - Tự động chọn provider/model và fallback
 */

import { AIO } from "../src/index.js";

async function main() {
  // Khởi tạo AIO với auto mode
  const aio = new AIO({
    providers: [
      {
        provider: "groq",
        apiKeys: [
          {
            key: process.env.GROQ_API_KEY || "your-groq-key-here",
            priority: 10,
          },
        ],
        models: [{ modelId: "openai/gpt-oss-120b", priority: 10 }],
        priority: 100, // Groq ưu tiên cao nhất
      },
      {
        provider: "google-ai",
        apiKeys: [
          {
            key: process.env.GOOGLE_AI_API_KEY || "your-google-key-here",
          },
        ],
        models: [{ modelId: "gemini-3-flash-preview" }],
        priority: 80, // Gemini fallback
      },
    ],
    autoMode: true, // Bật auto mode
  });

  console.log("🚀 AIO Framework - Auto Mode Example\n");

  // Không cần chỉ định provider/model
  // AIO sẽ tự động chọn theo priority và fallback nếu fail
  console.log("📤 Sending request (auto mode)...");
  const response = await aio.chatCompletion({
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Explain quantum computing in simple terms." },
    ],
    temperature: 0.7,
    max_tokens: 200,
  });

  console.log("\n✅ Response:");
  console.log(`Provider: ${response.provider}`);
  console.log(`Model: ${response.model}`);
  console.log(`Content: ${response.choices[0].message.content}`);

  if (response.auto_fallback) {
    console.log("\n⚠️ Fallback occurred:");
    console.log(
      `Original: ${response.auto_fallback.original_provider}:${response.auto_fallback.original_model}`
    );
    console.log(
      `Final: ${response.auto_fallback.final_provider}:${response.auto_fallback.final_model}`
    );
    console.log(`Fallback count: ${response.auto_fallback.fallback_count}`);
  }
}

main().catch(console.error);
