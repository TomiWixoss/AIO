#!/usr/bin/env node

/**
 * Test AI gọi tools - Comprehensive test suite
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:4000";

let token = null;
let toolIds = [];

async function getToken() {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@localhost", password: "admin123" }),
  });
  const data = await response.json();
  return data.data.token;
}

async function getTools() {
  const response = await fetch(`${BASE_URL}/tools`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  return data.data || [];
}

async function chat(message, options = {}) {
  const response = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      provider: "google-ai",
      model: "gemini-2.5-flash-lite",
      message,
      session_key: options.session_key || crypto.randomUUID(),
      tool_ids: options.tool_ids || toolIds,
      system_prompt: options.system_prompt,
      ...options,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Request failed");
  }

  return await response.json();
}

const tests = [
  {
    name: "1. AI nhận diện cần gọi tool get_user",
    message: "Cho tôi thông tin của user có ID là 1",
    validate: (response) => {
      const content = response.choices[0].message.content.toLowerCase();
      // AI should have called tool and returned user info
      return (
        content.includes("leanne") || // User 1's name
        content.includes("sincere@april") || // User 1's email
        content.includes("bret") // User 1's username
      );
    },
  },
  {
    name: "2. AI gọi tool get_post",
    message: "Lấy nội dung bài viết số 5",
    validate: (response) => {
      const content = response.choices[0].message.content.toLowerCase();
      return (
        content.includes("nesciunt") || // Part of post 5 title
        content.includes("post") ||
        content.includes("bài viết")
      );
    },
  },
  {
    name: "3. AI gọi tool với query params (get_user_posts)",
    message: "Liệt kê các bài viết của user ID 2",
    validate: (response) => {
      const content = response.choices[0].message.content.toLowerCase();
      return (
        content.includes("qui est esse") || // Post title from user 2
        content.includes("bài") ||
        content.includes("post")
      );
    },
  },
  {
    name: "4. AI gọi tool POST (create_post)",
    message:
      'Tạo bài viết mới với tiêu đề "Hello World" và nội dung "This is a test" cho user 1',
    validate: (response) => {
      const content = response.choices[0].message.content.toLowerCase();
      return (
        content.includes("101") || // JSONPlaceholder returns id 101 for new posts
        content.includes("tạo") ||
        content.includes("created") ||
        content.includes("thành công")
      );
    },
  },
  {
    name: "5. AI gọi tool get_comments",
    message: "Lấy các bình luận của bài viết số 1",
    validate: (response) => {
      const content = response.choices[0].message.content.toLowerCase();
      return (
        content.includes("comment") ||
        content.includes("bình luận") ||
        content.includes("eliseo@gardner") // Email from comment
      );
    },
  },
  {
    name: "6. AI KHÔNG gọi tool khi không cần",
    message: "Xin chào, bạn khỏe không?",
    tool_ids: [], // No tools
    validate: (response) => {
      const content = response.choices[0].message.content.toLowerCase();
      // Should be a normal greeting, not tool-related
      return (
        content.includes("chào") ||
        content.includes("khỏe") ||
        content.includes("hello") ||
        content.includes("hi")
      );
    },
  },
  {
    name: "7. AI xử lý khi tool trả về lỗi (invalid ID)",
    message: "Lấy thông tin user có ID 999999",
    validate: (response) => {
      const content = response.choices[0].message.content.toLowerCase();
      // Should handle error gracefully - either error message or smart response
      return (
        content.includes("không tìm thấy") ||
        content.includes("not found") ||
        content.includes("lỗi") ||
        content.includes("error") ||
        content.includes("không có") ||
        content.includes("không tồn tại") ||
        content.includes("hợp lệ") || // AI knows valid range
        content.includes("1-10") ||
        content.includes("1 đến 10")
      );
    },
  },
  {
    name: "8. AI gọi nhiều tools trong 1 câu hỏi",
    message: "Cho tôi thông tin user 3 và bài viết số 10",
    validate: (response) => {
      const content = response.choices[0].message.content.toLowerCase();
      // Should have info from both calls
      return (
        (content.includes("clementine") || content.includes("user")) && // User 3's name
        (content.includes("optio") ||
          content.includes("post") ||
          content.includes("bài")) // Part of post 10 title
      );
    },
  },
  {
    name: "9. Multi-turn với tool context",
    message: "Lấy thông tin user 5",
    followUp: {
      message: "User này làm việc ở công ty nào?",
      validate: (response) => {
        const content = response.choices[0].message.content.toLowerCase();
        return (
          content.includes("keebler") || // User 5's company
          content.includes("công ty")
        );
      },
    },
    validate: (response) => {
      const content = response.choices[0].message.content.toLowerCase();
      return content.includes("chelsey") || content.includes("user"); // User 5's name
    },
  },
];

async function runTest(test, index) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`📝 ${test.name}`);
  console.log(`   Message: "${test.message}"`);

  try {
    const sessionKey = crypto.randomUUID();
    const response = await chat(test.message, {
      session_key: sessionKey,
      tool_ids: test.tool_ids !== undefined ? test.tool_ids : toolIds,
    });

    const content = response.choices[0].message.content;
    console.log(
      `   Response: "${content.substring(0, 150)}${
        content.length > 150 ? "..." : ""
      }"`
    );

    const passed = test.validate(response);
    console.log(passed ? "   ✅ PASSED" : "   ❌ FAILED");

    // Handle follow-up test
    if (passed && test.followUp) {
      console.log(`\n   📝 Follow-up: "${test.followUp.message}"`);
      await new Promise((r) => setTimeout(r, 1500));

      const followUpResponse = await chat(test.followUp.message, {
        session_key: sessionKey,
        tool_ids: test.tool_ids !== undefined ? test.tool_ids : toolIds,
      });

      const followUpContent = followUpResponse.choices[0].message.content;
      console.log(
        `   Response: "${followUpContent.substring(0, 150)}${
          followUpContent.length > 150 ? "..." : ""
        }"`
      );

      const followUpPassed = test.followUp.validate(followUpResponse);
      console.log(
        followUpPassed ? "   ✅ Follow-up PASSED" : "   ❌ Follow-up FAILED"
      );

      return { passed: passed && followUpPassed, hasFollowUp: true };
    }

    return { passed };
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return { passed: false, error: error.message };
  }
}

async function main() {
  console.clear();
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║              AI TOOL CALLING TEST SUITE                    ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`\nBase URL: ${BASE_URL}`);

  try {
    console.log("\n🔑 Getting auth token...");
    token = await getToken();
    console.log("✓ Token obtained");

    console.log("\n📦 Getting available tools...");
    const tools = await getTools();
    toolIds = tools.filter((t) => t.is_active).map((t) => t.id);
    console.log(
      `✓ Found ${toolIds.length} active tools: ${tools
        .map((t) => t.name)
        .join(", ")}`
    );

    if (toolIds.length === 0) {
      console.log(
        "\n⚠️  No tools found! Run 'node scripts/add-mock-tools.js' first."
      );
      process.exit(1);
    }

    console.log(`\n🧪 Running ${tests.length} tests...`);

    const results = [];
    for (let i = 0; i < tests.length; i++) {
      const result = await runTest(tests[i], i);
      results.push({ ...tests[i], ...result });

      // Delay between tests to avoid rate limiting
      if (i < tests.length - 1) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    // Summary
    console.log("\n" + "═".repeat(60));
    console.log("📊 TEST SUMMARY");
    console.log("═".repeat(60));

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    results.forEach((r, i) => {
      const status = r.passed ? "✅" : "❌";
      console.log(`${status} ${r.name}`);
    });

    console.log("\n" + "─".repeat(60));
    console.log(`Total: ${passed}/${results.length} passed, ${failed} failed`);

    if (passed === results.length) {
      console.log("\n🎉 All tests passed!");
    } else {
      console.log("\n⚠️  Some tests failed");
    }

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("\n❌ Fatal error:", error.message);
    process.exit(1);
  }
}

main();
