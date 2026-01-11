// Test Auto Mode - Chế độ tự động chọn model theo priority và fallback
// Chạy: node scripts/test-auto-mode.js

const API_URL = process.env.API_URL || "http://localhost:4000";

async function testAutoMode() {
  console.log("🧪 Testing Auto Mode...\n");
  console.log("Auto mode sẽ:");
  console.log("  1. Chọn provider có priority cao nhất");
  console.log("  2. Chọn model có priority cao nhất trong provider đó");
  console.log("  3. Nếu lỗi → fallback sang model tiếp theo");
  console.log(
    "  4. Nếu hết model trong provider → chuyển sang provider tiếp theo"
  );
  console.log("  5. Không giới hạn số lần fallback\n");

  // Test 1: Chat với auto_mode = true
  console.log("1️⃣ Test chat với auto_mode = true");
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "google-ai", // Provider mặc định (sẽ bị override nếu auto chọn khác)
        model: "gemini-2.0-flash", // Model mặc định
        message: "Xin chào! Bạn là AI nào? Trả lời ngắn gọn.",
        stream: false,
        auto_mode: true, // BẬT CHẾ ĐỘ AUTO
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.log("❌ Error:", data.error);
    } else {
      console.log("✅ Response received!");
      console.log("   Provider:", data.provider);
      console.log("   Model:", data.model);

      if (data.auto_fallback) {
        console.log("   🔄 Auto Fallback Info:");
        console.log(
          "     - Original:",
          data.auto_fallback.original_provider,
          "/",
          data.auto_fallback.original_model
        );
        console.log(
          "     - Final:",
          data.auto_fallback.final_provider,
          "/",
          data.auto_fallback.final_model
        );
        console.log(
          "     - Fallback count:",
          data.auto_fallback.fallback_count
        );
      } else {
        console.log("   ✨ Không cần fallback - model đầu tiên hoạt động tốt");
      }

      console.log(
        "   Content:",
        data.choices?.[0]?.message?.content?.substring(0, 100) + "..."
      );
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }

  // Test 2: Stream với auto_mode = true
  console.log("\n2️⃣ Test streaming với auto_mode = true");
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "google-ai",
        model: "gemini-2.0-flash",
        message: "Kể một câu chuyện ngắn 2 câu",
        stream: true,
        auto_mode: true,
      }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let content = "";
    let autoInfo = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.auto_fallback) {
              autoInfo = parsed.auto_fallback;
            }
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              content += delta;
              process.stdout.write(delta);
            }
          } catch {}
        }
      }
    }

    console.log("\n\n✅ Stream completed!");
    if (autoInfo) {
      console.log("   🔄 Auto Fallback Info:");
      console.log("     - Fallback count:", autoInfo.fallback_count);
    }
    console.log("   Total length:", content.length, "chars");
  } catch (error) {
    console.log("❌ Error:", error.message);
  }

  // Test 3: So sánh với auto_mode = false
  console.log("\n3️⃣ Test chat với auto_mode = false (chế độ thường)");
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "google-ai",
        model: "gemini-2.0-flash",
        message: "Xin chào!",
        stream: false,
        auto_mode: false, // TẮT CHẾ ĐỘ AUTO
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.log("❌ Error:", data.error);
    } else {
      console.log("✅ Response received!");
      console.log("   Provider:", data.provider);
      console.log("   Model:", data.model);
      console.log(
        "   auto_fallback:",
        data.auto_fallback ? "có" : "không (như mong đợi)"
      );
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }

  console.log("\n✅ Auto mode tests completed!");
}

testAutoMode().catch(console.error);
