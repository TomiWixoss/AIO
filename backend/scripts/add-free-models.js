#!/usr/bin/env node

/**
 * Script thêm tất cả free models từ OpenRouter
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:4000";

const freeModels = [
  {
    model_id: "allenai/olmo-3.1-32b-think:free",
    display_name: "AllenAI: Olmo 3.1 32B Think (free)",
    context_length: 65536,
  },
  {
    model_id: "xiaomi/mimo-v2-flash:free",
    display_name: "Xiaomi: MiMo-V2-Flash (free)",
    context_length: 262144,
  },
  {
    model_id: "nvidia/nemotron-3-nano-30b-a3b:free",
    display_name: "NVIDIA: Nemotron 3 Nano 30B A3B (free)",
    context_length: 256000,
  },
  {
    model_id: "mistralai/devstral-2512:free",
    display_name: "Mistral: Devstral 2 2512 (free)",
    context_length: 262144,
  },
  {
    model_id: "nex-agi/deepseek-v3.1-nex-n1:free",
    display_name: "Nex AGI: DeepSeek V3.1 Nex N1 (free)",
    context_length: 131072,
  },
  {
    model_id: "arcee-ai/trinity-mini:free",
    display_name: "Arcee AI: Trinity Mini (free)",
    context_length: 131072,
  },
  {
    model_id: "allenai/olmo-3-32b-think:free",
    display_name: "AllenAI: Olmo 3 32B Think (free)",
    context_length: 65536,
  },
  {
    model_id: "kwaipilot/kat-coder-pro:free",
    display_name: "Kwaipilot: KAT-Coder-Pro V1 (free)",
    context_length: 256000,
  },
  {
    model_id: "nvidia/nemotron-nano-12b-v2-vl:free",
    display_name: "NVIDIA: Nemotron Nano 12B 2 VL (free)",
    context_length: 128000,
  },
  {
    model_id: "nvidia/nemotron-nano-9b-v2:free",
    display_name: "NVIDIA: Nemotron Nano 9B V2 (free)",
    context_length: 128000,
  },
  {
    model_id: "openai/gpt-oss-120b:free",
    display_name: "OpenAI: gpt-oss-120b (free)",
    context_length: 131072,
  },
  {
    model_id: "openai/gpt-oss-20b:free",
    display_name: "OpenAI: gpt-oss-20b (free)",
    context_length: 131072,
  },
  {
    model_id: "z-ai/glm-4.5-air:free",
    display_name: "Z.AI: GLM 4.5 Air (free)",
    context_length: 131072,
  },
  {
    model_id: "qwen/qwen3-coder:free",
    display_name: "Qwen: Qwen3 Coder 480B A35B (free)",
    context_length: 262000,
  },
  {
    model_id: "moonshotai/kimi-k2:free",
    display_name: "MoonshotAI: Kimi K2 0711 (free)",
    context_length: 32768,
  },
  {
    model_id: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
    display_name: "Venice: Uncensored (free)",
    context_length: 32768,
  },
  {
    model_id: "google/gemma-3n-e2b-it:free",
    display_name: "Google: Gemma 3n 2B (free)",
    context_length: 8192,
  },
  {
    model_id: "tngtech/deepseek-r1t2-chimera:free",
    display_name: "TNG: DeepSeek R1T2 Chimera (free)",
    context_length: 163840,
  },
  {
    model_id: "deepseek/deepseek-r1-0528:free",
    display_name: "DeepSeek: R1 0528 (free)",
    context_length: 163840,
  },
  {
    model_id: "google/gemma-3n-e4b-it:free",
    display_name: "Google: Gemma 3n 4B (free)",
    context_length: 8192,
  },
  {
    model_id: "qwen/qwen3-4b:free",
    display_name: "Qwen: Qwen3 4B (free)",
    context_length: 40960,
  },
  {
    model_id: "tngtech/deepseek-r1t-chimera:free",
    display_name: "TNG: DeepSeek R1T Chimera (free)",
    context_length: 163840,
  },
  {
    model_id: "mistralai/mistral-small-3.1-24b-instruct:free",
    display_name: "Mistral: Mistral Small 3.1 24B (free)",
    context_length: 128000,
  },
  {
    model_id: "google/gemma-3-4b-it:free",
    display_name: "Google: Gemma 3 4B (free)",
    context_length: 32768,
  },
  {
    model_id: "google/gemma-3-12b-it:free",
    display_name: "Google: Gemma 3 12B (free)",
    context_length: 32768,
  },
  {
    model_id: "google/gemma-3-27b-it:free",
    display_name: "Google: Gemma 3 27B (free)",
    context_length: 131072,
  },
  {
    model_id: "google/gemini-2.0-flash-exp:free",
    display_name: "Google: Gemini 2.0 Flash Experimental (free)",
    context_length: 1048576,
  },
  {
    model_id: "meta-llama/llama-3.3-70b-instruct:free",
    display_name: "Meta: Llama 3.3 70B Instruct (free)",
    context_length: 131072,
  },
  {
    model_id: "meta-llama/llama-3.2-3b-instruct:free",
    display_name: "Meta: Llama 3.2 3B Instruct (free)",
    context_length: 131072,
  },
  {
    model_id: "qwen/qwen-2.5-vl-7b-instruct:free",
    display_name: "Qwen: Qwen2.5-VL 7B Instruct (free)",
    context_length: 32768,
  },
  {
    model_id: "nousresearch/hermes-3-llama-3.1-405b:free",
    display_name: "Nous: Hermes 3 405B Instruct (free)",
    context_length: 131072,
  },
  {
    model_id: "meta-llama/llama-3.1-405b-instruct:free",
    display_name: "Meta: Llama 3.1 405B Instruct (free)",
    context_length: 131072,
  },
];

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

async function getProviderId(token) {
  const response = await fetch(`${BASE_URL}/providers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  const openrouter = data.data.find((p) => p.name === "openrouter");
  return openrouter?.id;
}

async function addModel(token, providerId, model) {
  try {
    const response = await fetch(`${BASE_URL}/models`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        provider_id: providerId,
        model_id: model.model_id,
        display_name: model.display_name,
        context_length: model.context_length,
        is_fallback: false,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✓ Added: ${model.display_name} (ID: ${data.data.id})`);
      return true;
    } else {
      const error = await response.json();
      console.log(
        `✗ Failed: ${model.display_name} - ${error.error || "Unknown error"}`
      );
      return false;
    }
  } catch (error) {
    console.log(`✗ Error: ${model.display_name} - ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("🚀 Adding OpenRouter Free Models...\n");

  // Get token
  console.log("🔑 Logging in...");
  const token = await getToken();

  // Get OpenRouter provider ID
  console.log("📡 Getting OpenRouter provider...");
  const providerId = await getProviderId(token);

  if (!providerId) {
    console.error("❌ OpenRouter provider not found!");
    process.exit(1);
  }

  console.log(`✓ OpenRouter provider ID: ${providerId}\n`);
  console.log(`📦 Adding ${freeModels.length} models...\n`);

  let added = 0;
  let failed = 0;

  for (const model of freeModels) {
    const success = await addModel(token, providerId, model);
    if (success) {
      added++;
    } else {
      failed++;
    }
    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("\n" + "=".repeat(60));
  console.log(`✅ Summary: ${added} added, ${failed} failed`);
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error("❌ Fatal error:", error.message);
  process.exit(1);
});
