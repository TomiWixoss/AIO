/**
 * Test Nvidia stepfun-ai/step-3.5-flash với tool calling
 */

import { AIO } from "./src/index.js";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🧪 Testing Nvidia stepfun-ai/step-3.5-flash with tool calling\n");

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
      name: "get_inventory",
      description: "Get all items currently in the bot's inventory with their counts",
      parameters: {},
    },
    {
      name: "get_position",
      description: "Get the bot's current position (x, y, z coordinates)",
      parameters: {},
    },
    {
      name: "mine_block",
      description: "Mine blocks of a specific type",
      parameters: {
        blockType: {
          type: "string",
          description: "Type of block to mine (e.g., oak_log, stone, iron_ore)",
          required: true,
        },
        count: {
          type: "number",
          description: "Number of blocks to mine",
          required: true,
        },
      },
    },
    {
      name: "craft_item",
      description: "Craft an item using available materials",
      parameters: {
        itemName: {
          type: "string",
          description: "Name of item to craft (e.g., wooden_pickaxe, crafting_table)",
          required: true,
        },
        count: {
          type: "number",
          description: "Number of items to craft",
          required: false,
          default: 1,
        },
      },
    },
  ];

  // Tool handler
  async function handleToolCall(call: any) {
    console.log(`\n🔧 Tool called: ${call.name}`);
    console.log(`📦 Parameters:`, JSON.stringify(call.params, null, 2));

    if (call.name === "get_inventory") {
      return {
        items: [
          { name: "oak_log", count: 5 },
          { name: "stick", count: 2 },
        ],
      };
    }

    if (call.name === "get_position") {
      return { x: 100, y: 64, z: 200 };
    }

    if (call.name === "mine_block") {
      return {
        success: true,
        mined: call.params.count,
        blockType: call.params.blockType,
      };
    }

    if (call.name === "craft_item") {
      return {
        success: true,
        crafted: call.params.count || 1,
        itemName: call.params.itemName,
      };
    }

    return { error: "Unknown tool" };
  }

  console.log("📤 Sending request to Nvidia stepfun-ai/step-3.5-flash...\n");

  try {
    const stream = await aio.chatCompletionStream({
      provider: "nvidia",
      model: "stepfun-ai/step-3.5-flash",
      messages: [
        {
          role: "user",
          content: `You are a Minecraft bot. Your task: Obtain a wooden_pickaxe.

Current situation:
- You have NO items in inventory
- You need to craft a wooden_pickaxe

EXECUTE this task using the available tools:
1. First check your inventory with get_inventory
2. Mine oak_log blocks if needed
3. Craft the wooden_pickaxe

USE TOOLS NOW! Do not just explain - actually call the tools.`,
        },
      ],
      tools,
      onToolCall: handleToolCall,
      maxToolIterations: 5,
    });

    console.log("📥 Receiving response:\n");
    console.log("─".repeat(60));

    let hasToolCalls = false;

    stream.on("data", (chunk) => {
      try {
        const chunkStr = chunk.toString();
        if (!chunkStr.startsWith("data: ")) return;

        const data = JSON.parse(chunkStr.slice(6));

        // Tool call events
        if (data.tool_call) {
          hasToolCalls = true;
          const event = data.tool_call;

          if (event.type === "pending") {
            console.log("\n⏳ Tool call detected...");
          } else if (event.type === "executing") {
            console.log(`\n🔧 Executing: ${event.call.name}`);
            console.log(`   Params: ${JSON.stringify(event.call.params)}`);
          } else if (event.type === "success") {
            console.log(`✅ Success!`);
            console.log(`   Result: ${JSON.stringify(event.result)}`);
          } else if (event.type === "error") {
            console.log(`❌ Error: ${event.error}`);
          }
        }

        // Text content
        if (data.choices?.[0]?.delta?.content) {
          process.stdout.write(data.choices[0].delta.content);
        }
      } catch (e) {
        // Skip invalid chunks
      }
    });

    stream.on("end", () => {
      console.log("\n" + "─".repeat(60));
      console.log("\n✅ Stream completed!");
      
      if (!hasToolCalls) {
        console.log("\n⚠️  WARNING: No tool calls were detected!");
        console.log("The AI may not be following the tool calling format.");
      } else {
        console.log("\n✅ Tool calls were successfully detected and executed!");
      }
    });

    stream.on("error", (error) => {
      console.error("\n❌ Stream error:", error.message);
    });
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main().catch(console.error);
