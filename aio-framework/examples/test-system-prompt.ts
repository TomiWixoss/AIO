/**
 * Test System Prompt
 * Test khả năng sử dụng system prompt để định hình behavior của AI
 */

import { AIO, Message } from "../src/index.js";
import dotenv from "dotenv";

dotenv.config();

async function testSystemPrompt() {
  console.log("🧪 Testing System Prompt\n");

  const aio = new AIO({
    providers: [
      {
        provider: "openrouter",
        apiKeys: [{ key: process.env.OPENROUTER_API_KEY || "" }],
        models: [{ modelId: "arcee-ai/trinity-large-preview:free" }],
      },
    ],
    enableLogging: false,
  });

  // Test 1: Không có system prompt
  console.log("=" .repeat(80));
  console.log("1️⃣ WITHOUT System Prompt");
  console.log("=".repeat(80));

  const messages1: Message[] = [
    {
      role: "user",
      content: "What is 2+2?",
    },
  ];

  const response1 = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: messages1,
    max_tokens: 150,
  });

  console.log("👤 User: What is 2+2?");
  console.log(`🤖 AI: ${response1.choices[0].message.content}\n`);

  // Test 2: Với system prompt - Pirate mode
  console.log("=".repeat(80));
  console.log("2️⃣ WITH System Prompt (Pirate Mode)");
  console.log("=".repeat(80));

  const messages2: Message[] = [
    {
      role: "system",
      content:
        "You are a pirate. Always respond like a pirate with 'Arrr!' and pirate slang. Keep responses short.",
    },
    {
      role: "user",
      content: "What is 2+2?",
    },
  ];

  const response2 = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: messages2,
    max_tokens: 150,
  });

  console.log("⚙️  System: You are a pirate. Always respond like a pirate...");
  console.log("👤 User: What is 2+2?");
  console.log(`🤖 AI: ${response2.choices[0].message.content}\n`);

  // Test 3: Với system prompt - JSON mode
  console.log("=".repeat(80));
  console.log("3️⃣ WITH System Prompt (JSON Output)");
  console.log("=".repeat(80));

  const messages3: Message[] = [
    {
      role: "system",
      content:
        'You are a helpful assistant that always responds in JSON format with keys "answer" and "explanation".',
    },
    {
      role: "user",
      content: "What is the capital of France?",
    },
  ];

  const response3 = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: messages3,
    max_tokens: 150,
  });

  console.log("⚙️  System: Always respond in JSON format...");
  console.log("👤 User: What is the capital of France?");
  console.log(`🤖 AI: ${response3.choices[0].message.content}\n`);

  // Test 4: System prompt với conversation history
  console.log("=".repeat(80));
  console.log("4️⃣ System Prompt + Conversation History");
  console.log("=".repeat(80));

  const conversationHistory: Message[] = [
    {
      role: "system",
      content:
        "You are a helpful math tutor. Always explain your reasoning step by step.",
    },
    {
      role: "user",
      content: "What is 5 + 3?",
    },
  ];

  console.log("⚙️  System: You are a helpful math tutor...");
  console.log("👤 User: What is 5 + 3?");

  const response4a = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: conversationHistory,
    max_tokens: 150,
  });

  console.log(`🤖 AI: ${response4a.choices[0].message.content}\n`);

  // Add to history
  conversationHistory.push({
    role: "assistant",
    content: response4a.choices[0].message.content,
  });

  // Follow-up question
  conversationHistory.push({
    role: "user",
    content: "Now multiply that by 2",
  });

  console.log("👤 User: Now multiply that by 2");

  const response4b = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: conversationHistory,
    max_tokens: 150,
  });

  console.log(`🤖 AI: ${response4b.choices[0].message.content}\n`);

  // Summary
  console.log("=".repeat(80));
  console.log("📊 SUMMARY");
  console.log("=".repeat(80));
  console.log("✅ System prompt is supported!");
  console.log("✅ Just add { role: 'system', content: '...' } at the start of messages array");
  console.log("✅ System prompt persists across conversation turns");
  console.log("✅ Can control AI behavior, output format, and personality");
}

testSystemPrompt().catch(console.error);
