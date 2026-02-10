/**
 * Tool Calling Example
 * Demo streaming với tool execution
 */

import { AIO, ToolCall } from "../src/index.js";
import dotenv from "dotenv";

dotenv.config();

const aio = new AIO({
  providers: [
    {
      provider: "google-ai",
      apiKeys: [{ key: process.env.GOOGLE_AI_API_KEY || "" }],
      models: [{ modelId: "gemini-flash-latest" }],
    },
  ],
  enableLogging: true,
});

// Define tools
const tools: Array<{
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
}> = [
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
        description: "Temperature unit (celsius or fahrenheit)",
        required: false,
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
async function handleToolCall(call: ToolCall): Promise<any> {
  console.log(`\n🔧 Tool called: ${call.name}`);
  console.log(`📝 Params:`, call.params);

  // Simulate tool execution
  if (call.name === "get_weather") {
    const { city, unit = "celsius" } = call.params;
    // Mock weather data
    return {
      city,
      temperature: unit === "celsius" ? 22 : 72,
      unit,
      condition: "Sunny",
      humidity: 65,
    };
  }

  if (call.name === "search_web") {
    const { query } = call.params;
    // Mock search results
    return {
      query,
      results: [
        {
          title: "Result 1",
          url: "https://example.com/1",
          snippet: "This is a mock search result for: " + query,
        },
        {
          title: "Result 2",
          url: "https://example.com/2",
          snippet: "Another relevant result about: " + query,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${call.name}`);
}

async function main() {
  console.log("🤖 AIO Tool Calling Demo\n");

  try {
    const stream = await aio.chatCompletionStream({
      provider: "google-ai",
      model: "gemini-flash-latest",
      messages: [
        {
          role: "user",
          content: "What's the weather in Tokyo? Also search for 'best ramen in Tokyo'",
        },
      ],
      tools,
      onToolCall: handleToolCall,
      maxToolIterations: 5,
    });

    console.log("📡 Streaming response:\n");

    let buffer = "";

    stream.on("data", (chunk) => {
      const chunkStr = chunk.toString();

      // Check if it's SSE format
      if (chunkStr.startsWith("data: ")) {
        try {
          const data = JSON.parse(chunkStr.slice(6));

          // Tool events
          if (data.tool_call) {
            const event = data.tool_call;

            if (event.type === "pending") {
              console.log("\n⏳ Tool call detected...");
            } else if (event.type === "executing") {
              console.log(`\n🔄 Executing: ${event.call.name}`);
            } else if (event.type === "success") {
              console.log(`\n✅ Tool completed: ${event.call.name}`);
              console.log(`📊 Result:`, event.result);
            } else if (event.type === "error") {
              console.log(`\n❌ Tool error: ${event.error}`);
            }
          }
        } catch (e) {
          // Not JSON, might be [DONE]
        }
      } else {
        // Regular text content
        buffer += chunkStr;
        process.stdout.write(chunkStr);
      }
    });

    stream.on("end", () => {
      console.log("\n\n✨ Stream completed!");
    });

    stream.on("error", (error) => {
      console.error("\n❌ Stream error:", error.message);
    });
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
}

main();
