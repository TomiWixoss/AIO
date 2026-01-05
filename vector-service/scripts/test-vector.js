/**
 * Test script for Vector Service
 * Tests: Collections CRUD, Documents CRUD, Embedding generation, Semantic search
 */

const VECTOR_URL = "http://localhost:6100";

async function request(method, path, body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${VECTOR_URL}${path}`, options);
  const data = await res.json();
  return { status: res.status, data };
}

function log(test, passed, details = "") {
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} ${test}${details ? ` - ${details}` : ""}`);
  return passed;
}

async function runTests() {
  console.log("\n🧪 VECTOR SERVICE TESTS\n");
  console.log("=".repeat(50));

  let passed = 0;
  let failed = 0;
  let collectionId = null;
  let docIds = [];

  // ========== HEALTH CHECK ==========
  console.log("\n📡 Health Check\n");

  try {
    const { status, data } = await request("GET", "/health");
    if (log("Health check", status === 200, data.message)) passed++;
    else failed++;
  } catch (e) {
    log("Health check", false, e.message);
    failed++;
    console.log("\n❌ Vector service not running! Start it first.");
    return;
  }

  // ========== COLLECTIONS ==========
  console.log("\n📁 Collections CRUD\n");

  // Create collection
  {
    const { status, data } = await request("POST", "/collections", {
      name: "test-knowledge-base",
      description: "Test collection for RAG",
    });
    if (log("Create collection", status === 201 && data.data?.id)) {
      passed++;
      collectionId = data.data.id;
      console.log(`   Collection ID: ${collectionId}`);
    } else {
      failed++;
      console.log("   Error:", data);
    }
  }

  // List collections
  {
    const { status, data } = await request("GET", "/collections");
    if (log("List collections", status === 200 && Array.isArray(data.data))) {
      passed++;
      console.log(`   Found ${data.data.length} collection(s)`);
    } else failed++;
  }

  // Get collection by ID
  if (collectionId) {
    const { status, data } = await request(
      "GET",
      `/collections/${collectionId}`
    );
    if (
      log(
        "Get collection by ID",
        status === 200 && data.data?.name === "test-knowledge-base"
      )
    ) {
      passed++;
    } else failed++;
  }

  // Update collection
  if (collectionId) {
    const { status, data } = await request(
      "PUT",
      `/collections/${collectionId}`,
      {
        description: "Updated description",
      }
    );
    if (log("Update collection", status === 200)) passed++;
    else failed++;
  }

  // ========== DOCUMENTS ==========
  console.log("\n📄 Documents CRUD + Embedding\n");

  // Add single document
  if (collectionId) {
    const { status, data } = await request("POST", "/documents", {
      collection_id: collectionId,
      content:
        "TypeScript là ngôn ngữ lập trình được phát triển bởi Microsoft, là superset của JavaScript với static typing.",
      metadata: { source: "wiki", topic: "programming" },
    });
    if (
      log("Add document (generates embedding)", status === 201 && data.data?.id)
    ) {
      passed++;
      docIds.push(data.data.id);
      console.log(`   Document ID: ${data.data.id}`);
    } else {
      failed++;
      console.log("   Error:", data);
    }
  }

  // Add batch documents
  if (collectionId) {
    const { status, data } = await request("POST", "/documents/batch", {
      collection_id: collectionId,
      documents: [
        {
          content:
            "Python là ngôn ngữ lập trình đa năng, dễ học, phổ biến trong AI và Data Science.",
          metadata: { source: "wiki", topic: "programming" },
        },
        {
          content:
            "JavaScript là ngôn ngữ lập trình chạy trên trình duyệt, được dùng để tạo web động.",
          metadata: { source: "wiki", topic: "programming" },
        },
        {
          content:
            "Cà phê Việt Nam nổi tiếng với hương vị đậm đà, đặc biệt là cà phê sữa đá.",
          metadata: { source: "wiki", topic: "food" },
        },
        {
          content:
            "Machine Learning là một nhánh của AI, cho phép máy tính học từ dữ liệu.",
          metadata: { source: "wiki", topic: "ai" },
        },
      ],
    });
    if (
      log(
        "Add batch documents (4 docs)",
        status === 201 && data.data?.inserted === 4
      )
    ) {
      passed++;
      docIds.push(...data.data.ids);
      console.log(`   Inserted: ${data.data.inserted} documents`);
    } else {
      failed++;
      console.log("   Error:", data);
    }
  }

  // List documents in collection
  if (collectionId) {
    const { status, data } = await request(
      "GET",
      `/documents/collection/${collectionId}`
    );
    if (
      log(
        "List documents in collection",
        status === 200 && data.data?.length === 5
      )
    ) {
      passed++;
      console.log(`   Found ${data.data.length} documents`);
    } else {
      failed++;
      console.log("   Expected 5, got:", data.data?.length);
    }
  }

  // Get document by ID
  if (docIds.length > 0) {
    const { status, data } = await request("GET", `/documents/${docIds[0]}`);
    if (log("Get document by ID", status === 200 && data.data?.content)) {
      passed++;
    } else failed++;
  }

  // ========== SEMANTIC SEARCH ==========
  console.log("\n🔍 Semantic Search\n");

  // Search for programming languages
  if (collectionId) {
    const { status, data } = await request("POST", "/documents/search", {
      collection_id: collectionId,
      query: "ngôn ngữ lập trình web frontend",
      limit: 3,
    });
    if (
      log(
        "Search: 'ngôn ngữ lập trình web frontend'",
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

  // Search for AI/ML
  if (collectionId) {
    const { status, data } = await request("POST", "/documents/search", {
      collection_id: collectionId,
      query: "trí tuệ nhân tạo học máy",
      limit: 3,
    });
    if (
      log(
        "Search: 'trí tuệ nhân tạo học máy'",
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

  // Search for unrelated topic (coffee)
  if (collectionId) {
    const { status, data } = await request("POST", "/documents/search", {
      collection_id: collectionId,
      query: "đồ uống Việt Nam",
      limit: 3,
    });
    if (log("Search: 'đồ uống Việt Nam'", status === 200)) {
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

  // ========== CLEANUP ==========
  console.log("\n🧹 Cleanup\n");

  // Delete a document
  if (docIds.length > 0) {
    const { status } = await request("DELETE", `/documents/${docIds[0]}`);
    if (log("Delete document", status === 200)) passed++;
    else failed++;
  }

  // Delete collection (cascades to documents)
  if (collectionId) {
    const { status } = await request("DELETE", `/collections/${collectionId}`);
    if (log("Delete collection", status === 200)) passed++;
    else failed++;
  }

  // Verify deletion
  if (collectionId) {
    const { status } = await request("GET", `/collections/${collectionId}`);
    if (log("Verify collection deleted", status === 404)) passed++;
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
