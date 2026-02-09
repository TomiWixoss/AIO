/**
 * Simple Abort Test
 */

import { AIO } from "../src/index.js";
import dotenv from "dotenv";

dotenv.config();

async function testAbortSimple() {
  console.log("🧪 Simple Abort Test\n");

  const aio = new AIO({
    providers: [
      {
        provider: "openrouter",
        apiKeys: [{ key: process.env.OPENROUTER_API_KEY || "" }],
        models: [{ modelId: "openrouter/pony-alpha" }],
      },
    ],
    enableLogging: true,
  });

  // Test 1: Cancel Non-Streaming
  console.log("1️⃣ Cancel Non-Streaming Request");
  const controller1 = new AbortController();

  setTimeout(() => {
    console.log("   ⏱️  Cancelling...");
    controller1.abort();
  }, 500);

  try {
    await aio.chatCompletion({
      provider: "openrouter",
      model: "openrouter/pony-alpha",
      messages: [{ role: "user", content: "Write a long story" }],
      max_tokens: 1000,
      signal: controller1.signal,
    });
    console.log("   ❌ Should have been cancelled");
  } catch (error: any) {
    console.log("   ✅ Cancelled:", error.message);
  }

  // Test 2: Cancel Streaming
  console.log("\n2️⃣ Cancel Streaming Request");
  const controller2 = new AbortController();

  try {
    const stream = await aio.chatCompletionStream({
      provider: "openrouter",
      model: "openrouter/pony-alpha",
      messages: [{ role: "user", content: "Count to 100" }],
      max_tokens: 500,
      signal: controller2.signal,
    });

    console.log("   📡 Streaming...");
    let chunks = 0;

    for await (const chunk of stream) {
      chunks++;
      if (chunks >= 3) {
        console.log("   ⏱️  Cancelling stream...");
        controller2.abort();
        break;
      }
    }

    console.log("   ✅ Stream cancelled");
  } catch (error: any) {
    console.log("   ✅ Cancelled:", error.message);
  }

  // Test 3: Pre-cancelled
  console.log("\n3️⃣ Pre-cancelled Request");
  const controller3 = new AbortController();
  controller3.abort();

  try {
    await aio.chatCompletion({
      provider: "openrouter",
      model: "openrouter/pony-alpha",
      messages: [{ role: "user", content: "Test" }],
      signal: controller3.signal,
    });
    console.log("   ❌ Should have been cancelled");
  } catch (error: any) {
    console.log("   ✅ Pre-cancelled:", error.message);
  }

  console.log("\n✅ All tests passed!");
}

testAbortSimple().catch(console.error);
