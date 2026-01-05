#!/usr/bin/env node

/**
 * Script test endpoint copy message
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

async function main() {
  console.clear();
  log("╔════════════════════════════════════════════════════════════╗", "cyan");
  log("║              TEST ENDPOINT COPY MESSAGE                    ║", "cyan");
  log("╚════════════════════════════════════════════════════════════╝", "cyan");
  log(`\nBase URL: ${BASE_URL}\n`, "cyan");

  try {
    log("🔑 Đang lấy auth token...", "yellow");
    const token = await getToken();
    log("✓ Đã lấy token\n", "green");

    // Tạo một chat session mới
    log("📝 Tạo chat session mới...", "yellow");
    const sessionKey = crypto.randomUUID();

    const chatResponse = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        provider: "google-ai",
        model: "gemini-3-flash-preview",
        message: "Xin chào! Bạn là ai?",
        session_key: sessionKey,
        stream: false,
      }),
    });

    const chatData = await chatResponse.json();
    log(`✓ Chat response nhận được\n`, "green");

    // Lấy session với messages
    log("📋 Lấy danh sách messages...", "yellow");
    const sessionResponse = await fetch(
      `${BASE_URL}/chat/sessions/${sessionKey}`
    );
    const sessionData = await sessionResponse.json();

    log(`✓ Session có ${sessionData.messages.length} messages\n`, "green");

    // Test copy từng message
    for (const msg of sessionData.messages) {
      log(`\n--- Message ID: ${msg.id} (${msg.role}) ---`, "cyan");

      const copyResponse = await fetch(`${BASE_URL}/chat/messages/${msg.id}`);
      const copyData = await copyResponse.json();

      if (copyResponse.ok) {
        log(`✓ PASSED: Lấy message thành công`, "green");
        log(`  Role: ${copyData.role}`, "cyan");
        log(`  Content: ${copyData.content.slice(0, 100)}...`, "cyan");
      } else {
        log(`✗ FAILED: ${copyData.error}`, "red");
      }
    }

    // Test message không tồn tại
    log(`\n--- Test message không tồn tại ---`, "cyan");
    const notFoundResponse = await fetch(`${BASE_URL}/chat/messages/999999`);
    const notFoundData = await notFoundResponse.json();

    if (notFoundResponse.status === 404) {
      log(`✓ PASSED: Trả về 404 cho message không tồn tại`, "green");
    } else {
      log(`✗ FAILED: Không trả về 404`, "red");
    }

    log("\n" + "=".repeat(60), "cyan");
    log("🎉 Test hoàn thành!", "green");
  } catch (error) {
    log(`\n❌ Lỗi: ${error.message}`, "red");
    console.error(error);
    process.exit(1);
  }
}

main();
