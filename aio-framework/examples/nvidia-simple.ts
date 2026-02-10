/**
 * Nvidia Provider - Simple Test
 */

import { AIO } from "../src/index.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

async function main() {
  console.log("🚀 Testing Nvidia Kimi K2.5...\n");
  console.log("API Key:", process.env.NVIDIA_API_KEY ? "✅ Loaded" : "❌ Missing");

  const aio = new AIO({
    providers: [
      {
        provider: "nvidia",
        apiKeys: [{ key: process.env.NVIDIA_API_KEY || "" }],
        models: [{ modelId: "moonshotai/kimi-k2.5" }],
      },
    ],
  });

  console.log("\n📤 Sending request...");
  
  const response = await aio.chatCompletion({
    provider: "nvidia",
    model: "moonshotai/kimi-k2.5",
    messages: [
      { role: "user", content: "Say hello in 5 words" },
    ],
    temperature: 0.7,
    max_tokens: 50,
  });

  console.log("\n✅ Response:");
  console.log(`Provider: ${response.provider}`);
  console.log(`Model: ${response.model}`);
  console.log(`Content: ${response.choices[0].message.content}`);
  console.log(`Tokens: ${response.usage.total_tokens}`);
}

main().catch((error) => {
  console.error("\n❌ Error:", error.message);
  if (error.cause) {
    console.error("Cause:", error.cause);
  }
  process.exit(1);
});
