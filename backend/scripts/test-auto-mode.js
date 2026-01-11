// Test Auto Mode
// Chạy: node scripts/test-auto-mode.js

const API_URL = process.env.API_URL || "http://localhost:4000";

async function testAutoMode() {
  console.log("🧪 Testing Auto Mode...\n");

  // Test 1: Chat với auto mode
  console.log("1️⃣ Test chat với provider=auto, model=auto");
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "auto",
        model: "auto",
        message: "Xin chào! Bạn là AI nào?",
        stream: false,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.log("❌ Error:", data.error);
    } else {
      console.log("✅ Response received!");
      console.log("   Provider:", data.provider);
      console.log("   Model:", data.model);
      if (data.auto_selected) {
        console.log("   Auto Selection Info:");
        console.log(
          "     - Original:",
          data.auto_selected.original_provider,
          "/",
          data.auto_selected.original_model
        );
        console.log(
          "     - Fallback count:",
          data.auto_selected.fallback_count
        );
      }
      console.log(
        "   Content:",
        data.choices?.[0]?.message?.content?.substring(0, 100) + "..."
      );
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }

  // Test 2: Stream với auto mode
  console.log("\n2️⃣ Test streaming với auto mode");
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "auto",
        model: "auto",
        message: "Kể một câu chuyện ngắn",
        stream: true,
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
            if (parsed.auto_selected) {
              autoInfo = parsed.auto_selected;
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
      console.log("   Auto Selection Info:");
      console.log("     - Fallback count:", autoInfo.fallback_count);
    }
    console.log("   Total length:", content.length, "chars");
  } catch (error) {
    console.log("❌ Error:", error.message);
  }

  console.log("\n✅ Auto mode tests completed!");
}

testAutoMode().catch(console.error);
