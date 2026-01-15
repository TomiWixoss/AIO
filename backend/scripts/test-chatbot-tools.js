import { randomUUID } from "crypto";

const BASE_URL = "http://localhost:4000";
const CHATBOT_SLUG = "llm"; // Thay bằng slug chatbot của bạn
const API_KEY = "cb_8684af348babda353962f1ce2f5c73d8415f8b9d7007e612"; // Thay bằng API key của chatbot

// Test scenarios
const tests = [
  {
    name: "List Models Tool",
    message: "Cho tôi xem danh sách các model AI có trong hệ thống",
    expectTool: "list_models",
  },
  {
    name: "List Providers Tool",
    message: "Liệt kê các nhà cung cấp LLM",
    expectTool: "list_providers",
  },
  {
    name: "System Stats Tool",
    message: "Thống kê hệ thống hiện tại như thế nào?",
    expectTool: "get_system_stats",
  },
  {
    name: "List Chatbots Tool",
    message: "Có bao nhiêu chatbot trong hệ thống?",
    expectTool: "list_chatbots",
  },
];

// Non-streaming test
async function testNonStreaming(message, testName) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🧪 TEST: ${testName} (Non-Streaming)`);
  console.log(`${"=".repeat(60)}`);
  console.log(`📤 Message: ${message}\n`);

  const sessionKey = randomUUID();

  try {
    const response = await fetch(
      `${BASE_URL}/chatbots/public/${CHATBOT_SLUG}/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY,
        },
        body: JSON.stringify({
          message,
          session_key: sessionKey,
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log("📥 Response:");
    console.log(content);
    console.log("\n📊 Metadata:");
    console.log(`- Session Key: ${data.session_key}`);
    console.log(`- Tool Calls Made: ${data.tool_calls_made || false}`);
    console.log(`- Iterations: ${data.iterations || 1}`);

    // Check if tool was called
    if (data.messages && data.messages.length > 0) {
      console.log("\n🔧 Tool Execution Details:");
      data.messages.forEach((msg, idx) => {
        if (msg.role === "assistant" && msg.content.includes("[tool]")) {
          console.log(`\n  [${idx}] Assistant called tool:`);
          const toolMatch = msg.content.match(/\[tool\]([\s\S]*?)\[\/tool\]/);
          if (toolMatch) {
            console.log(`  ${toolMatch[1].trim()}`);
          }
        }
        if (msg.role === "user" && msg.content.includes("[tool_result]")) {
          console.log(`\n  [${idx}] Tool result received:`);
          const resultMatch = msg.content.match(
            /\[tool_result\]([\s\S]*?)\[\/tool_result\]/
          );
          if (resultMatch) {
            const result = resultMatch[1].trim();
            console.log(
              `  ${result.substring(0, 200)}${result.length > 200 ? "..." : ""}`
            );
          }
        }
      });
    }

    return { success: true, sessionKey };
  } catch (error) {
    console.error("❌ Error:", error.message);
    return { success: false, error: error.message };
  }
}

// Streaming test
async function testStreaming(message, testName) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🧪 TEST: ${testName} (Streaming)`);
  console.log(`${"=".repeat(60)}`);
  console.log(`📤 Message: ${message}\n`);

  const sessionKey = randomUUID();

  try {
    const response = await fetch(
      `${BASE_URL}/chatbots/public/${CHATBOT_SLUG}/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY,
        },
        body: JSON.stringify({
          message,
          session_key: sessionKey,
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    console.log("📥 Streaming Response:");
    let fullContent = "";
    let receivedSessionKey = null;

    const reader = response.body;
    let buffer = "";

    for await (const chunk of reader) {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ") && !line.includes("[DONE]")) {
          try {
            const data = JSON.parse(line.slice(6));

            // Session key
            if (data.session_key && !receivedSessionKey) {
              receivedSessionKey = data.session_key;
            }

            // Content chunks
            const content = data.choices?.[0]?.delta?.content;
            if (content) {
              process.stdout.write(content);
              fullContent += content;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }

    console.log("\n\n📊 Metadata:");
    console.log(`- Session Key: ${receivedSessionKey}`);
    console.log(`- Total Length: ${fullContent.length} chars`);

    // Check for tool patterns in streamed content
    const hasToolCall = fullContent.includes("[tool]");
    const hasToolResult = fullContent.includes("[tool_result]");
    console.log(`- Contains Tool Call: ${hasToolCall}`);
    console.log(`- Contains Tool Result: ${hasToolResult}`);

    return { success: true, sessionKey: receivedSessionKey };
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    return { success: false, error: error.message };
  }
}

// Main test runner
async function runTests() {
  console.log("\n🚀 Starting Chatbot Tool Calling Tests");
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🤖 Chatbot Slug: ${CHATBOT_SLUG}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 20)}...`);

  const results = {
    nonStreaming: [],
    streaming: [],
  };

  // Test non-streaming
  console.log("\n\n" + "=".repeat(60));
  console.log("📝 NON-STREAMING TESTS");
  console.log("=".repeat(60));

  for (const test of tests) {
    const result = await testNonStreaming(test.message, test.name);
    results.nonStreaming.push({ ...test, ...result });
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait between tests
  }

  // Test streaming
  console.log("\n\n" + "=".repeat(60));
  console.log("📺 STREAMING TESTS");
  console.log("=".repeat(60));

  for (const test of tests) {
    const result = await testStreaming(test.message, test.name);
    results.streaming.push({ ...test, ...result });
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait between tests
  }

  // Summary
  console.log("\n\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(60));

  const nonStreamingSuccess = results.nonStreaming.filter(
    (r) => r.success
  ).length;
  const streamingSuccess = results.streaming.filter((r) => r.success).length;

  console.log(
    `\n✅ Non-Streaming: ${nonStreamingSuccess}/${tests.length} passed`
  );
  console.log(`✅ Streaming: ${streamingSuccess}/${tests.length} passed`);

  // Failed tests
  const failedNonStreaming = results.nonStreaming.filter((r) => !r.success);
  const failedStreaming = results.streaming.filter((r) => !r.success);

  if (failedNonStreaming.length > 0) {
    console.log("\n❌ Failed Non-Streaming Tests:");
    failedNonStreaming.forEach((test) => {
      console.log(`  - ${test.name}: ${test.error}`);
    });
  }

  if (failedStreaming.length > 0) {
    console.log("\n❌ Failed Streaming Tests:");
    failedStreaming.forEach((test) => {
      console.log(`  - ${test.name}: ${test.error}`);
    });
  }

  console.log("\n✨ Tests completed!\n");
}

runTests().catch(console.error);
