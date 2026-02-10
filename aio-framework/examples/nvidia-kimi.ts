/**
 * Nvidia Provider Example - Kimi K2.5
 * Free model from Nvidia: moonshotai/kimi-k2.5
 */

import { AIO } from "../src/index.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const aio = new AIO({
  providers: [
    {
      provider: "nvidia",
      apiKeys: [{ key: process.env.NVIDIA_API_KEY || "" }],
      models: [{ modelId: "moonshotai/kimi-k2.5" }],
    },
  ],
});

async function testNvidiaKimi() {
  console.log("🚀 Testing Nvidia Kimi K2.5...\n");

  try {
    // Test 1: Simple chat
    console.log("📝 Test 1: Simple chat");
    const response = await aio.chatCompletion({
      provider: "nvidia",
      model: "moonshotai/kimi-k2.5",
      messages: [
        {
          role: "user",
          content: "Explain quantum computing in simple terms.",
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    console.log("Response:", response.choices[0].message.content);
    console.log("Usage:", response.usage);
    console.log("\n" + "=".repeat(80) + "\n");

    // Test 2: Streaming
    console.log("📝 Test 2: Streaming chat");
    const stream = await aio.chatCompletionStream({
      provider: "nvidia",
      model: "moonshotai/kimi-k2.5",
      messages: [
        {
          role: "user",
          content: "Write a haiku about AI.",
        },
      ],
      temperature: 0.8,
    });

    process.stdout.write("Streaming: ");
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        process.stdout.write(content);
      }
    }
    console.log("\n\n" + "=".repeat(80) + "\n");

    // Test 3: JSON mode
    console.log("📝 Test 3: JSON response format");
    const jsonResponse = await aio.chatCompletion({
      provider: "nvidia",
      model: "moonshotai/kimi-k2.5",
      messages: [
        {
          role: "user",
          content: "Generate a JSON object with 3 programming languages and their use cases.",
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    console.log("JSON Response:", jsonResponse.choices[0].message.content);
    console.log("\n✅ All tests passed!");
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.statusCode) {
      console.error("Status Code:", error.statusCode);
    }
  }
}

testNvidiaKimi();
