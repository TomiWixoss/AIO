#!/usr/bin/env node

/**
 * Script test đầy đủ các trường hợp chat
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:4000";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function getToken() {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@localhost",
      password: "admin123",
    }),
  });
  const data = await response.json();
  return data.data.token;
}

function generateSessionKey() {
  return crypto.randomUUID();
}

async function chat(token, body) {
  const response = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Request failed");
  }

  return await response.json();
}

async function test1_NoSystemPrompt(token) {
  log("\n=== TEST 1: No System Prompt ===", "cyan");
  const sessionKey = generateSessionKey();

  const response = await chat(token, {
    provider: "openrouter",
    model: "meta-llama/llama-3.3-70b-instruct:free",
    message: "What is 2+2?",
    session_key: sessionKey,
  });

  const answer = response.choices[0].message.content;
  log(`✓ Response: ${answer}`, "green");

  if (answer.includes("4")) {
    log("✓ PASSED: Correct answer", "green");
    return true;
  } else {
    log("✗ FAILED: Wrong answer", "red");
    return false;
  }
}

async function test2_WithSystemPrompt(token) {
  log("\n=== TEST 2: With System Prompt (Vietnamese) ===", "cyan");
  const sessionKey = generateSessionKey();

  const response = await chat(token, {
    provider: "openrouter",
    model: "meta-llama/llama-3.3-70b-instruct:free",
    message: "Hello, what is your name?",
    system_prompt: "You MUST respond in Vietnamese language only.",
    session_key: sessionKey,
  });

  const answer = response.choices[0].message.content;
  log(`✓ Response: ${answer}`, "green");

  // Check if response contains Vietnamese characters
  const hasVietnamese =
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
      answer
    );

  if (hasVietnamese) {
    log("✓ PASSED: Response in Vietnamese", "green");
    return true;
  } else {
    log("✗ FAILED: Response not in Vietnamese", "red");
    return false;
  }
}

async function test3_MultiTurnHistory(token) {
  log("\n=== TEST 3: Multi-turn History ===", "cyan");
  const sessionKey = generateSessionKey();

  // Turn 1
  log("Turn 1: My name is Alice", "yellow");
  const response1 = await chat(token, {
    provider: "openrouter",
    model: "meta-llama/llama-3.3-70b-instruct:free",
    message: "My name is Alice",
    session_key: sessionKey,
  });
  log(`Response: ${response1.choices[0].message.content}`, "green");

  // Wait a bit
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Turn 2
  log("\nTurn 2: What is my name?", "yellow");
  const response2 = await chat(token, {
    provider: "openrouter",
    model: "meta-llama/llama-3.3-70b-instruct:free",
    message: "What is my name?",
    session_key: sessionKey,
  });

  const answer = response2.choices[0].message.content;
  log(`Response: ${answer}`, "green");

  if (answer.toLowerCase().includes("alice")) {
    log("✓ PASSED: Remembered name from history", "green");
    return true;
  } else {
    log("✗ FAILED: Did not remember name", "red");
    return false;
  }
}

async function test4_HistoryWithSystemPrompt(token) {
  log("\n=== TEST 4: History + System Prompt ===", "cyan");
  const sessionKey = generateSessionKey();

  // Turn 1
  log("Turn 1: Tên tôi là Minh (with Vietnamese system prompt)", "yellow");
  const response1 = await chat(token, {
    provider: "openrouter",
    model: "meta-llama/llama-3.3-70b-instruct:free",
    message: "Tên tôi là Minh",
    system_prompt: "Bạn là trợ lý AI. Luôn trả lời bằng tiếng Việt.",
    session_key: sessionKey,
  });
  log(`Response: ${response1.choices[0].message.content}`, "green");

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Turn 2 - no system prompt in second turn
  log("\nTurn 2: Tên tôi là gì? (no system prompt)", "yellow");
  const response2 = await chat(token, {
    provider: "openrouter",
    model: "meta-llama/llama-3.3-70b-instruct:free",
    message: "Tên tôi là gì?",
    session_key: sessionKey,
  });

  const answer = response2.choices[0].message.content;
  log(`Response: ${answer}`, "green");

  const hasVietnamese =
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
      answer
    );
  const hasMinhName = answer.toLowerCase().includes("minh");

  if (hasVietnamese && hasMinhName) {
    log("✓ PASSED: Remembered name and kept Vietnamese", "green");
    return true;
  } else {
    log(`✗ FAILED: Vietnamese=${hasVietnamese}, HasName=${hasMinhName}`, "red");
    return false;
  }
}

async function test5_DifferentModels(token) {
  log("\n=== TEST 5: Different Models ===", "cyan");
  const models = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "qwen/qwen3-coder:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
  ];

  let passed = 0;
  for (const model of models) {
    try {
      const sessionKey = generateSessionKey();
      log(`\nTesting: ${model}`, "yellow");

      const response = await chat(token, {
        provider: "openrouter",
        model,
        message: "Say hello in 3 words",
        session_key: sessionKey,
      });

      const answer = response.choices[0].message.content;
      log(`✓ Response: ${answer}`, "green");
      passed++;
    } catch (error) {
      log(`✗ Failed: ${error.message}`, "red");
    }
  }

  if (passed === models.length) {
    log(`\n✓ PASSED: All ${models.length} models working`, "green");
    return true;
  } else {
    log(`\n✗ FAILED: Only ${passed}/${models.length} models working`, "red");
    return false;
  }
}

async function test6_Streaming(token) {
  log("\n=== TEST 6: Streaming ===", "cyan");
  const sessionKey = generateSessionKey();

  try {
    const response = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        provider: "openrouter",
        model: "meta-llama/llama-3.3-70b-instruct:free",
        message: "Count from 1 to 3",
        session_key: sessionKey,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error("Streaming request failed");
    }

    const text = await response.text();
    const chunks = text.split("\n").filter((line) => line.startsWith("data:"));

    log(`✓ Received ${chunks.length} chunks`, "green");

    if (chunks.length > 0) {
      log("✓ PASSED: Streaming works", "green");
      return true;
    } else {
      log("✗ FAILED: No chunks received", "red");
      return false;
    }
  } catch (error) {
    log(`✗ FAILED: ${error.message}`, "red");
    return false;
  }
}

async function main() {
  console.clear();
  log("╔════════════════════════════════════════════════════════════╗", "cyan");
  log("║              CHAT SCENARIOS TEST SUITE                     ║", "cyan");
  log("╚════════════════════════════════════════════════════════════╝", "cyan");
  log(`\nBase URL: ${BASE_URL}\n`, "cyan");

  const startTime = Date.now();
  const results = [];

  try {
    log("🔑 Getting auth token...", "yellow");
    const token = await getToken();
    log("✓ Token obtained\n", "green");

    // Run all tests
    results.push(await test1_NoSystemPrompt(token));
    await new Promise((resolve) => setTimeout(resolve, 2000));

    results.push(await test2_WithSystemPrompt(token));
    await new Promise((resolve) => setTimeout(resolve, 2000));

    results.push(await test3_MultiTurnHistory(token));
    await new Promise((resolve) => setTimeout(resolve, 2000));

    results.push(await test4_HistoryWithSystemPrompt(token));
    await new Promise((resolve) => setTimeout(resolve, 2000));

    results.push(await test5_DifferentModels(token));
    await new Promise((resolve) => setTimeout(resolve, 2000));

    results.push(await test6_Streaming(token));
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, "red");
    console.error(error);
    process.exit(1);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const passed = results.filter((r) => r).length;
  const failed = results.filter((r) => !r).length;

  log("\n" + "=".repeat(60), "cyan");
  log("TEST SUMMARY", "cyan");
  log("=".repeat(60), "cyan");
  log(`\nTotal Tests: ${results.length}`, "cyan");
  log(`Passed: ${passed}`, "green");
  log(`Failed: ${failed}`, failed > 0 ? "red" : "green");
  log(`Duration: ${duration}s`, "cyan");

  if (failed === 0) {
    log("\n🎉 All tests passed!", "green");
    process.exit(0);
  } else {
    log("\n❌ Some tests failed!", "red");
    process.exit(1);
  }
}

main();
