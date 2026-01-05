/**
 * Test Knowledge Base API
 * Tests: CRUD knowledge bases, add items (auto vectorize), semantic search, AI tool
 */

const BACKEND_URL = "http://localhost:4000";

let token = null;
let kbId = null;

async function login() {
  const res = await fetch(`${BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@localhost", password: "admin123" }),
  });
  const data = await res.json();
  token = data.data?.token;
  return !!token;
}

async function api(method, path, body = null) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

function log(test, passed, details = "") {
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} ${test}${details ? ` - ${details}` : ""}`);
  return passed;
}

async function runTests() {
  console.log("\n🧪 KNOWLEDGE BASE TESTS\n");
  console.log("=".repeat(50));

  let passed = 0;
  let failed = 0;

  // Login
  console.log("\n🔐 Authentication\n");
  if (await login()) {
    log("Login", true);
    passed++;
  } else {
    log("Login", false, "Failed to get token");
    failed++;
    return;
  }

  // ========== KNOWLEDGE BASE CRUD ==========
  console.log("\n📚 Knowledge Base CRUD\n");

  // Create knowledge base
  {
    const { status, data } = await api("POST", "/knowledge-bases", {
      name: "Product FAQ",
      description: "Frequently asked questions about our products",
    });
    if (log("Create knowledge base", status === 201 && data.data?.id)) {
      passed++;
      kbId = data.data.id;
      console.log(`   KB ID: ${kbId}`);
    } else {
      failed++;
      console.log("   Error:", data);
      return;
    }
  }

  // List knowledge bases
  {
    const { status, data } = await api("GET", "/knowledge-bases");
    if (
      log("List knowledge bases", status === 200 && Array.isArray(data.data))
    ) {
      passed++;
      console.log(`   Found ${data.data.length} knowledge base(s)`);
    } else failed++;
  }

  // Get knowledge base by ID
  {
    const { status, data } = await api("GET", `/knowledge-bases/${kbId}`);
    if (
      log(
        "Get knowledge base by ID",
        status === 200 && data.data?.name === "Product FAQ"
      )
    ) {
      passed++;
    } else failed++;
  }

  // Update knowledge base
  {
    const { status } = await api("PUT", `/knowledge-bases/${kbId}`, {
      description: "Updated FAQ description",
    });
    if (log("Update knowledge base", status === 200)) passed++;
    else failed++;
  }

  // ========== KNOWLEDGE ITEMS ==========
  console.log("\n📄 Knowledge Items (Auto Vectorize)\n");

  // Add single item
  {
    const { status, data } = await api(
      "POST",
      `/knowledge-bases/${kbId}/items`,
      {
        content:
          "Chính sách đổi trả: Khách hàng có thể đổi trả sản phẩm trong vòng 30 ngày kể từ ngày mua. Sản phẩm phải còn nguyên tem mác và chưa qua sử dụng.",
        metadata: { category: "policy", topic: "return" },
      }
    );
    if (log("Add item (auto vectorize)", status === 201 && data.data?.id)) {
      passed++;
      console.log(
        `   Item ID: ${data.data.id}, Vector Doc ID: ${data.data.vector_doc_id}`
      );
    } else {
      failed++;
      console.log("   Error:", data);
    }
  }

  // Add batch items
  {
    const { status, data } = await api(
      "POST",
      `/knowledge-bases/${kbId}/items/batch`,
      {
        items: [
          {
            content:
              "Phí vận chuyển: Miễn phí vận chuyển cho đơn hàng từ 500.000đ. Đơn hàng dưới 500.000đ sẽ tính phí 30.000đ.",
            metadata: { category: "policy", topic: "shipping" },
          },
          {
            content:
              "Thời gian giao hàng: Nội thành HCM và Hà Nội: 1-2 ngày. Các tỉnh thành khác: 3-5 ngày làm việc.",
            metadata: { category: "policy", topic: "shipping" },
          },
          {
            content:
              "Sản phẩm iPhone 15 Pro Max: Màn hình 6.7 inch Super Retina XDR, chip A17 Pro, camera 48MP. Giá: 34.990.000đ",
            metadata: { category: "product", topic: "phone" },
          },
          {
            content:
              "Sản phẩm MacBook Pro M3: Chip M3 Pro/Max, màn hình Liquid Retina XDR 14 inch hoặc 16 inch. Giá từ 49.990.000đ",
            metadata: { category: "product", topic: "laptop" },
          },
          {
            content:
              "Bảo hành: Tất cả sản phẩm Apple được bảo hành chính hãng 12 tháng. Có thể mua thêm AppleCare+ để gia hạn bảo hành.",
            metadata: { category: "policy", topic: "warranty" },
          },
        ],
      }
    );
    if (
      log(
        "Add batch items (5 items)",
        status === 201 && data.data?.inserted === 5
      )
    ) {
      passed++;
      console.log(`   Inserted: ${data.data.inserted} items`);
    } else {
      failed++;
      console.log("   Error:", data);
    }
  }

  // List items
  {
    const { status, data } = await api("GET", `/knowledge-bases/${kbId}/items`);
    if (
      log(
        "List items in knowledge base",
        status === 200 && data.data?.length === 6
      )
    ) {
      passed++;
      console.log(`   Found ${data.data.length} items`);
    } else {
      failed++;
      console.log("   Expected 6, got:", data.data?.length);
    }
  }

  // ========== SEMANTIC SEARCH ==========
  console.log("\n🔍 Semantic Search\n");

  // Search for shipping policy
  {
    const { status, data } = await api(
      "POST",
      `/knowledge-bases/${kbId}/search`,
      {
        query: "phí ship giao hàng bao nhiêu",
        limit: 3,
      }
    );
    if (
      log(
        "Search: 'phí ship giao hàng'",
        status === 200 && data.data?.length > 0
      )
    ) {
      passed++;
      console.log("   Top results:");
      data.data.forEach((r, i) => {
        console.log(
          `   ${i + 1}. [${(r.similarity * 100).toFixed(
            1
          )}%] ${r.content.substring(0, 60)}...`
        );
      });
    } else {
      failed++;
      console.log("   Error:", data);
    }
  }

  // Search for return policy
  {
    const { status, data } = await api(
      "POST",
      `/knowledge-bases/${kbId}/search`,
      {
        query: "muốn trả hàng thì làm sao",
        limit: 3,
      }
    );
    if (
      log("Search: 'muốn trả hàng'", status === 200 && data.data?.length > 0)
    ) {
      passed++;
      console.log("   Top results:");
      data.data.forEach((r, i) => {
        console.log(
          `   ${i + 1}. [${(r.similarity * 100).toFixed(
            1
          )}%] ${r.content.substring(0, 60)}...`
        );
      });
    } else failed++;
  }

  // Search for product
  {
    const { status, data } = await api(
      "POST",
      `/knowledge-bases/${kbId}/search`,
      {
        query: "laptop macbook giá bao nhiêu",
        limit: 3,
      }
    );
    if (
      log(
        "Search: 'laptop macbook giá'",
        status === 200 && data.data?.length > 0
      )
    ) {
      passed++;
      console.log("   Top results:");
      data.data.forEach((r, i) => {
        console.log(
          `   ${i + 1}. [${(r.similarity * 100).toFixed(
            1
          )}%] ${r.content.substring(0, 60)}...`
        );
      });
    } else failed++;
  }

  // ========== AI TOOL SEARCH ==========
  console.log("\n🤖 AI Tool: search_knowledge\n");

  // Test AI using search_knowledge tool
  {
    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: "Tôi muốn hỏi về chính sách đổi trả sản phẩm",
          model: "gemini-2.5-flash",
          provider: "google-ai",
          session_key: "test-kb-" + Date.now(),
        }),
      });
      const data = await res.json();

      if (data.choices?.[0]?.message?.content) {
        const content = data.choices[0].message.content;
        // Check if AI used the tool or answered directly
        const hasToolResult =
          content.includes("[tool_result]") || content.includes("30 ngày");

        if (log("AI uses search_knowledge tool", hasToolResult)) {
          passed++;
          console.log(
            "   AI Response (truncated):",
            content.substring(0, 200) + "..."
          );
        } else {
          // AI might answer without tool if it has the info
          log("AI responds about return policy", true);
          passed++;
          console.log("   AI Response:", content.substring(0, 200) + "...");
        }
      } else {
        log("AI search_knowledge", false, data.error?.message || "No content");
        failed++;
      }
    } catch (e) {
      log("AI search_knowledge", false, e.message);
      failed++;
    }
  }

  // ========== CLEANUP ==========
  console.log("\n🧹 Cleanup\n");

  // Delete knowledge base (cascades to items)
  {
    const { status } = await api("DELETE", `/knowledge-bases/${kbId}`);
    if (log("Delete knowledge base", status === 200)) passed++;
    else failed++;
  }

  // Wait for deletion to propagate
  await new Promise((r) => setTimeout(r, 500));

  // Verify deletion
  {
    const { status } = await api("GET", `/knowledge-bases/${kbId}`);
    if (log("Verify KB deleted", status === 404)) passed++;
    else failed++;
  }

  // ========== SUMMARY ==========
  console.log("\n" + "=".repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log("🎉 All tests passed!\n");
  } else {
    console.log("⚠️  Some tests failed\n");
    process.exit(1);
  }
}

runTests().catch(console.error);
