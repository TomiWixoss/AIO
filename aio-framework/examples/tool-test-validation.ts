/**
 * Test tool calling với validation và retry
 */

import { AIO } from "../src/index.js";
import dotenv from "dotenv";

dotenv.config();

const aio = new AIO({
  providers: [
    {
      provider: "google-ai",
      apiKeys: [{ key: process.env.GOOGLE_AI_API_KEY! }],
      models: [{ modelId: "gemini-flash-latest" }],
    },
  ],
});

// Tool với required parameters và enum
const tools = [
  {
    name: "get_weather",
    description: "Get weather information for a city",
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
    name: "calculate",
    description: "Perform a calculation",
    parameters: {
      operation: {
        type: "string",
        description: "Math operation",
        required: true,
        enum: ["add", "subtract", "multiply", "divide"],
      },
      a: {
        type: "number",
        description: "First number",
        required: true,
      },
      b: {
        type: "number",
        description: "Second number",
        required: true,
      },
    },
  },
];

// Tool handler với retry simulation
let callCount = 0;
async function handleToolCall(call: any) {
  callCount++;
  
  if (call.name === "get_weather") {
    // Simulate failure on first call
    if (callCount === 1) {
      throw new Error("Weather API temporarily unavailable");
    }
    
    return {
      city: call.params.city,
      temperature: 22,
      unit: call.params.unit || "celsius",
      condition: "Sunny",
    };
  }
  
  if (call.name === "calculate") {
    const { operation, a, b } = call.params;
    
    switch (operation) {
      case "add":
        return { result: a + b };
      case "subtract":
        return { result: a - b };
      case "multiply":
        return { result: a * b };
      case "divide":
        if (b === 0) throw new Error("Division by zero");
        return { result: a / b };
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }
  
  throw new Error(`Unknown tool: ${call.name}`);
}

async function main() {
  console.log("🤖 Tool Validation & Retry Test\n");

  const stream = await aio.chatCompletionStream({
    provider: "google-ai",
    model: "gemini-flash-latest",
    messages: [
      {
        role: "user",
        content: "What's the weather in Tokyo? Also calculate 15 + 27.",
      },
    ],
    tools,
    onToolCall: handleToolCall,
    maxToolIterations: 5,
  });

  console.log("📡 Streaming...");

  stream.on("data", (chunk) => {
    process.stdout.write(chunk.toString());
  });

  stream.on("end", () => {
    console.log("\n\n✅ Done!");
    console.log(`📊 Total tool calls: ${callCount}`);
  });

  stream.on("error", (error) => {
    console.error("\n❌ Error:", error.message);
  });
}

main();
