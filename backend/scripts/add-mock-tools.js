#!/usr/bin/env node

/**
 * Script thêm mock tools sử dụng JSONPlaceholder API (free public API)
 * Để test AI gọi tool thực tế
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:4000";

async function getToken() {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@localhost", password: "admin123" }),
  });
  const data = await response.json();
  return data.data.token;
}

async function createTool(token, tool) {
  const response = await fetch(`${BASE_URL}/tools`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(tool),
  });

  if (response.ok) {
    const data = await response.json();
    return data.data.id;
  } else {
    const error = await response.json();
    // Nếu tool đã tồn tại, bỏ qua
    if (error.error?.includes("Duplicate") || error.error?.includes("exists")) {
      console.log(`  ⚠ Tool "${tool.name}" already exists, skipping`);
      return null;
    }
    throw new Error(error.error || "Failed to create tool");
  }
}

const mockTools = [
  {
    name: "get_user",
    description:
      "Lấy thông tin người dùng theo ID. Trả về tên, email, địa chỉ và công ty của người dùng.",
    endpoint_url: "https://jsonplaceholder.typicode.com/users/{{user_id}}",
    http_method: "GET",
    headers_template: null,
    body_template: null,
    query_params_template: null,
    parameters: {
      user_id: {
        type: "number",
        description: "ID của người dùng (1-10)",
        required: true,
      },
    },
    response_mapping: {
      name: "$.name",
      email: "$.email",
      phone: "$.phone",
      company: "$.company.name",
      city: "$.address.city",
    },
    is_active: true,
  },
  {
    name: "get_post",
    description: "Lấy bài viết theo ID. Trả về tiêu đề và nội dung bài viết.",
    endpoint_url: "https://jsonplaceholder.typicode.com/posts/{{post_id}}",
    http_method: "GET",
    headers_template: null,
    body_template: null,
    query_params_template: null,
    parameters: {
      post_id: {
        type: "number",
        description: "ID của bài viết (1-100)",
        required: true,
      },
    },
    response_mapping: {
      title: "$.title",
      body: "$.body",
      userId: "$.userId",
    },
    is_active: true,
  },
  {
    name: "get_user_posts",
    description:
      "Lấy danh sách bài viết của một người dùng. Trả về tất cả bài viết của user đó.",
    endpoint_url: "https://jsonplaceholder.typicode.com/posts",
    http_method: "GET",
    headers_template: null,
    body_template: null,
    query_params_template: {
      userId: "{{user_id}}",
    },
    parameters: {
      user_id: {
        type: "number",
        description: "ID của người dùng (1-10)",
        required: true,
      },
    },
    response_mapping: null, // Return full array
    is_active: true,
  },
  {
    name: "create_post",
    description:
      "Tạo bài viết mới. Cần truyền tiêu đề, nội dung và ID người dùng.",
    endpoint_url: "https://jsonplaceholder.typicode.com/posts",
    http_method: "POST",
    headers_template: {
      "Content-Type": "application/json",
    },
    body_template: {
      title: "{{title}}",
      body: "{{content}}",
      userId: "{{user_id}}",
    },
    query_params_template: null,
    parameters: {
      title: {
        type: "string",
        description: "Tiêu đề bài viết",
        required: true,
      },
      content: {
        type: "string",
        description: "Nội dung bài viết",
        required: true,
      },
      user_id: {
        type: "number",
        description: "ID người dùng tạo bài viết",
        required: true,
      },
    },
    response_mapping: {
      id: "$.id",
      title: "$.title",
    },
    is_active: true,
  },
  {
    name: "get_comments",
    description: "Lấy danh sách bình luận của một bài viết.",
    endpoint_url:
      "https://jsonplaceholder.typicode.com/posts/{{post_id}}/comments",
    http_method: "GET",
    headers_template: null,
    body_template: null,
    query_params_template: null,
    parameters: {
      post_id: {
        type: "number",
        description: "ID của bài viết (1-100)",
        required: true,
      },
    },
    response_mapping: null,
    is_active: true,
  },
];

async function main() {
  console.log("🚀 Adding Mock Tools (JSONPlaceholder API)...\n");

  try {
    console.log("🔑 Logging in...");
    const token = await getToken();

    console.log(`\n📦 Adding ${mockTools.length} tools...\n`);

    const createdIds = [];
    for (const tool of mockTools) {
      try {
        const id = await createTool(token, tool);
        if (id) {
          console.log(`✓ Created: ${tool.name} (ID: ${id})`);
          createdIds.push({ name: tool.name, id });
        }
      } catch (error) {
        console.log(`✗ Failed: ${tool.name} - ${error.message}`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Mock tools created!");
    console.log("\n📋 Tool IDs:");
    createdIds.forEach((t) => console.log(`   - ${t.name}: ${t.id}`));

    console.log("\n💡 These tools use JSONPlaceholder (free public API)");
    console.log("   No API key required!");
    console.log("\n🧪 Test with:");
    console.log("   node scripts/test-tools.js");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
