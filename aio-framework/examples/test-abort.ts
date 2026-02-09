/**
 * Test Abort/Cancel Functionality
 * Test khả năng ngắt streaming và non-streaming requests
 */

import { AIO } from "../src/index.js";
import dotenv from "dotenv";

dotenv.config();

async function testAbort() {
  console.log("🧪 Testing Abort/Cancel Functionality\n");

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

  // Test 1: Cancel Non-Streaming Request
  console.log("1️⃣ Test Cancel Non-Streaming Request");
  try {
    const controller = new AbortController();

    // Cancel after 500ms
    setTimeout(() => {
      console.log("   ⏱️  Cancelling request after 500ms...");
      controller.abort();
    }, 500);

    const response = await aio.chatCompletion({
      provider: "openrouter",
      model: "openrouter/pony-alpha",
      messages: [
        {
          role: "user",
          content: "Write a very long story about a dragon (this should be cancelled)",
        },
      ],
      max_tokens: 1000,
      signal: controller.signal,
    });

    console.log("   ❌ Request completed (should have been cancelled)");
    console.log("   Response:", response.choices[0].message.content.substring(0, 100));
  } catch (error: any) {
    if (error.message.includes("cancel")) {
      console.log("   ✅ Request cancelled successfully:", error.message);
    } else {
      console.log("   ❌ Unexpected error:", error.message);
    }
  }

  // Test 2: Cancel Streaming Request
  console.log("\n2️⃣ Test Cancel Streaming Request");
  try {
    const controller = new AbortController();

    const stream = await aio.chatCompletionStream({
      provider: "openrouter",
      model: "openrouter/pony-alpha",
      messages: [
        {
          role: "user",
          content: "Count from 1 to 100",
        },
      ],
      max_tokens: 500,
      signal: controller.signal,
    });

    console.log("   📡 Streaming started...");
    let chunkCount = 0;

    // Cancel after receiving 5 chunks
    const cancelAfterChunks = 5;

    for await (const chunk of stream) {
      chunkCount++;
      const text = chunk.toString();
      
      // Parse SSE data
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

      if (chunkCount >= cancelAfterChunks) {
        console.log(`\n   ⏱️  Cancelling stream after ${chunkCount} chunks...`);
        controller.abort();
        break;
      }
    }

    console.log("\n   ✅ Stream cancelled successfully");
  } catch (error: any) {
    if (error.message.includes("cancel") || error.message.includes("destroy")) {
      console.log("   ✅ Stream cancelled:", error.message);
    } else {
      console.log("   ❌ Unexpected error:", error.message);
    }
  }

  // Test 3: Normal Completion (No Cancel)
  console.log("\n3️⃣ Test Normal Completion (No Cancel)");
  try {
    const controller = new AbortController();

    const response = await aio.chatCompletion({
      provider: "openrouter",
      model: "openrouter/pony-alpha",
      messages: [
        {
          role: "user",
          content: "Say 'Hello' in one word",
        },
      ],
      max_tokens: 10,
      signal: controller.signal,
    });

    console.log("   ✅ Request completed normally");
    console.log("   Response:", response.choices[0].message.content);
  } catch (error: any) {
    console.log("   ❌ Error:", error.message);
  }

  // Test 4: Pre-cancelled Request
  console.log("\n4️⃣ Test Pre-cancelled Request");
  try {
    const controller = new AbortController();
    controller.abort(); // Cancel trước khi gọi

    const response = await aio.chatCompletion({
      provider: "openrouter",
      model: "openrouter/pony-alpha",
      messages: [
        {
          role: "user",
          content: "This should not execute",
        },
      ],
      signal: controller.signal,
    });

    console.log("   ❌ Request completed (should have been cancelled)");
  } catch (error: any) {
    if (error.message.includes("cancel")) {
      console.log("   ✅ Pre-cancelled request rejected:", error.message);
    } else {
      console.log("   ❌ Unexpected error:", error.message);
    }
  }

  // Test 5: Multiple Concurrent Requests with Selective Cancel
  console.log("\n5️⃣ Test Multiple Concurrent Requests with Selective Cancel");
  try {
    const controller1 = new AbortController();
    const controller2 = new AbortController();

    // Start 2 requests
    const promise1 = aio.chatCompletion({
      provider: "openrouter",
      model: "openrouter/pony-alpha",
      messages: [{ role: "user", content: "Count to 3" }],
      max_tokens: 50,
      signal: controller1.signal,
    });

    const promise2 = aio.chatCompletion({
      provider: "openrouter",
      model: "openrouter/pony-alpha",
      messages: [{ role: "user", content: "Say hello" }],
      max_tokens: 20,
      signal: controller2.signal,
    });

    // Cancel only first request after 300ms
    setTimeout(() => {
      console.log("   ⏱️  Cancelling first request...");
      controller1.abort();
    }, 300);

    const results = await Promise.allSettled([promise1, promise2]);

    console.log("   Request 1:", results[0].status === "rejected" ? "✅ Cancelled" : "❌ Completed");
    console.log("   Request 2:", results[1].status === "fulfilled" ? "✅ Completed" : "❌ Failed");
    
    if (results[1].status === "fulfilled") {
      console.log("   Response 2:", results[1].value.choices[0].message.content.substring(0, 50));
    }
  } catch (error: any) {
    console.log("   ❌ Error:", error.message);
  }

  console.log("\n✅ All abort tests completed!");
}

testAbort().catch(console.error);
