/**
 * Test Nvidia stepfun-ai/step-3.5-flash với tool calling (NON-STREAMING)
 */

import { AIO } from "./src/index.js";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🧪 Testing Nvidia stepfun-ai/step-3.5-flash with tool calling (NON-STREAMING)\n");

  const aio = new AIO({
    providers: [
      {
        provider: "nvidia",
        apiKeys: [{ key: process.env.NVIDIA_API_KEY || "" }],
        models: [{ modelId: "stepfun-ai/step-3.5-flash" }],
      },
    ],
  });

  // Define simple tools
  const tools = [
    {
      name: "get_weather",
      description: "Get current weather for a city",
      parameters: {
        city: {
          type: "string",
          description: "City name",
          required: true,
        },
        unit: {
          type: "string",
          description: "Temperature unit",
          required: false,
          enum: ["celsius", "fahrenheit"],
          default: "celsius",
        },
      },
    },
    {
      name: "search_web",
      description: "Search the web for information",
      parameters: {
        query: {
          type: "string",
          description: "Search query",
          required: true,
        },
      },
    },
  ];

  // Tool handler
  async function handleToolCall(call: any) {
    console.log(`\n🔧 Tool called: ${call.name}`);
    console.log(`📦 Parameters:`, JSON.stringify(call.params, null, 2));

    if (call.name === "get_weather") {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        temperature: 22,
        condition: "Sunny",
        city: call.params.city,
        unit: call.params.unit || "celsius",
      };
    }

    if (call.name === "search_web") {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        results: [
          `Result 1 for "${call.params.query}"`,
          `Result 2 for "${call.params.query}"`,
        ],
        query: call.params.query,
      };
    }

    return { error: "Unknown tool" };
  }

  console.log("📤 Sending request to Nvidia stepfun-ai/step-3.5-flash...\n");

  try {
    const response = await aio.chatCompletion({
      provider: "nvidia",
      model: "stepfun-ai/step-3.5-flash",
      messages: [
        {
          role: "user",
          content: "What's the weather in Tokyo and Paris? Then search for 'best ramen in Tokyo'.",
        },
      ],
      tools,
      onToolCall: handleToolCall,
      maxToolIterations: 5,
    });

    console.log("\n" + "─".repeat(60));
    console.log("📥 Final Response:");
    console.log("─".repeat(60));
    console.log(response.choices[0].message.content);
    console.log("─".repeat(60));
    console.log("\n✅ Completed!");
    console.log(`📊 Tokens used: ${response.usage.total_tokens}`);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main().catch(console.error);
