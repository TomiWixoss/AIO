/**
 * Test Free Models từ OpenRouter
 * Test với các models free tier
 */

import { AIO } from "../src/index.js";
import dotenv from "dotenv";

dotenv.config();

const FREE_MODELS = [
  "arcee-ai/trinity-large-preview:free",
  "tngtech/deepseek-r1t2-chimera:free",
  "stepfun/step-3.5-flash:free",
  "z-ai/glm-4.5-air:free",
  "openrouter/pony-alpha",
  "tngtech/deepseek-r1t-chimera:free",
  "nvidia/nemotron-3-nano-30b-a3b:free"
];

async function testFreeModels() {
  console.log("🧪 Testing Free Models from OpenRouter\n");
  console.log(`📋 Testing ${FREE_MODELS.length} models\n`);

  const aio = new AIO({
    providers: [
      {
        provider: "openrouter",
        apiKeys: [
          {
            key: process.env.OPENROUTER_API_KEY || "",
            priority: 10,
          },
          {
            key: process.env.OPENROUTER_API_KEY_2 || "",
            priority: 5,
          },
        ],
        models: FREE_MODELS.map((modelId, index) => ({
          modelId,
          priority: FREE_MODELS.length - index, // Higher priority for first models
        })),
      },
    ],
    enableLogging: false, // Disable logging for cleaner output
    maxRetries: 2,
  });

  const testPrompt = "What is 2+2? Answer in one short sentence.";
  const results: {
    model: string;
    success: boolean;
    response?: string;
    error?: string;
    time?: number;
  }[] = [];

  // Test từng model
  for (const model of FREE_MODELS) {
    const startTime = Date.now();
    process.stdout.write(`Testing ${model.padEnd(45)} ... `);

    try {
      const response = await aio.chatCompletion({
        provider: "openrouter",
        model,
        messages: [{ role: "user", content: testPrompt }],
        max_tokens: 100,
        temperature: 0.7,
      });

      const time = Date.now() - startTime;
      const content = response.choices[0].message.content.substring(0, 80);

      console.log(`✅ ${time}ms`);
      console.log(`   Response: ${content}${content.length >= 80 ? "..." : ""}`);

      results.push({
        model,
        success: true,
        response: content,
        time,
      });
    } catch (error: any) {
      const time = Date.now() - startTime;
      console.log(`❌ ${time}ms`);
      console.log(`   Error: ${error.message.substring(0, 100)}`);

      results.push({
        model,
        success: false,
        error: error.message,
        time,
      });
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Summary
  console.log("\n" + "=".repeat(80));
  console.log("📊 SUMMARY");
  console.log("=".repeat(80));

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`\n✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);

  if (successful.length > 0) {
    const avgTime =
      successful.reduce((sum, r) => sum + (r.time || 0), 0) /
      successful.length;
    console.log(`⚡ Average response time: ${avgTime.toFixed(0)}ms`);

    console.log("\n✅ Working Models:");
    successful.forEach((r) => {
      console.log(`   - ${r.model} (${r.time}ms)`);
    });
  }

  if (failed.length > 0) {
    console.log("\n❌ Failed Models:");
    failed.forEach((r) => {
      console.log(`   - ${r.model}`);
      console.log(`     Error: ${r.error?.substring(0, 80)}`);
    });
  }

  // Test Auto Mode với working models
  if (successful.length > 0) {
    console.log("\n" + "=".repeat(80));
    console.log("🎯 Testing Auto Mode with Working Models");
    console.log("=".repeat(80));

    const workingModels = successful.map((r) => r.model);

    const autoAio = new AIO({
      providers: [
        {
          provider: "openrouter",
          apiKeys: [
            {
              key: process.env.OPENROUTER_API_KEY || "",
              priority: 10,
            },
            {
              key: process.env.OPENROUTER_API_KEY_2 || "",
              priority: 5,
            },
          ],
          models: workingModels.slice(0, 5).map((modelId, index) => ({
            modelId,
            priority: 10 - index,
          })),
        },
      ],
      autoMode: true,
      enableLogging: true,
      maxRetries: 2,
    });

    try {
      console.log("\n🚀 Testing auto mode (will pick highest priority model)...");
      const response = await autoAio.chatCompletion({
        messages: [
          {
            role: "user",
            content: "Say hello in one word",
          },
        ],
        max_tokens: 20,
      });

      console.log("\n✅ Auto mode succeeded!");
      console.log(`   Model used: ${response.model}`);
      console.log(`   Provider: ${response.provider}`);
      console.log(`   Response: ${response.choices[0].message.content}`);
    } catch (error: any) {
      console.log("\n❌ Auto mode failed:", error.message);
    }
  }

  console.log("\n✅ All tests completed!");
}

testFreeModels().catch(console.error);
