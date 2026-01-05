#!/usr/bin/env node

/**
 * Script test đầy đủ tất cả Gemini models
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:4000";

const geminiModels = [
  { model: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite" },
  { model: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { model: "gemini-3-flash-preview", name: "Gemini 3 Flash Preview" },
  {
    model: "gemini-robotics-er-1.5-preview",
    name: "Gemini Robotics ER 1.5 Preview",
  },
  { model: "gemma-3-1b-it", name: "Gemma 3 1B IT" },
  { model: "gemma-3-4b-it", name: "Gemma 3 4B IT" },
  { model: "gemma-3-12b-it", name: "Gemma 3 12B IT" },
  { model: "gemma-3-27b-it", name: "Gemma 3 27B IT" },
];

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

async function testModel(token, model) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing: ${model.name}`);
  console.log(`Model: ${model.model}`);
  console.log("=".repeat(60));

  const results = {
    basic: false,
    systemPrompt: false,
    history: false,
    streaming: false,
  };

  // Test 1: Basic Chat
  try {
    console.log("\n1. Basic Chat...");
    const sessionKey = crypto.randomUUID();
    const response = await chat(token, {
      provider: "google-ai",
      model: model.model,
      message: "What is 2+2?",
      session_key: sessionKey,
    });
    results.basic = response.choices[0].message.content.includes("4");
    console.log(results.basic ? "✓ PASSED" : "✗ FAILED");
  } catch (error) {
    console.log(`✗ FAILED: ${error.message}`);
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 2: System Prompt
  try {
    console.log("\n2. System Prompt (Vietnamese)...");
    const sessionKey = crypto.randomUUID();
    const response = await chat(token, {
      provider: "google-ai",
      model: model.model,
      message: "Hello, what is your name?",
      system_prompt: "You MUST respond in Vietnamese language only.",
      session_key: sessionKey,
    });
    const answer = response.choices[0].message.content;
    results.systemPrompt =
      /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
        answer
      );
    console.log(results.systemPrompt ? "✓ PASSED" : "✗ FAILED");
  } catch (error) {
    console.log(`✗ FAILED: ${error.message}`);
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 3: History
  try {
    console.log("\n3. Multi-turn History...");
    const sessionKey = crypto.randomUUID();

    await chat(token, {
      provider: "google-ai",
      model: model.model,
      message: "My name is Charlie",
      session_key: sessionKey,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const response = await chat(token, {
      provider: "google-ai",
      model: model.model,
      message: "What is my name?",
      session_key: sessionKey,
    });

    results.history = response.choices[0].message.content
      .toLowerCase()
      .includes("charlie");
    console.log(results.history ? "✓ PASSED" : "✗ FAILED");
  } catch (error) {
    console.log(`✗ FAILED: ${error.message}`);
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 4: Streaming
  try {
    console.log("\n4. Streaming...");
    const sessionKey = crypto.randomUUID();

    const response = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        provider: "google-ai",
        model: model.model,
        message: "Count 1 to 3",
        session_key: sessionKey,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error("Streaming failed");
    }

    const text = await response.text();
    const chunks = text.split("\n").filter((line) => line.startsWith("data:"));
    results.streaming = chunks.length > 0;
    console.log(results.streaming ? "✓ PASSED" : "✗ FAILED");
  } catch (error) {
    console.log(`✗ FAILED: ${error.message}`);
  }

  const passed = Object.values(results).filter((r) => r).length;
  const total = Object.keys(results).length;

  console.log(`\nResult: ${passed}/${total} tests passed`);

  return { model, results, passed, total };
}

async function main() {
  console.clear();
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║           GEMINI MODELS COMPREHENSIVE TEST                 ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`\nBase URL: ${BASE_URL}`);
  console.log(`Testing ${geminiModels.length} Gemini models\n`);

  const startTime = Date.now();
  const allResults = [];

  try {
    console.log("🔑 Getting auth token...");
    const token = await getToken();
    console.log("✓ Token obtained");

    for (const model of geminiModels) {
      try {
        const result = await testModel(token, model);
        allResults.push(result);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (error) {
        console.log(`\n❌ Fatal error testing ${model.name}: ${error.message}`);
        allResults.push({
          model,
          results: {
            basic: false,
            systemPrompt: false,
            history: false,
            streaming: false,
          },
          passed: 0,
          total: 4,
        });
      }
    }
  } catch (error) {
    console.log(`\n❌ Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("FINAL SUMMARY");
  console.log("=".repeat(60));

  let totalPassed = 0;
  let totalTests = 0;

  allResults.forEach((result) => {
    const status = result.passed === result.total ? "✓" : "✗";
    console.log(
      `${status} ${result.model.name}: ${result.passed}/${result.total}`
    );
    totalPassed += result.passed;
    totalTests += result.total;
  });

  console.log("\n" + "=".repeat(60));
  console.log(`Total: ${totalPassed}/${totalTests} tests passed`);
  console.log(`Duration: ${duration}s`);
  console.log(`Models tested: ${allResults.length}`);

  const allPassed = totalPassed === totalTests;
  console.log(allPassed ? "\n🎉 All tests passed!" : "\n⚠️  Some tests failed");

  process.exit(allPassed ? 0 : 1);
}

main();
