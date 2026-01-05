#!/usr/bin/env node

/**
 * Script test tính năng cancel cho streaming và non-streaming
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

async function cancelRequest(sessionKey) {
  const response = await fetch(`${BASE_URL}/chat/cancel/${sessionKey}`, {
    method: "POST",
  });
  return await response.json();
}

async function getSession(sessionKey) {
  const response = await fetch(`${BASE_URL}/chat/sessions/${sessionKey}`);
  if (!response.ok) return null;
  return await response.json();
}

async function getActiveRequests() {
  const response = await fetch(`${BASE_URL}/chat/streams/active`);
  return await response.json();
}

// Test 1: Cancel streaming request sau 2 giây
async function testCancelStreaming(token) {
  log("\n=== TEST 1: Hủy Request Streaming ===", "cyan");
  const sessionKey = crypto.randomUUID();

  try {
    // Start streaming request
    log("Đang bắt đầu streaming request...", "yellow");
    const streamPromise = fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        provider: "google-ai",
        model: "gemini-3-flash-preview",
        message:
          "Viết một câu chuyện rất rất dài về một con rồng tên là Smaug. Kể chi tiết về cuộc đời của nó từ khi sinh ra, lớn lên, học bay, học phun lửa, tìm hang ổ, thu thập kho báu, chiến đấu với các hiệp sĩ. Viết ít nhất 1000 từ, càng dài càng tốt. Hãy viết thật chi tiết và sinh động.",
        session_key: sessionKey,
        stream: true,
      }),
    });

    // Wait 8 seconds then cancel (Gemini chậm, cần thời gian)
    await new Promise((resolve) => setTimeout(resolve, 8000));
    log("Đang hủy sau 8 giây...", "yellow");

    const cancelResult = await cancelRequest(sessionKey);
    log(`Kết quả hủy: ${JSON.stringify(cancelResult)}`, "green");

    // Wait for stream to finish
    await streamPromise;

    // Check if partial content was saved
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const session = await getSession(sessionKey);

    if (session && session.messages) {
      const assistantMsg = session.messages.find((m) => m.role === "assistant");
      if (assistantMsg) {
        log(
          `✓ PASSED: Đã lưu nội dung một phần (${assistantMsg.content.length} ký tự)`,
          "green"
        );
        log(
          `Xem trước nội dung: ${assistantMsg.content.slice(0, 100)}...`,
          "cyan"
        );
        return true;
      } else {
        log("✗ FAILED: Không có tin nhắn assistant được lưu", "red");
        return false;
      }
    } else {
      log("✗ FAILED: Không thể lấy session", "red");
      return false;
    }
  } catch (error) {
    log(`✗ FAILED: ${error.message}`, "red");
    return false;
  }
}

// Test 2: Cancel non-streaming request
async function testCancelNonStreaming(token) {
  log("\n=== TEST 2: Hủy Request Không Streaming ===", "cyan");
  const sessionKey = crypto.randomUUID();

  try {
    // Start non-streaming request
    log("Đang bắt đầu non-streaming request...", "yellow");
    const requestPromise = fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        provider: "google-ai",
        model: "gemini-3-flash-preview",
        message:
          "Viết một bài luận rất dài về lịch sử phát triển của trí tuệ nhân tạo từ những năm 1950 đến nay, bao gồm tất cả các mốc quan trọng, các nhà khoa học tiên phong, các đột phá công nghệ. Viết ít nhất 1000 từ.",
        session_key: sessionKey,
        stream: false,
      }),
    });

    // Wait 3 seconds then cancel (tăng lên để có nhiều content hơn)
    await new Promise((resolve) => setTimeout(resolve, 3000));
    log("Đang hủy sau 3 giây...", "yellow");

    const cancelResult = await cancelRequest(sessionKey);
    log(`Kết quả hủy: ${JSON.stringify(cancelResult)}`, "green");

    // Wait for request to finish
    const response = await requestPromise;
    const data = await response.json();

    if (response.status === 499 && data.cancelled) {
      log("✓ PASSED: Non-streaming request đã hủy thành công", "green");
      return true;
    } else {
      log("✗ FAILED: Request không được hủy đúng cách", "red");
      return false;
    }
  } catch (error) {
    log(`✗ FAILED: ${error.message}`, "red");
    return false;
  }
}

// Test 3: Complete streaming without cancel
async function testCompleteStreaming(token) {
  log("\n=== TEST 3: Hoàn Thành Streaming (Không Hủy) ===", "cyan");
  const sessionKey = crypto.randomUUID();

  try {
    log("Đang bắt đầu streaming request...", "yellow");
    const response = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        provider: "google-ai",
        model: "gemini-3-flash-preview",
        message: "Chào bằng 5 từ tiếng Việt",
        session_key: sessionKey,
        stream: true,
      }),
    });

    // Read full stream
    await response.text();
    log("Stream đã hoàn thành", "green");

    // Check if full content was saved
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const session = await getSession(sessionKey);

    if (session && session.messages) {
      const assistantMsg = session.messages.find((m) => m.role === "assistant");
      if (assistantMsg && !assistantMsg.content.includes("[cancelled]")) {
        log(
          "✓ PASSED: Nội dung đầy đủ đã lưu không có dấu [cancelled]",
          "green"
        );
        log(`Nội dung: ${assistantMsg.content}`, "cyan");
        return true;
      } else {
        log("✗ FAILED: Nội dung không được lưu đúng", "red");
        return false;
      }
    } else {
      log("✗ FAILED: Không thể lấy session", "red");
      return false;
    }
  } catch (error) {
    log(`✗ FAILED: ${error.message}`, "red");
    return false;
  }
}

// Test 4: Check active requests tracking
async function testActiveRequestsTracking(token) {
  log("\n=== TEST 4: Theo Dõi Các Request Đang Hoạt Động ===", "cyan");
  const sessionKey1 = crypto.randomUUID();
  const sessionKey2 = crypto.randomUUID();

  try {
    // Start 2 streaming requests
    log("Đang bắt đầu 2 streaming requests...", "yellow");

    const stream1 = fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        provider: "google-ai",
        model: "gemini-3-flash-preview",
        message: "Đếm từ 1 đến 500 và giải thích ý nghĩa của từng con số",
        session_key: sessionKey1,
        stream: true,
      }),
    });

    // Delay để đảm bảo request 1 đã được register
    await new Promise((resolve) => setTimeout(resolve, 500));

    const stream2 = fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        provider: "google-ai",
        model: "gemini-3-flash-preview",
        message: "Viết một bài thơ dài 100 câu về thiên nhiên Việt Nam",
        session_key: sessionKey2,
        stream: true,
      }),
    });

    // Wait a bit then check active requests (Gemini cần thời gian khởi động)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const activeRequests = await getActiveRequests();
    log(
      `Các request đang hoạt động: ${JSON.stringify(activeRequests, null, 2)}`,
      "cyan"
    );

    if (activeRequests.count >= 2) {
      log("✓ PASSED: Nhiều request đang hoạt động được theo dõi", "green");

      // Cancel both
      await cancelRequest(sessionKey1);
      await cancelRequest(sessionKey2);

      // Wait for cleanup
      await Promise.all([stream1, stream2]);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const afterCancel = await getActiveRequests();
      log(`Sau khi hủy: ${afterCancel.count} request đang hoạt động`, "cyan");

      return true;
    } else {
      log(
        `✗ FAILED: Chỉ theo dõi được ${activeRequests.count}/2 requests`,
        "red"
      );
      return false;
    }
  } catch (error) {
    log(`✗ FAILED: ${error.message}`, "red");
    return false;
  }
}

// Test 5: Cancel immediately (before any content)
async function testCancelImmediately(token) {
  log("\n=== TEST 5: Hủy Ngay Lập Tức ===", "cyan");
  const sessionKey = crypto.randomUUID();

  try {
    log("Đang bắt đầu streaming request...", "yellow");
    const streamPromise = fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        provider: "google-ai",
        model: "gemini-3-flash-preview",
        message: "Viết một câu chuyện rất dài",
        session_key: sessionKey,
        stream: true,
      }),
    });

    // Cancel immediately (nhưng đợi 500ms cho Gemini khởi động)
    await new Promise((resolve) => setTimeout(resolve, 500));
    log("Đang hủy ngay lập tức...", "yellow");

    const cancelResult = await cancelRequest(sessionKey);
    log(`Kết quả hủy: ${JSON.stringify(cancelResult)}`, "green");

    await streamPromise;

    // Check session
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const session = await getSession(sessionKey);

    if (session && session.messages) {
      const userMsg = session.messages.find((m) => m.role === "user");
      const assistantMsg = session.messages.find((m) => m.role === "assistant");

      if (userMsg && assistantMsg) {
        log(
          `✓ PASSED: Tin nhắn user đã lưu, tin nhắn assistant: "${assistantMsg.content}"`,
          "green"
        );
        return true;
      } else if (userMsg && !assistantMsg) {
        log("✓ PASSED: Chỉ lưu tin nhắn user (hủy quá sớm)", "green");
        return true;
      } else {
        log("✗ FAILED: Tin nhắn không được lưu đúng", "red");
        return false;
      }
    } else {
      log("✗ FAILED: Không thể lấy session", "red");
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
  log("║          BỘ TEST TÍNH NĂNG HỦY REQUEST                     ║", "cyan");
  log("╚════════════════════════════════════════════════════════════╝", "cyan");
  log(`\nBase URL: ${BASE_URL}\n`, "cyan");

  const startTime = Date.now();
  const results = [];

  try {
    log("🔑 Đang lấy auth token...", "yellow");
    const token = await getToken();
    log("✓ Đã lấy token\n", "green");

    // Run all tests
    results.push(await testCancelStreaming(token));
    await new Promise((resolve) => setTimeout(resolve, 2000));

    results.push(await testCancelNonStreaming(token));
    await new Promise((resolve) => setTimeout(resolve, 2000));

    results.push(await testCompleteStreaming(token));
    await new Promise((resolve) => setTimeout(resolve, 2000));

    results.push(await testActiveRequestsTracking(token));
    await new Promise((resolve) => setTimeout(resolve, 2000));

    results.push(await testCancelImmediately(token));
  } catch (error) {
    log(`\n❌ Lỗi nghiêm trọng: ${error.message}`, "red");
    console.error(error);
    process.exit(1);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const passed = results.filter((r) => r).length;
  const failed = results.filter((r) => !r).length;

  log("\n" + "=".repeat(60), "cyan");
  log("TỔNG KẾT", "cyan");
  log("=".repeat(60), "cyan");
  log(`\nTổng số test: ${results.length}`, "cyan");
  log(`Thành công: ${passed}`, "green");
  log(`Thất bại: ${failed}`, failed > 0 ? "red" : "green");
  log(`Thời gian: ${duration}s`, "cyan");

  if (failed === 0) {
    log("\n🎉 Tất cả test đều pass!", "green");
    process.exit(0);
  } else {
    log("\n❌ Một số test thất bại!", "red");
    process.exit(1);
  }
}

main();
