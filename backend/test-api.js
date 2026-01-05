#!/usr/bin/env node

/**
 * Script test tự động cho Backend API
 * Bỏ qua endpoint chat với AI
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:4000";
let authToken = "";
let testData = {
  adminId: null,
  providerId: null,
  keyId: null,
  modelId: null,
};

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log("\n" + "=".repeat(60));
  log(title, "cyan");
  console.log("=".repeat(60));
}

async function request(method, path, body = null, useAuth = false) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
  };

  if (useAuth && authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    return {
      status: response.status,
      ok: response.ok,
      data,
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
    };
  }
}

function assert(condition, message) {
  if (!condition) {
    log(`✗ FAILED: ${message}`, "red");
    throw new Error(message);
  }
  log(`✓ PASSED: ${message}`, "green");
}

// ============================================================================
// TEST CASES
// ============================================================================

async function testHealth() {
  logSection("1. HEALTH CHECK");

  const res = await request("GET", "/health");
  assert(res.ok, "Health check should return 200");
  assert(res.data.success === true, "Response should have success=true");
  assert(res.data.data.status === "ok", "Status should be ok");
  log(`Health: ${JSON.stringify(res.data.data)}`, "blue");
}

async function testAuth() {
  logSection("2. AUTHENTICATION");

  // Register first admin
  log("\n→ Testing Register (First Admin)...", "yellow");
  const registerRes = await request("POST", "/auth/register", {
    email: `test-${Date.now()}@localhost`,
    password: "test123456",
    name: "Test Admin",
  });

  if (registerRes.ok) {
    assert(registerRes.data.success === true, "Register should succeed");
    assert(registerRes.data.data.token, "Should return token");
    authToken = registerRes.data.data.token;
    testData.adminId = registerRes.data.data.admin.id;
    log(`Registered admin ID: ${testData.adminId}`, "blue");
  } else {
    // If registration fails (admin already exists), try login
    log("Registration failed (admin exists), trying login...", "yellow");
    const loginRes = await request("POST", "/auth/login", {
      email: "admin@localhost",
      password: "admin123",
    });
    assert(loginRes.ok, "Login should succeed");
    assert(loginRes.data.data.token, "Should return token");
    authToken = loginRes.data.data.token;
    testData.adminId = loginRes.data.data.admin.id;
  }

  // Get Me
  log("\n→ Testing Get Me...", "yellow");
  const meRes = await request("GET", "/auth/me", null, true);
  assert(meRes.ok, "Get me should succeed");
  assert(meRes.data.data.email, "Should return admin email");
  log(`Current admin: ${meRes.data.data.email}`, "blue");
}

async function testAdmins() {
  logSection("3. ADMINS MANAGEMENT");

  // Get all admins
  log("\n→ Testing Get All Admins...", "yellow");
  const listRes = await request("GET", "/admins", null, true);
  assert(listRes.ok, "Get all admins should succeed");
  assert(Array.isArray(listRes.data.data), "Should return array");
  log(`Total admins: ${listRes.data.data.length}`, "blue");

  // Get admin by ID
  log("\n→ Testing Get Admin by ID...", "yellow");
  const getRes = await request(
    "GET",
    `/admins/${testData.adminId}`,
    null,
    true
  );
  assert(getRes.ok, "Get admin by ID should succeed");
  assert(
    getRes.data.data.id === testData.adminId,
    "Should return correct admin"
  );

  // Create new admin
  log("\n→ Testing Create Admin...", "yellow");
  const createRes = await request(
    "POST",
    "/admins",
    {
      email: `test-admin-${Date.now()}@localhost`,
      password: "test123456",
      name: "Test Admin 2",
    },
    true
  );
  assert(createRes.ok, "Create admin should succeed");
  const newAdminId = createRes.data.data.id;
  log(`Created admin ID: ${newAdminId}`, "blue");

  // Update admin
  log("\n→ Testing Update Admin...", "yellow");
  const updateRes = await request(
    "PUT",
    `/admins/${newAdminId}`,
    {
      name: "Updated Test Admin",
    },
    true
  );
  assert(updateRes.ok, "Update admin should succeed");

  // Delete admin
  log("\n→ Testing Delete Admin...", "yellow");
  const deleteRes = await request(
    "DELETE",
    `/admins/${newAdminId}`,
    null,
    true
  );
  assert(deleteRes.ok, "Delete admin should succeed");
}

async function testProviders() {
  logSection("4. PROVIDERS MANAGEMENT");

  // Get all providers
  log("\n→ Testing Get All Providers...", "yellow");
  const listRes = await request("GET", "/providers", null, true);
  assert(listRes.ok, "Get all providers should succeed");
  log(`Total providers: ${listRes.data.data.length}`, "blue");

  // Create provider
  log("\n→ Testing Create Provider...", "yellow");
  const createRes = await request(
    "POST",
    "/providers",
    {
      name: `test-provider-${Date.now()}`,
      display_name: "Test Provider",
      base_url: "https://api.test.com",
      priority: 50,
      free_tier_info: "Test tier",
    },
    true
  );
  assert(createRes.ok, "Create provider should succeed");
  testData.providerId = createRes.data.data.id;
  log(`Created provider ID: ${testData.providerId}`, "blue");

  // Get provider by ID
  log("\n→ Testing Get Provider by ID...", "yellow");
  const getRes = await request(
    "GET",
    `/providers/${testData.providerId}`,
    null,
    true
  );
  assert(getRes.ok, "Get provider by ID should succeed");

  // Update provider
  log("\n→ Testing Update Provider...", "yellow");
  const updateRes = await request(
    "PUT",
    `/providers/${testData.providerId}`,
    {
      display_name: "Updated Test Provider",
      priority: 60,
    },
    true
  );
  assert(updateRes.ok, "Update provider should succeed");
}

async function testProviderKeys() {
  logSection("5. PROVIDER KEYS MANAGEMENT");

  // Get keys by provider
  log("\n→ Testing Get Keys by Provider...", "yellow");
  const listRes = await request(
    "GET",
    `/provider-keys/provider/${testData.providerId}`,
    null,
    true
  );
  assert(listRes.ok, "Get keys by provider should succeed");
  log(`Total keys: ${listRes.data.data.length}`, "blue");

  // Create key
  log("\n→ Testing Create Key...", "yellow");
  const createRes = await request(
    "POST",
    "/provider-keys",
    {
      provider_id: testData.providerId,
      api_key: `test-key-${Date.now()}`,
      name: "Test Key",
      priority: 100,
      daily_limit: 1000,
    },
    true
  );
  assert(createRes.ok, "Create key should succeed");
  testData.keyId = createRes.data.data.id;
  log(`Created key ID: ${testData.keyId}`, "blue");

  // Update key
  log("\n→ Testing Update Key...", "yellow");
  const updateRes = await request(
    "PUT",
    `/provider-keys/${testData.keyId}`,
    {
      name: "Updated Test Key",
      priority: 90,
    },
    true
  );
  assert(updateRes.ok, "Update key should succeed");

  // Toggle key (deactivate)
  log("\n→ Testing Deactivate Key...", "yellow");
  const deactivateRes = await request(
    "PUT",
    `/provider-keys/${testData.keyId}`,
    {
      is_active: false,
    },
    true
  );
  assert(deactivateRes.ok, "Deactivate key should succeed");

  // Toggle key (activate)
  log("\n→ Testing Activate Key...", "yellow");
  const activateRes = await request(
    "PUT",
    `/provider-keys/${testData.keyId}`,
    {
      is_active: true,
    },
    true
  );
  assert(activateRes.ok, "Activate key should succeed");
}

async function testModels() {
  logSection("6. MODELS MANAGEMENT");

  // Get all models
  log("\n→ Testing Get All Models...", "yellow");
  const listRes = await request("GET", "/models", null, true);
  assert(listRes.ok, "Get all models should succeed");
  log(`Total models: ${listRes.data.data.length}`, "blue");

  // Get models by provider
  log("\n→ Testing Get Models by Provider...", "yellow");
  const providerModelsRes = await request(
    "GET",
    `/models/provider/${testData.providerId}`,
    null,
    true
  );
  assert(providerModelsRes.ok, "Get models by provider should succeed");

  // Create model
  log("\n→ Testing Create Model...", "yellow");
  const createRes = await request(
    "POST",
    "/models",
    {
      provider_id: testData.providerId,
      model_id: `test-model-${Date.now()}`,
      display_name: "Test Model",
      context_length: 4096,
      is_fallback: false,
    },
    true
  );
  assert(createRes.ok, "Create model should succeed");
  testData.modelId = createRes.data.data.id;
  log(`Created model ID: ${testData.modelId}`, "blue");

  // Update model
  log("\n→ Testing Update Model...", "yellow");
  const updateRes = await request(
    "PUT",
    `/models/${testData.modelId}`,
    {
      display_name: "Updated Test Model",
      context_length: 8192,
    },
    true
  );
  assert(updateRes.ok, "Update model should succeed");
}

async function testStats() {
  logSection("7. STATISTICS");

  // Get overall stats
  log("\n→ Testing Get Overall Stats...", "yellow");
  const statsRes = await request("GET", "/stats", null, true);
  assert(statsRes.ok, "Get overall stats should succeed");
  log(`Stats: ${JSON.stringify(statsRes.data.data)}`, "blue");

  // Get today stats
  log("\n→ Testing Get Today Stats...", "yellow");
  const todayRes = await request("GET", "/stats/today", null, true);
  assert(todayRes.ok, "Get today stats should succeed");

  // Get usage logs
  log("\n→ Testing Get Usage Logs...", "yellow");
  const logsRes = await request("GET", "/stats/logs?limit=10", null, true);
  assert(logsRes.ok, "Get usage logs should succeed");
  assert(Array.isArray(logsRes.data.data), "Should return array");
  log(`Total logs: ${logsRes.data.data.length}`, "blue");
}

async function cleanup() {
  logSection("8. CLEANUP");

  // Delete test model
  if (testData.modelId) {
    log("\n→ Deleting test model...", "yellow");
    await request("DELETE", `/models/${testData.modelId}`, null, true);
  }

  // Delete test key
  if (testData.keyId) {
    log("\n→ Deleting test key...", "yellow");
    await request("DELETE", `/provider-keys/${testData.keyId}`, null, true);
  }

  // Delete test provider
  if (testData.providerId) {
    log("\n→ Deleting test provider...", "yellow");
    await request("DELETE", `/providers/${testData.providerId}`, null, true);
  }

  log("✓ Cleanup completed", "green");
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.clear();
  log("╔════════════════════════════════════════════════════════════╗", "cyan");
  log("║         BACKEND API TEST SUITE (Excluding Chat)           ║", "cyan");
  log("╚════════════════════════════════════════════════════════════╝", "cyan");
  log(`\nBase URL: ${BASE_URL}\n`, "blue");

  const startTime = Date.now();
  let passed = 0;
  let failed = 0;

  try {
    await testHealth();
    passed++;
  } catch (error) {
    failed++;
    log(`Error: ${error.message}`, "red");
  }

  try {
    await testAuth();
    passed++;
  } catch (error) {
    failed++;
    log(`Error: ${error.message}`, "red");
  }

  try {
    await testAdmins();
    passed++;
  } catch (error) {
    failed++;
    log(`Error: ${error.message}`, "red");
  }

  try {
    await testProviders();
    passed++;
  } catch (error) {
    failed++;
    log(`Error: ${error.message}`, "red");
  }

  try {
    await testProviderKeys();
    passed++;
  } catch (error) {
    failed++;
    log(`Error: ${error.message}`, "red");
  }

  try {
    await testModels();
    passed++;
  } catch (error) {
    failed++;
    log(`Error: ${error.message}`, "red");
  }

  try {
    await testStats();
    passed++;
  } catch (error) {
    failed++;
    log(`Error: ${error.message}`, "red");
  }

  try {
    await cleanup();
  } catch (error) {
    log(`Cleanup error: ${error.message}`, "yellow");
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  logSection("TEST SUMMARY");
  log(`\nTotal Tests: ${passed + failed}`, "blue");
  log(`Passed: ${passed}`, "green");
  log(`Failed: ${failed}`, failed > 0 ? "red" : "green");
  log(`Duration: ${duration}s`, "blue");

  if (failed === 0) {
    log("\n🎉 All tests passed!", "green");
    process.exit(0);
  } else {
    log("\n❌ Some tests failed!", "red");
    process.exit(1);
  }
}

main().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, "red");
  console.error(error);
  process.exit(1);
});
