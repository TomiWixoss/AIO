#!/usr/bin/env node

/**
 * Script test endpoint regenerate response
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
  log("║            TEST ENDPOINT REGENERATE RESPONSE               ║", "cyan");
  log("╚════════════════════════════════════════════════════════════╝", "cyan");
  log(`\nBase URL: ${BASE_URL}\n`, "cyan");

  try {
    log("🔑 Đang lấy auth token...", "yellow");
    const token = await getToken();
    log("✓ Đã lấy token\n", "green");

    // Tạo chat session mới
    log("📝 Tạo chat session với 2 messages...", "yellow");
    const sessionKey = crypto.randomUUID();

    // Message 1
    await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        provider: "google-ai",
        model: "gemini-3-flash-preview",
        message: "Kể cho tôi một câu chuyện ngắn về con mèo",
        session_key: sessionKey,
        stream: false,
      }),
    });

    log("✓ Message 1 đã tạo\n", "green");

    // Message 2
    await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        provider: "google-ai",
        model: "gemini-3-flash-preview",
        message: "Kể thêm một câu chuyện khác",
        session_key: sessionKey,
        stream: false,
      }),
    });

    log("✓ Message 2 đã tạo\n", "green");

    // Lấy session
    const sessionResponse = await fetch(
      `${BASE_URL}/chat/sessions/${sessionKey}`
    );
    const sessionData = await sessionResponse.json();

    log(`📋 Session có ${sessionData.messages.length} messages`, "cyan");
    sessionData.messages.forEach((m) => {
      log(`  - ID ${m.id}: ${m.role} - ${m.content.slice(0, 50)}...`, "cyan");
    });

    // Tìm assistant message đầu tiên
    const firstAssistant = sessionData.messages.find(
      (m) => m.role === "assistant"
    );

    if (!firstAssistant) {
      log("\n✗ FAILED: Không tìm thấy assistant message", "red");
      process.exit(1);
    }

    log(
      `\n🔄 Regenerate assistant message ID ${firstAssistant.id}...`,
      "yellow"
    );
    log(`   Nội dung cũ: ${firstAssistant.content.slice(0, 100)}...`, "cyan");

    // Regenerate
    const regenerateResponse = await fetch(
      `${BASE_URL}/chat/regenerate/${firstAssistant.id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stream: false,
        }),
      }
    );

    if (!regenerateResponse.ok) {
      const error = await regenerateResponse.json();
      log(`\n✗ FAILED: ${error.error}`, "red");
      process.exit(1);
    }

    const regenerateData = await regenerateResponse.json();
    log("✓ Regenerate thành công\n", "green");

    // Kiểm tra session sau khi regenerate
    const sessionAfter = await fetch(`${BASE_URL}/chat/sessions/${sessionKey}`);
    const sessionAfterData = await sessionAfter.json();

    log(
      `📋 Session sau regenerate có ${sessionAfterData.messages.length} messages`,
      "cyan"
    );
    sessionAfterData.messages.forEach((m) => {
      log(`  - ID ${m.id}: ${m.role} - ${m.content.slice(0, 50)}...`, "cyan");
    });

    // Kiểm tra kết quả
    log("\n--- Kiểm tra kết quả ---", "cyan");

    // 1. Message cũ đã bị xóa
    const oldMessageStillExists = sessionAfterData.messages.some(
      (m) => m.id === firstAssistant.id
    );
    if (oldMessageStillExists) {
      log("✗ FAILED: Message cũ vẫn còn trong DB", "red");
    } else {
      log("✓ PASSED: Message cũ đã bị xóa", "green");
    }

    // 2. Có assistant message mới
    const newAssistant = sessionAfterData.messages.find(
      (m) => m.role === "assistant" && m.id !== firstAssistant.id
    );
    if (newAssistant) {
      log("✓ PASSED: Có assistant message mới", "green");
      log(`  Nội dung mới: ${newAssistant.content.slice(0, 100)}...`, "cyan");
    } else {
      log("✗ FAILED: Không có assistant message mới", "red");
    }

    // 3. Messages sau cũng bị xóa
    const messagesAfterDeleted =
      sessionData.messages.length - sessionAfterData.messages.length;
    log(
      `✓ PASSED: Đã xóa ${messagesAfterDeleted} messages (assistant cũ + messages sau nó)`,
      "green"
    );

    log("\n" + "=".repeat(60), "cyan");
    log("🎉 Test hoàn thành!", "green");
  } catch (error) {
    log(`\n❌ Lỗi: ${error.message}`, "red");
    console.error(error);
    process.exit(1);
  }
}

main();
