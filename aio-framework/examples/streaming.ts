/**
 * Example: Streaming - Real-time response streaming
 */

import { AIO } from "../src/index.js";

async function main() {
  const aio = new AIO({
    providers: [
      {
        provider: "groq",
        apiKeys: [
          {
            key: process.env.GROQ_API_KEY || "your-groq-key-here",
          },
        ],
        models: [{ modelId: "openai/gpt-oss-120b" }],
      },
    ],
    autoMode: false,
  });

  console.log("🚀 AIO Framework - Streaming Example\n");
  console.log("📤 Streaming response...\n");

  process.stdout.write("🤖 Assistant: ");

  const stream = await aio.chatCompletionStream({
    provider: "groq",
    model: "openai/gpt-oss-120b",
    messages: [{ role: "user", content: "Write a haiku about coding." }],
    max_tokens: 100,
  });

  stream.on("data", (chunk) => {
    const text = chunk.toString();
    const lines = text.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || "";
          if (content) {
            process.stdout.write(content);
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  });

  stream.on("end", () => {
    console.log("\n\n✅ Streaming completed!");
  });

  stream.on("error", (error) => {
    console.error("\n\n❌ Stream error:", error);
  });
}

main().catch(console.error);
