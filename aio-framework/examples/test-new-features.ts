/**
 * Test New Features: Validation, Retry, Key Management, Logging
 * Test với OpenRouter và model pony-alpha
 */

import { AIO, AIOError } from "../src/index.js";
import dotenv from "dotenv";

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

async function testNewFeatures() {
  console.log("🧪 Testing New Features\n");

  // Test 1: Validation
  console.log("1️⃣ Test Validation");
  try {
    const aio = new AIO({
      providers: [
        {
          provider: "openrouter",
          apiKeys: [
            {
              key: OPENROUTER_API_KEY,
              priority: 10,
              dailyLimit: 100,
            },
          ],
          models: [
            {
              modelId: "openrouter/pony-alpha",
              priority: 10,
            },
          ],
          priority: 10,
        },
      ],
      enableValidation: true,
      enableLogging: true,
      maxRetries: 3,
      retryDelay: 1000,
    });

    console.log("✅ Config validation passed");
    console.log("📊 Config Summary:", aio.getConfigSummary());
  } catch (error: any) {
    console.error("❌ Validation failed:", error.message);
    return;
  }

  // Test 2: Invalid Request Validation
  console.log("\n2️⃣ Test Invalid Request Validation");
  try {
    const aio = new AIO({
      providers: [
        {
          provider: "openrouter",
          apiKeys: [{ key: OPENROUTER_API_KEY }],
          models: [{ modelId: "openrouter/pony-alpha" }],
        },
      ],
      enableValidation: true,
    });

    // Invalid request - empty messages
    await aio.chatCompletion({
      provider: "openrouter",
      model: "openrouter/pony-alpha",
      messages: [], // Invalid!
    });
  } catch (error: any) {
    if (error instanceof AIOError) {
      console.log("✅ Caught validation error:", error.message);
    }
  }

  // Test 3: Chat Completion với Logging
  console.log("\n3️⃣ Test Chat Completion with Logging");
  try {
    const aio = new AIO({
      providers: [
        {
          provider: "openrouter",
          apiKeys: [
            {
              key: OPENROUTER_API_KEY,
              priority: 10,
              dailyLimit: 100,
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
      maxRetries: 3,
    });

    const response = await aio.chatCompletion({
      provider: "openrouter",
      model: "openrouter/pony-alpha",
      messages: [
        {
          role: "user",
          content: "Say 'Hello from AIO Framework!' in one sentence.",
        },
      ],
      temperature: 0.7,
      max_tokens: 50,
    });

    console.log("✅ Response:", response.choices[0].message.content);
    console.log("📊 Usage:", response.usage);

    // Check key stats
    const stats = aio.getKeyStats("openrouter");
    console.log("🔑 Key Stats:", stats);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }

  // Test 4: Key Rotation Simulation
  console.log("\n4️⃣ Test Key Rotation (Multiple Keys)");
  try {
    const aio = new AIO({
      providers: [
        {
          provider: "openrouter",
          apiKeys: [
            {
              key: "invalid-key-1", // Will fail
              priority: 20,
            },
            {
              key: "invalid-key-2", // Will fail
              priority: 15,
            },
            {
              key: OPENROUTER_API_KEY, // Valid key
              priority: 10,
            },
          ],
          models: [{ modelId: "openrouter/pony-alpha" }],
        },
      ],
      enableLogging: true,
      maxRetries: 2,
    });

    const response = await aio.chatCompletion({
      provider: "openrouter",
      model: "openrouter/pony-alpha",
      messages: [
        {
          role: "user",
          content: "Test key rotation",
        },
      ],
      max_tokens: 20,
    });

    console.log("✅ Key rotation worked! Response:", response.choices[0].message.content);
    
    const stats = aio.getKeyStats("openrouter");
    console.log("🔑 Final Key Stats:", stats);
  } catch (error: any) {
    console.error("❌ All keys failed:", error.message);
  }

  // Test 5: Error Classification
  console.log("\n5️⃣ Test Error Classification");
  const testErrors = [
    "Rate limit exceeded",
    "Invalid API key",
    "Bad request: invalid parameter",
    "500 Internal Server Error",
    "Network timeout",
  ];

  testErrors.forEach((errorMsg) => {
    const classification = AIOError.classify(new Error(errorMsg));
    console.log(`📋 "${errorMsg}"`);
    console.log(`   Category: ${classification.category}`);
    console.log(`   Retryable: ${classification.isRetryable}`);
    console.log(`   Should Rotate Key: ${classification.shouldRotateKey}`);
  });

  // Test 6: Daily Limit
  console.log("\n6️⃣ Test Daily Limit");
  try {
    const aio = new AIO({
      providers: [
        {
          provider: "openrouter",
          apiKeys: [
            {
              key: OPENROUTER_API_KEY,
              priority: 10,
              dailyLimit: 2, // Very low limit
              requestsToday: 0,
            },
          ],
          models: [{ modelId: "openrouter/pony-alpha" }],
        },
      ],
      enableLogging: true,
    });

    // Make 3 requests (should fail on 3rd)
    for (let i = 1; i <= 3; i++) {
      try {
        console.log(`\n   Request ${i}/3...`);
        await aio.chatCompletion({
          provider: "openrouter",
          model: "openrouter/pony-alpha",
          messages: [{ role: "user", content: `Test ${i}` }],
          max_tokens: 10,
        });
        console.log(`   ✅ Request ${i} succeeded`);
        
        const stats = aio.getKeyStats("openrouter");
        console.log(`   📊 Usage: ${stats?.totalUsage}/${2}`);
      } catch (error: any) {
        console.log(`   ❌ Request ${i} failed: ${error.message}`);
      }
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }

  // Test 7: Streaming with New Features
  console.log("\n7️⃣ Test Streaming with Logging");
  try {
    const aio = new AIO({
      providers: [
        {
          provider: "openrouter",
          apiKeys: [{ key: OPENROUTER_API_KEY }],
          models: [{ modelId: "openrouter/pony-alpha" }],
        },
      ],
      enableLogging: true,
    });

    const stream = await aio.chatCompletionStream({
      provider: "openrouter",
      model: "openrouter/pony-alpha",
      messages: [
        {
          role: "user",
          content: "Count from 1 to 5",
        },
      ],
      max_tokens: 50,
    });

    console.log("📡 Streaming response:");
    process.stdout.write("   ");

    for await (const chunk of stream) {
      const text = chunk.toString();
      const lines = text.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ") && !line.includes("[DONE]")) {
          try {
            const data = JSON.parse(line.slice(6));
            const content = data.choices?.[0]?.delta?.content;
            if (content) {
              process.stdout.write(content);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    console.log("\n✅ Streaming completed");
  } catch (error: any) {
    console.error("❌ Streaming error:", error.message);
  }

  console.log("\n✅ All tests completed!");
}

// Run tests
testNewFeatures().catch(console.error);
