// Test toàn diện Auto Mode và Chatbot Builder
// Chạy: node scripts/test-all-features.js

const API_URL = process.env.API_URL || "http://localhost:4000";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function log(type, msg) {
  const icons = { ok: "✅", err: "❌", info: "ℹ️", test: "🧪", warn: "⚠️" };
  console.log(`${icons[type] || "•"} ${msg}`);
}

async function testAutoMode() {
  console.log("\n" + colors.bold + "═══════════════════════════════════════");
  console.log("       TEST AUTO MODE");
  console.log("═══════════════════════════════════════" + colors.reset + "\n");

  // Test 1: Chat với auto_mode = true
  log("test", "Test 1: Chat với auto_mode = true");
  try {
    const res = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "google-ai",
        model: "gemini-2.0-flash",
        message: "Xin chào! Bạn là AI nào? Trả lời 1 câu.",
        stream: false,
        auto_mode: true,
      }),
    });
    const data = await res.json();

    if (data.error) {
      log("err", `Error: ${data.error}`);
    } else {
      log("ok", `Provider: ${data.provider}, Model: ${data.model}`);
      if (data.auto_fallback) {
        log("info", `Fallback: ${data.auto_fallback.fallback_count} lần`);
      }
      log(
        "ok",
        `Response: ${data.choices?.[0]?.message?.content?.substring(0, 80)}...`
      );
    }
  } catch (e) {
    log("err", e.message);
  }

  // Test 2: Stream với auto_mode
  log("test", "\nTest 2: Stream với auto_mode = true");
  try {
    const res = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "google-ai",
        model: "gemini-2.0-flash",
        message: "Đếm từ 1 đến 5",
        stream: true,
        auto_mode: true,
      }),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let content = "";

    process.stdout.write("   Response: ");
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      for (const line of chunk.split("\n")) {
        if (line.startsWith("data: ") && !line.includes("[DONE]")) {
          try {
            const parsed = JSON.parse(line.slice(6));
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              content += delta;
              process.stdout.write(delta);
            }
          } catch {}
        }
      }
    }
    console.log();
    log("ok", `Stream completed (${content.length} chars)`);
  } catch (e) {
    log("err", e.message);
  }

  return true;
}

async function testChatbotBuilder() {
  console.log("\n" + colors.bold + "═══════════════════════════════════════");
  console.log("       TEST CHATBOT BUILDER");
  console.log("═══════════════════════════════════════" + colors.reset + "\n");

  let chatbotId = null;
  let chatbotSlug = "test-bot-" + Date.now();
  let apiKey = null;

  // Test 1: Tạo chatbot mới
  log("test", "Test 1: Tạo chatbot mới");
  try {
    const res = await fetch(`${API_URL}/chatbots`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token", // Mock auth
      },
      body: JSON.stringify({
        name: "Test Bot",
        slug: chatbotSlug,
        description: "Bot để test",
        auto_mode: true,
        system_prompt: "Bạn là trợ lý AI thân thiện. Trả lời ngắn gọn.",
        temperature: 0.7,
        max_tokens: 1024,
        welcome_message: "Xin chào! Tôi có thể giúp gì?",
        is_public: true,
      }),
    });
    const data = await res.json();

    if (data.success && data.data) {
      chatbotId = data.data.id;
      apiKey = data.data.api_key;
      log("ok", `Chatbot created: ID=${chatbotId}, slug=${chatbotSlug}`);
      log("info", `API Key: ${apiKey?.substring(0, 20)}...`);
    } else {
      log("err", `Failed: ${JSON.stringify(data)}`);
    }
  } catch (e) {
    log("err", e.message);
  }

  // Test 2: Lấy danh sách chatbots
  log("test", "\nTest 2: Lấy danh sách chatbots");
  try {
    const res = await fetch(`${API_URL}/chatbots`, {
      headers: { Authorization: "Bearer test-token" },
    });
    const data = await res.json();

    if (data.success) {
      log("ok", `Found ${data.data?.length || 0} chatbots`);
    } else {
      log("err", `Failed: ${data.error}`);
    }
  } catch (e) {
    log("err", e.message);
  }

  // Test 3: Lấy config chatbot public
  log("test", "\nTest 3: Lấy config chatbot public");
  try {
    const res = await fetch(`${API_URL}/chatbots/public/${chatbotSlug}`);
    const data = await res.json();

    if (data.success) {
      log(
        "ok",
        `Public config: name=${data.data?.name}, auto_mode=${data.data?.auto_mode}`
      );
    } else {
      log("err", `Failed: ${data.error}`);
    }
  } catch (e) {
    log("err", e.message);
  }

  // Test 4: Chat với chatbot public
  log("test", "\nTest 4: Chat với chatbot public (auto_mode)");
  try {
    const res = await fetch(`${API_URL}/chatbots/public/${chatbotSlug}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Xin chào! Bạn là ai?",
        stream: false,
      }),
    });
    const data = await res.json();

    if (data.choices) {
      log(
        "ok",
        `Response: ${data.choices[0]?.message?.content?.substring(0, 80)}...`
      );
      if (data.auto_fallback) {
        log("info", `Auto fallback: ${data.auto_fallback.fallback_count} lần`);
      }
    } else {
      log("err", `Failed: ${JSON.stringify(data)}`);
    }
  } catch (e) {
    log("err", e.message);
  }

  // Test 5: Stream chat với chatbot
  log("test", "\nTest 5: Stream chat với chatbot");
  try {
    const res = await fetch(`${API_URL}/chatbots/public/${chatbotSlug}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Đếm 1 2 3",
        stream: true,
      }),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let content = "";

    process.stdout.write("   Response: ");
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      for (const line of chunk.split("\n")) {
        if (line.startsWith("data: ") && !line.includes("[DONE]")) {
          try {
            const parsed = JSON.parse(line.slice(6));
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              content += delta;
              process.stdout.write(delta);
            }
          } catch {}
        }
      }
    }
    console.log();
    log("ok", `Stream completed (${content.length} chars)`);
  } catch (e) {
    log("err", e.message);
  }

  // Test 6: Export code
  if (chatbotId) {
    log("test", "\nTest 6: Export code");
    try {
      const res = await fetch(`${API_URL}/chatbots/${chatbotId}/export-code`, {
        headers: { Authorization: "Bearer test-token" },
      });
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

  // Test 7: Tạo chatbot private và test API key
  log("test", "\nTest 7: Tạo chatbot private với API key");
  const privateSlug = "private-bot-" + Date.now();
  let privateApiKey = null;

  try {
    const res = await fetch(`${API_URL}/chatbots`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({
        name: "Private Bot",
        slug: privateSlug,
        auto_mode: false,
        provider_id: 1, // Giả sử provider ID 1 tồn tại
        model_id: 1, // Giả sử model ID 1 tồn tại
        is_public: false,
      }),
    });
    const data = await res.json();

    if (data.success && data.data) {
      privateApiKey = data.data.api_key;
      log("ok", `Private chatbot created: ${privateSlug}`);

      // Test chat không có API key (phải fail)
      const res2 = await fetch(
        `${API_URL}/chatbots/public/${privateSlug}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "Test" }),
        }
      );
      const data2 = await res2.json();

      if (data2.error) {
        log("ok", `Correctly rejected without API key: ${data2.error}`);
      } else {
        log("warn", "Should have rejected without API key");
      }

      // Test chat với API key
      const res3 = await fetch(
        `${API_URL}/chatbots/public/${privateSlug}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": privateApiKey,
          },
          body: JSON.stringify({ message: "Test với API key" }),
        }
      );
      const data3 = await res3.json();

      if (data3.choices || data3.error?.includes("No active API key")) {
        log("ok", "API key authentication works");
      } else {
        log("warn", `Unexpected response: ${JSON.stringify(data3)}`);
      }
    }
  } catch (e) {
    log("err", e.message);
  }

  // Cleanup: Xóa chatbots test
  log("test", "\nCleanup: Xóa chatbots test");
  if (chatbotId) {
    try {
      await fetch(`${API_URL}/chatbots/${chatbotId}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer test-token" },
      });
      log("ok", `Deleted chatbot ${chatbotId}`);
    } catch {}
  }

  return true;
}

async function main() {
  console.log(colors.bold + colors.cyan);
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║     TEST TOÀN DIỆN: AUTO MODE & CHATBOT BUILDER          ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");
  console.log(colors.reset);

  await testAutoMode();
  await testChatbotBuilder();

  console.log("\n" + colors.bold + colors.green);
  console.log("═══════════════════════════════════════");
  console.log("       TEST HOÀN TẤT!");
  console.log("═══════════════════════════════════════");
  console.log(colors.reset);
}

main().catch(console.error);
