/**
 * Simple Test - OpenRouter với pony-alpha
 */

import { AIO } from "../src/index.js";
import dotenv from "dotenv";

dotenv.config();

async function simpleTest() {
  console.log("🚀 Simple Test: OpenRouter + pony-alpha\n");

  const aio = new AIO({
    providers: [
      {
        provider: "openrouter",
        apiKeys: [
          {
            key: process.env.OPENROUTER_API_KEY || "",
            priority: 10,
          },
        ],
        models: [
          {
            modelId: "openrouter/pony-alpha",
            priority: 10,
          },
        ],
      },
    ],
    enableLogging: true,
    enableValidation: true,
    maxRetries: 3,
  });

  console.log("📊 Config:", aio.getConfigSummary());

  try {
    console.log("\n💬 Sending message...");
    const response = await aio.chatCompletion({
      provider: "openrouter",
      model: "openrouter/pony-alpha",
      messages: [
        {
          role: "user",
          content: "What is 2+2? Answer in one short sentence.",
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    console.log("\n✅ Response:");
    console.log("   Content:", response.choices[0].message.content);
    console.log("   Model:", response.model);
    console.log("   Provider:", response.provider);
    console.log("   Usage:", response.usage);

    // Check key stats
    const stats = aio.getKeyStats("openrouter");
    console.log("\n🔑 Key Statistics:");
    console.log("   Total Keys:", stats?.total);
    console.log("   Active Keys:", stats?.active);
    console.log("   Total Usage:", stats?.totalUsage);
    console.log("   Total Errors:", stats?.totalErrors);
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    if (error.statusCode) {
      console.error("   Status Code:", error.statusCode);
    }
  }
}

simpleTest().catch(console.error);
