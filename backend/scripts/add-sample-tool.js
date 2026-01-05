#!/usr/bin/env node

/**
 * Script thêm sample tool - Check Order API
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

async function createTool(token) {
  console.log("🔧 Creating sample tool: check_order...");

  const response = await fetch(`${BASE_URL}/tools`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: "check_order",
      description:
        "Kiểm tra trạng thái đơn hàng theo mã đơn. Trả về thông tin đơn hàng bao gồm trạng thái, tổng tiền, và danh sách sản phẩm.",
      endpoint_url: "https://api.example.com/orders/{{order_id}}",
      http_method: "GET",
      headers_template: {
        Authorization: "Bearer {{api_key}}",
        "Content-Type": "application/json",
      },
      parameters: {
        order_id: {
          type: "string",
          description: "Mã đơn hàng cần kiểm tra (ví dụ: DH123456)",
          required: true,
        },
      },
      response_mapping: {
        status: "$.order.status",
        total: "$.order.total_amount",
        items: "$.order.items",
        shipping_address: "$.order.shipping.address",
      },
      is_active: true,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    console.log(`✓ Tool created (ID: ${data.data.id})`);
    return data.data.id;
  } else {
    const error = await response.json();
    throw new Error(error.error || "Failed to create tool");
  }
}

async function main() {
  console.log("🚀 Adding Sample Tool...\n");

  try {
    console.log("🔑 Logging in...");
    const token = await getToken();

    const toolId = await createTool(token);

    console.log("\n✅ Sample tool created!");
    console.log("\n💡 Next steps:");
    console.log(
      `   1. Add API key: POST /api-keys/tool { "tool_id": ${toolId}, "credentials": { "api_key": "your-api-key" } }`
    );
    console.log(
      `   2. Use in chat: POST /chat { "message": "Kiểm tra đơn hàng DH123", "tool_ids": [${toolId}] }`
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
