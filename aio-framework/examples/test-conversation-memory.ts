/**
 * Test Conversation Memory
 * Test khả năng AI nhớ context qua nhiều lượt hội thoại
 */

import { AIO, Message } from "../src/index.js";
import dotenv from "dotenv";

dotenv.config();

async function testConversationMemory() {
  console.log("🧪 Testing Conversation Memory\n");
  console.log("Model: arcee-ai/trinity-large-preview:free\n");

  const aio = new AIO({
    providers: [
      {
        provider: "openrouter",
        apiKeys: [
          {
            key: process.env.OPENROUTER_API_KEY || "",
            priority: 10,
          },
        ],
        models: [
          {
            modelId: "arcee-ai/trinity-large-preview:free",
            priority: 10,
          },
        ],
      },
    ],
    enableLogging: false,
  });

  // Conversation history - framework tự động maintain
  const conversationHistory: Message[] = [];

  // Turn 1: Giới thiệu tên
  console.log("👤 User: My name is John and I'm 25 years old.");
  conversationHistory.push({
    role: "user",
    content: "My name is John and I'm 25 years old.",
  });

  let response = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: conversationHistory,
    max_tokens: 150,
  });

  const assistantResponse1 = response.choices[0].message.content;
  console.log(`🤖 AI: ${assistantResponse1}\n`);

  // Thêm response vào history
  conversationHistory.push({
    role: "assistant",
    content: assistantResponse1,
  });

  // Turn 2: Hỏi về sở thích
  console.log("👤 User: I love playing guitar and coding.");
  conversationHistory.push({
    role: "user",
    content: "I love playing guitar and coding.",
  });

  response = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: conversationHistory,
    max_tokens: 150,
  });

  const assistantResponse2 = response.choices[0].message.content;
  console.log(`🤖 AI: ${assistantResponse2}\n`);

  conversationHistory.push({
    role: "assistant",
    content: assistantResponse2,
  });

  // Turn 3: Test memory - hỏi lại tên
  console.log("👤 User: What's my name?");
  conversationHistory.push({
    role: "user",
    content: "What's my name?",
  });

  response = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: conversationHistory,
    max_tokens: 100,
  });

  const assistantResponse3 = response.choices[0].message.content;
  console.log(`🤖 AI: ${assistantResponse3}\n`);

  conversationHistory.push({
    role: "assistant",
    content: assistantResponse3,
  });

  // Turn 4: Test memory - hỏi lại tuổi
  console.log("👤 User: How old am I?");
  conversationHistory.push({
    role: "user",
    content: "How old am I?",
  });

  response = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: conversationHistory,
    max_tokens: 100,
  });

  const assistantResponse4 = response.choices[0].message.content;
  console.log(`🤖 AI: ${assistantResponse4}\n`);

  conversationHistory.push({
    role: "assistant",
    content: assistantResponse4,
  });

  // Turn 5: Test memory - hỏi về sở thích
  console.log("👤 User: What are my hobbies?");
  conversationHistory.push({
    role: "user",
    content: "What are my hobbies?",
  });

  response = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: conversationHistory,
    max_tokens: 100,
  });

  const assistantResponse5 = response.choices[0].message.content;
  console.log(`🤖 AI: ${assistantResponse5}\n`);

  // Summary
  console.log("=".repeat(80));
  console.log("📊 CONVERSATION SUMMARY");
  console.log("=".repeat(80));
  console.log(`Total turns: ${conversationHistory.length / 2}`);
  console.log(`Total messages in history: ${conversationHistory.length}`);
  console.log("\n✅ Memory Test Results:");

  const remembersName = assistantResponse3.toLowerCase().includes("john");
  const remembersAge = assistantResponse4.includes("25");
  const remembersHobbies =
    assistantResponse5.toLowerCase().includes("guitar") ||
    assistantResponse5.toLowerCase().includes("coding");

  console.log(`   Name memory: ${remembersName ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`   Age memory: ${remembersAge ? "✅ PASS" : "❌ FAIL"}`);
  console.log(
    `   Hobbies memory: ${remembersHobbies ? "✅ PASS" : "❌ FAIL"}`
  );

  if (remembersName && remembersAge && remembersHobbies) {
    console.log("\n🎉 AI successfully remembered all information!");
  } else {
    console.log("\n⚠️  AI forgot some information");
  }

  console.log("\n💡 How it works:");
  console.log(
    "   Framework passes entire conversation history in 'messages' array"
  );
  console.log("   Each request includes all previous messages");
  console.log("   This allows AI to maintain context across turns");
}

testConversationMemory().catch(console.error);
