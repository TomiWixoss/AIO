/**
 * Test Nvidia API directly with fetch
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const apiKey = process.env.NVIDIA_API_KEY;

console.log("🔑 API Key:", apiKey ? `${apiKey.substring(0, 20)}...` : "❌ Missing");

const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";

const payload = {
  model: "moonshotai/kimi-k2.5",
  messages: [
    {
      role: "user",
      content: "Say hello in 3 words",
    },
  ],
  max_tokens: 50,
  temperature: 0.7,
  stream: false,
};

console.log("\n📤 Sending request to Nvidia API...");
console.log("URL:", invokeUrl);
console.log("Model:", payload.model);

fetch(invokeUrl, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: JSON.stringify(payload),
})
  .then(async (response) => {
    console.log("\n📥 Response status:", response.status);
    const data = await response.json();
    
    if (!response.ok) {
      console.error("❌ Error response:");
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }
    
    console.log("\n✅ Success!");
    console.log("Response:", JSON.stringify(data, null, 2));
  })
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
