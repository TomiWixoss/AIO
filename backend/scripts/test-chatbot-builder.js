// Test Chatbot Builder (không cần auth)
// Chạy: node scripts/test-chatbot-builder.js

const API_URL = process.env.API_URL || "http://localhost:4000";

function log(type, msg) {
  const icons = { ok: "✅", err: "❌", info: "ℹ️", test: "🧪" };
  console.log(`${icons[type] || "•"} ${msg}`);
}

async function test() {
  console.log("\n═══════════════════════════════════════");
  console.log("       TEST CHATBOT BUILDER");
  console.log("═══════════════════════════════════════\n");

  let chatbotId = null;
  const slug = "test-bot-" + Date.now();

  // Test 1: Tạo chatbot (không cần auth)
  log("test", "Test 1: Tạo chatbot mới (không cần auth)");
  try {
    const res = await fetch(`${API_URL}/chatbots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Bot",
        slug: slug,
        description: "Bot để test",
        auto_mode: true,
        system_prompt: "Bạn là trợ lý AI. Trả lời ngắn gọn.",
        temperature: 0.7,
        max_tokens: 1024,
        welcome_message: "Xin chào!",
        is_public: true,
      }),
    });
    const data = await res.json();

    if (data.success && data.data) {
      chatbotId = data.data.id;
      log("ok", `Chatbot created: ID=${chatbotId}, slug=${slug}`);
      log("info", `API Key: ${data.data.api_key?.substring(0, 20)}...`);
    } else {
      log("err", `Failed: ${JSON.stringify(data)}`);
    }
  } catch (e) {
    log("err", e.message);
  }

  // Test 2: Lấy danh sách chatbots
  log("test", "\nTest 2: Lấy danh sách chatbots");
  try {
    const res = await fetch(`${API_URL}/chatbots`);
    const data = await res.json();

    if (data.success) {
      log("ok", `Found ${data.data?.length || 0} chatbots`);
    } else {
      log("err", `Failed: ${data.error}`);
    }
  } catch (e) {
    log("err", e.message);
  }

  // Test 3: Test chat với chatbot (qua test-chat endpoint)
  if (chatbotId) {
    log("test", "\nTest 3: Test chat trong builder");
    try {
      const res = await fetch(`${API_URL}/chatbots/${chatbotId}/test-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Xin chào! Bạn là ai?" }),
      });
      const data = await res.json();

      if (data.choices) {
        log(
          "ok",
          `Response: ${data.choices[0]?.message?.content?.substring(0, 80)}...`
        );
      } else {
        log("err", `Failed: ${JSON.stringify(data)}`);
      }
    } catch (e) {
      log("err", e.message);
    }
  }

  // Test 4: Chat qua public endpoint
  log("test", "\nTest 4: Chat qua public endpoint");
  try {
    const res = await fetch(`${API_URL}/chatbots/public/${slug}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Đếm 1 2 3" }),
    });
    const data = await res.json();

    if (data.choices) {
      log(
        "ok",
        `Response: ${data.choices[0]?.message?.content?.substring(0, 80)}...`
      );
    } else {
      log("err", `Failed: ${JSON.stringify(data)}`);
    }
  } catch (e) {
    log("err", e.message);
  }

  // Test 5: Export code
  if (chatbotId) {
    log("test", "\nTest 5: Export code");
    try {
      const res = await fetch(`${API_URL}/chatbots/${chatbotId}/export-code`);
      const data = await res.json();

      if (data.success && data.data) {
        log("ok", "Export code available:");
        log("info", `  - cURL: ${data.data.curl?.length || 0} chars`);
        log(
          "info",
          `  - JavaScript: ${data.data.javascript?.length || 0} chars`
        );
        log("info", `  - Python: ${data.data.python?.length || 0} chars`);
        log("info", `  - React: ${data.data.react?.length || 0} chars`);
        log(
          "info",
          `  - HTML Widget: ${data.data.html_widget?.length || 0} chars`
        );
      } else {
        log("err", `Failed: ${data.error}`);
      }
    } catch (e) {
      log("err", e.message);
    }
  }

  // Test 6: Stats
  log("test", "\nTest 6: Stats (thống kê từ các bảng)");
  try {
    // Cần auth cho stats
    const res = await fetch(`${API_URL}/stats`, {
      headers: { Authorization: "Bearer test" },
    });
    const data = await res.json();

    if (data.success) {
      log("ok", "Stats:");
      log("info", `  - Providers: ${data.data.providers?.total || 0}`);
      log("info", `  - Models: ${data.data.models?.total || 0}`);
      log("info", `  - Chatbots: ${data.data.chatbots?.total || 0}`);
      log("info", `  - Tools: ${data.data.tools?.total || 0}`);
    } else {
      log("err", `Failed: ${data.error}`);
    }
  } catch (e) {
    log("err", e.message);
  }

  // Cleanup
  if (chatbotId) {
    log("test", "\nCleanup: Xóa chatbot test");
    try {
      await fetch(`${API_URL}/chatbots/${chatbotId}`, { method: "DELETE" });
      log("ok", `Deleted chatbot ${chatbotId}`);
    } catch {}
  }

  console.log("\n✅ Test completed!\n");
}

test().catch(console.error);
