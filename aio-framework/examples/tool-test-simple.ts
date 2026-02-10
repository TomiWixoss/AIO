/**
 * Simple Tool Calling Test
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

// Simple tool
const tools = [
  {
    name: "get_time",
    description: "Get current time",
    parameters: {
      timezone: {
        type: "string",
        description: "Timezone (e.g., UTC, Asia/Tokyo)",
        required: false,
      },
    },
  },
];

// Tool handler
async function handleToolCall(call: ToolCall): Promise<any> {
  console.log(`\n🔧 Tool: ${call.name}`, call.params);
  
  if (call.name === "get_time") {
    return {
      time: new Date().toISOString(),
      timezone: call.params.timezone || "UTC",
    };
  }
  
  throw new Error(`Unknown tool: ${call.name}`);
}

async function main() {
  console.log("🤖 Simple Tool Test\n");

  try {
    const stream = await aio.chatCompletionStream({
      provider: "google-ai",
      model: "gemini-flash-latest",
      messages: [
        {
          role: "user",
          content: "What time is it now?",
        },
      ],
      tools,
      onToolCall: handleToolCall,
      maxToolIterations: 3,
    });

    console.log("📡 Streaming...\n");

    stream.on("data", (chunk) => {
      process.stdout.write(chunk.toString());
    });

    stream.on("end", () => {
      console.log("\n\n✅ Done!");
      process.exit(0);
    });

    stream.on("error", (error) => {
      console.error("\n❌ Error:", error.message);
      process.exit(1);
    });
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
