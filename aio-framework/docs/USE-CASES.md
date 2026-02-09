# 💼 USE CASES - CÁC TRƯỜNG HỢP SỬ DỤNG THỰC TẾ

## 📋 Mục lục

1. [Chatbot Applications](#1-chatbot-applications)
2. [Content Generation](#2-content-generation)
3. [Data Extraction](#3-data-extraction)
4. [Code Assistant](#4-code-assistant)
5. [Document Analysis](#5-document-analysis)
6. [Customer Support](#6-customer-support)
7. [Education & Learning](#7-education--learning)
8. [Business Intelligence](#8-business-intelligence)

---

## 1. Chatbot Applications

### 1.1 Website Chatbot

Tích hợp chatbot vào website với streaming responses.

```typescript
import express from "express";
import { AIO } from "aio-llm";

const app = express();
const aio = new AIO({
  providers: [
    {
      provider: "groq",
      apiKeys: [{ key: process.env.GROQ_API_KEY }],
      models: [{ modelId: "llama-3.3-70b-versatile" }],
      priority: 100,
    },
    {
      provider: "cerebras",
      apiKeys: [{ key: process.env.CEREBRAS_API_KEY }],
      models: [{ modelId: "llama3.1-8b" }],
      priority: 80,
    },
  ],
  autoMode: true,
});

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;
  
  // Set headers cho SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  
  try {
    const stream = await aio.chatCompletionStream({
      messages,
      systemPrompt: "Bạn là trợ lý AI thân thiện và hữu ích.",
      temperature: 0.7,
      max_tokens: 500,
    });
    
    stream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000);
```

### 1.2 Discord Bot

Bot Discord với conversation memory.

```typescript
import { Client, GatewayIntentBits } from "discord.js";
import { AIO } from "aio-llm";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const aio = new AIO({
  providers: [
    {
      provider: "openrouter",
      apiKeys: [{ key: process.env.OPENROUTER_API_KEY }],
      models: [{ modelId: "arcee-ai/trinity-large-preview:free" }],
    },
  ],
});

// Store conversations per channel
const conversations = new Map();

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith("!ai ")) return;
  
  const prompt = message.content.slice(4);
  const channelId = message.channel.id;
  
  // Get or create conversation history
  if (!conversations.has(channelId)) {
    conversations.set(channelId, []);
  }
  const history = conversations.get(channelId);
  
  // Add user message
  history.push({ role: "user", content: prompt });
  
  // Keep only last 10 messages
  if (history.length > 10) {
    history.splice(0, history.length - 10);
  }
  
  try {
    const response = await aio.chatCompletion({
      provider: "openrouter",
      model: "arcee-ai/trinity-large-preview:free",
      messages: history,
      systemPrompt: "Bạn là bot Discord thân thiện.",
      max_tokens: 500,
    });
    
    const reply = response.choices[0].message.content;
    
    // Add assistant message to history
    history.push({ role: "assistant", content: reply });
    
    await message.reply(reply);
  } catch (error) {
    await message.reply("Xin lỗi, đã có lỗi xảy ra.");
  }
});

client.login(process.env.DISCORD_TOKEN);
```

### 1.3 Telegram Bot

Bot Telegram với inline keyboard.

```typescript
import TelegramBot from "node-telegram-bot-api";
import { AIO } from "aio-llm";

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

const aio = new AIO({
  providers: [
    {
      provider: "groq",
      apiKeys: [{ key: process.env.GROQ_API_KEY }],
      models: [{ modelId: "llama-3.3-70b-versatile" }],
    },
  ],
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Xin chào! Tôi là AI assistant. Hỏi tôi bất cứ điều gì!");
});

bot.on("message", async (msg) => {
  if (msg.text?.startsWith("/")) return;
  
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // Send typing indicator
  bot.sendChatAction(chatId, "typing");
  
  try {
    const response = await aio.chatCompletion({
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: text }],
      temperature: 0.7,
      max_tokens: 500,
    });
    
    bot.sendMessage(chatId, response.choices[0].message.content);
  } catch (error) {
    bot.sendMessage(chatId, "Xin lỗi, đã có lỗi xảy ra.");
  }
});

bot.launch();
```

---

## 2. Content Generation

### 2.1 Blog Post Generator

Tạo blog posts với structured output.

```typescript
import { AIO } from "aio-llm";

const aio = new AIO({
  providers: [
    {
      provider: "openrouter",
      apiKeys: [{ key: process.env.OPENROUTER_API_KEY }],
      models: [{ modelId: "arcee-ai/trinity-large-preview:free" }],
    },
  ],
});

async function generateBlogPost(topic: string, keywords: string[]) {
  const response = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: [
      {
        role: "user",
        content: `Viết một bài blog về "${topic}". Keywords: ${keywords.join(", ")}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "blog_post",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            introduction: { type: "string" },
            sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  heading: { type: "string" },
                  content: { type: "string" },
                },
                required: ["heading", "content"],
              },
            },
            conclusion: { type: "string" },
            meta_description: { type: "string" },
            tags: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["title", "introduction", "sections", "conclusion", "meta_description", "tags"],
          additionalProperties: false,
        },
      },
    },
    temperature: 0.8,
    max_tokens: 2000,
  });
  
  return JSON.parse(response.choices[0].message.content);
}

// Usage
const blogPost = await generateBlogPost(
  "Artificial Intelligence trong Y tế",
  ["AI", "healthcare", "machine learning", "diagnosis"]
);

console.log(blogPost.title);
console.log(blogPost.sections);
```

### 2.2 Social Media Content

Tạo nội dung cho nhiều platforms.

```typescript
async function generateSocialMediaContent(topic: string, platform: string) {
  const prompts = {
    facebook: "Viết post Facebook dài, engaging với emojis",
    twitter: "Viết tweet ngắn gọn, catchy (max 280 chars)",
    instagram: "Viết caption Instagram với hashtags",
    linkedin: "Viết post LinkedIn chuyên nghiệp",
  };
  
  const response = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: [
      {
        role: "user",
        content: `${prompts[platform]} về chủ đề: ${topic}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "social_post",
        strict: true,
        schema: {
          type: "object",
          properties: {
            content: { type: "string" },
            hashtags: {
              type: "array",
              items: { type: "string" },
            },
            call_to_action: { type: "string" },
          },
          required: ["content", "hashtags"],
          additionalProperties: false,
        },
      },
    },
    temperature: 0.9,
  });
  
  return JSON.parse(response.choices[0].message.content);
}

// Generate cho tất cả platforms
const platforms = ["facebook", "twitter", "instagram", "linkedin"];
const topic = "Khóa học lập trình AI mới";

for (const platform of platforms) {
  const content = await generateSocialMediaContent(topic, platform);
  console.log(`\n${platform.toUpperCase()}:`);
  console.log(content.content);
  console.log("Hashtags:", content.hashtags.join(" "));
}
```

### 2.3 Product Description Generator

Tạo mô tả sản phẩm cho e-commerce.

```typescript
async function generateProductDescription(productInfo: {
  name: string;
  category: string;
  features: string[];
  price: number;
}) {
  const response = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: [
      {
        role: "user",
        content: `Tạo mô tả sản phẩm cho:
Tên: ${productInfo.name}
Danh mục: ${productInfo.category}
Tính năng: ${productInfo.features.join(", ")}
Giá: ${productInfo.price.toLocaleString("vi-VN")} VNĐ`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "product_description",
        strict: true,
        schema: {
          type: "object",
          properties: {
            short_description: { type: "string" },
            long_description: { type: "string" },
            key_features: {
              type: "array",
              items: { type: "string" },
            },
            seo_title: { type: "string" },
            seo_description: { type: "string" },
            keywords: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["short_description", "long_description", "key_features", "seo_title", "seo_description", "keywords"],
          additionalProperties: false,
        },
      },
    },
    temperature: 0.7,
  });
  
  return JSON.parse(response.choices[0].message.content);
}

// Usage
const product = await generateProductDescription({
  name: "iPhone 15 Pro Max",
  category: "Smartphone",
  features: ["A17 Pro chip", "Titanium design", "48MP camera", "USB-C"],
  price: 29990000,
});

console.log(product);
```

---

## 3. Data Extraction

### 3.1 Resume Parser

Extract thông tin từ CV.

```typescript
async function parseResume(resumeText: string) {
  const response = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: [
      {
        role: "user",
        content: `Extract thông tin từ CV sau:\n\n${resumeText}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "resume_data",
        strict: true,
        schema: {
          type: "object",
          properties: {
            personal_info: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" },
                location: { type: "string" },
              },
              required: ["name"],
            },
            summary: { type: "string" },
            experience: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  company: { type: "string" },
                  position: { type: "string" },
                  duration: { type: "string" },
                  responsibilities: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["company", "position"],
              },
            },
            education: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  school: { type: "string" },
                  degree: { type: "string" },
                  field: { type: "string" },
                  year: { type: "string" },
                },
                required: ["school", "degree"],
              },
            },
            skills: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["personal_info", "experience", "education", "skills"],
          additionalProperties: false,
        },
      },
    },
  });
  
  return JSON.parse(response.choices[0].message.content);
}

// Usage
const resumeText = `
Nguyễn Văn A
Email: nguyenvana@example.com
Phone: 0123456789

KINH NGHIỆM:
- Software Engineer tại ABC Company (2020-2023)
  + Phát triển web applications với React và Node.js
  + Quản lý team 5 người

HỌC VẤN:
- Đại học Bách Khoa Hà Nội (2016-2020)
  Cử nhân Khoa học Máy tính

KỸ NĂNG:
JavaScript, TypeScript, React, Node.js, Python
`;

const parsedResume = await parseResume(resumeText);
console.log(parsedResume);
```

### 3.2 Invoice Data Extraction

Extract dữ liệu từ hóa đơn.

```typescript
async function extractInvoiceData(invoiceText: string) {
  const response = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: [
      {
        role: "user",
        content: `Extract thông tin từ hóa đơn:\n\n${invoiceText}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "invoice_data",
        strict: true,
        schema: {
          type: "object",
          properties: {
            invoice_number: { type: "string" },
            date: { type: "string" },
            vendor: {
              type: "object",
              properties: {
                name: { type: "string" },
                address: { type: "string" },
                tax_id: { type: "string" },
              },
              required: ["name"],
            },
            customer: {
              type: "object",
              properties: {
                name: { type: "string" },
                address: { type: "string" },
              },
              required: ["name"],
            },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  quantity: { type: "number" },
                  unit_price: { type: "number" },
                  total: { type: "number" },
                },
                required: ["description", "quantity", "unit_price", "total"],
              },
            },
            subtotal: { type: "number" },
            tax: { type: "number" },
            total: { type: "number" },
          },
          required: ["invoice_number", "date", "vendor", "items", "total"],
          additionalProperties: false,
        },
      },
    },
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

### 3.3 Email Classification

Phân loại và extract thông tin từ emails.

```typescript
async function classifyEmail(emailContent: string) {
  const response = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: [
      {
        role: "user",
        content: `Phân tích email sau:\n\n${emailContent}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "email_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              enum: ["support", "sales", "complaint", "inquiry", "spam", "other"],
            },
            priority: {
              type: "string",
              enum: ["high", "medium", "low"],
            },
            sentiment: {
              type: "string",
              enum: ["positive", "neutral", "negative"],
            },
            summary: { type: "string" },
            action_required: { type: "boolean" },
            suggested_response: { type: "string" },
          },
          required: ["category", "priority", "sentiment", "summary", "action_required"],
          additionalProperties: false,
        },
      },
    },
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

---

## 4. Code Assistant

### 4.1 Code Review Bot

Tự động review code và đưa ra suggestions.

```typescript
async function reviewCode(code: string, language: string) {
  const response = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: [
      {
        role: "user",
        content: `Review đoạn code ${language} sau và đưa ra suggestions:\n\n\`\`\`${language}\n${code}\n\`\`\``,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "code_review",
        strict: true,
        schema: {
          type: "object",
          properties: {
            overall_quality: {
              type: "string",
              enum: ["excellent", "good", "fair", "poor"],
            },
            issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  severity: {
                    type: "string",
                    enum: ["critical", "major", "minor", "suggestion"],
                  },
                  line: { type: "number" },
                  description: { type: "string" },
                  suggestion: { type: "string" },
                },
                required: ["severity", "description", "suggestion"],
              },
            },
            strengths: {
              type: "array",
              items: { type: "string" },
            },
            improvements: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["overall_quality", "issues", "strengths", "improvements"],
          additionalProperties: false,
        },
      },
    },
    temperature: 0.3,
  });
  
  return JSON.parse(response.choices[0].message.content);
}

// Usage
const code = `
function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price * items[i].quantity;
  }
  return total;
}
`;

const review = await reviewCode(code, "javascript");
console.log("Quality:", review.overall_quality);
console.log("Issues:", review.issues);
console.log("Improvements:", review.improvements);
```

### 4.2 Code Generator

Generate code từ mô tả.

```typescript
async function generateCode(description: string, language: string) {
  const response = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: [
      {
        role: "user",
        content: `Viết code ${language} để: ${description}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "code_generation",
        strict: true,
        schema: {
          type: "object",
          properties: {
            code: { type: "string" },
            explanation: { type: "string" },
            dependencies: {
              type: "array",
              items: { type: "string" },
            },
            usage_example: { type: "string" },
          },
          required: ["code", "explanation"],
          additionalProperties: false,
        },
      },
    },
    temperature: 0.5,
  });
  
  return JSON.parse(response.choices[0].message.content);
}

// Usage
const result = await generateCode(
  "Tạo function để validate email address",
  "typescript"
);

console.log(result.code);
console.log("\nExplanation:", result.explanation);
console.log("\nUsage:", result.usage_example);
```

### 4.3 Bug Finder

Tìm bugs trong code.

```typescript
async function findBugs(code: string, language: string) {
  const response = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: [
      {
        role: "user",
        content: `Tìm bugs trong code ${language}:\n\n\`\`\`${language}\n${code}\n\`\`\``,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "bug_report",
        strict: true,
        schema: {
          type: "object",
          properties: {
            bugs_found: { type: "number" },
            bugs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["syntax", "logic", "runtime", "security", "performance"],
                  },
                  severity: {
                    type: "string",
                    enum: ["critical", "high", "medium", "low"],
                  },
                  line: { type: "number" },
                  description: { type: "string" },
                  fix: { type: "string" },
                },
                required: ["type", "severity", "description", "fix"],
              },
            },
          },
          required: ["bugs_found", "bugs"],
          additionalProperties: false,
        },
      },
    },
    temperature: 0.2,
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

---

## 5. Document Analysis

### 5.1 PDF Document Analyzer (Google AI)

Phân tích PDF documents.

```typescript
import fs from "fs";

async function analyzePDF(pdfPath: string, question: string) {
  const pdfBuffer = fs.readFileSync(pdfPath);
  const base64PDF = pdfBuffer.toString("base64");
  
  const response = await aio.chatCompletion({
    provider: "google-ai",
    model: "gemini-1.5-flash",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: question },
          {
            type: "file",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64PDF,
            },
          },
        ],
      },
    ],
    temperature: 0.3,
  });
  
  return response.choices[0].message.content;
}

// Usage
const summary = await analyzePDF(
  "./contract.pdf",
  "Tóm tắt các điều khoản chính trong hợp đồng này"
);

console.log(summary);
```

### 5.2 Image OCR và Analysis

Extract text và analyze images.

```typescript
async function analyzeImage(imagePath: string) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");
  
  const response = await aio.chatCompletion({
    provider: "google-ai",
    model: "gemini-1.5-flash",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract tất cả text trong hình và mô tả nội dung",
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: base64Image,
            },
          },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "image_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            extracted_text: { type: "string" },
            description: { type: "string" },
            objects_detected: {
              type: "array",
              items: { type: "string" },
            },
            text_language: { type: "string" },
          },
          required: ["extracted_text", "description", "objects_detected"],
          additionalProperties: false,
        },
      },
    },
  });
  
  return JSON.parse(response.choices[0].message.content);
}

// Usage
const analysis = await analyzeImage("./receipt.jpg");
console.log("Text:", analysis.extracted_text);
console.log("Description:", analysis.description);
```

### 5.3 Video Summarization

Tóm tắt video content.

```typescript
async function summarizeVideo(videoPath: string) {
  const videoBuffer = fs.readFileSync(videoPath);
  const base64Video = videoBuffer.toString("base64");
  
  const response = await aio.chatCompletion({
    provider: "google-ai",
    model: "gemini-1.5-flash",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Tóm tắt nội dung video này, bao gồm các điểm chính và timestamps",
          },
          {
            type: "file",
            source: {
              type: "base64",
              media_type: "video/mp4",
              data: base64Video,
            },
          },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "video_summary",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            summary: { type: "string" },
            key_points: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  timestamp: { type: "string" },
                  description: { type: "string" },
                },
                required: ["timestamp", "description"],
              },
            },
            topics: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["title", "summary", "key_points", "topics"],
          additionalProperties: false,
        },
      },
    },
    max_tokens: 2000,
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

---

## 6. Customer Support

### 6.1 Automated Support Ticket System

Tự động phân loại và trả lời support tickets.

```typescript
interface SupportTicket {
  id: string;
  customer: string;
  subject: string;
  message: string;
}

async function processTicket(ticket: SupportTicket) {
  // Step 1: Classify ticket
  const classification = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: [
      {
        role: "user",
        content: `Phân loại support ticket:\nSubject: ${ticket.subject}\nMessage: ${ticket.message}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ticket_classification",
        strict: true,
        schema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              enum: ["technical", "billing", "account", "feature_request", "bug_report", "other"],
            },
            priority: {
              type: "string",
              enum: ["urgent", "high", "medium", "low"],
            },
            sentiment: {
              type: "string",
              enum: ["angry", "frustrated", "neutral", "satisfied"],
            },
            can_auto_respond: { type: "boolean" },
          },
          required: ["category", "priority", "sentiment", "can_auto_respond"],
          additionalProperties: false,
        },
      },
    },
  });
  
  const classData = JSON.parse(classification.choices[0].message.content);
  
  // Step 2: Generate response if can auto-respond
  if (classData.can_auto_respond) {
    const response = await aio.chatCompletion({
      provider: "openrouter",
      model: "arcee-ai/trinity-large-preview:free",
      messages: [
        {
          role: "user",
          content: `Viết email trả lời customer support ticket:\n\nCustomer: ${ticket.customer}\nSubject: ${ticket.subject}\nMessage: ${ticket.message}\n\nCategory: ${classData.category}\nPriority: ${classData.priority}`,
        },
      ],
      systemPrompt: "Bạn là customer support agent chuyên nghiệp, thân thiện và hữu ích.",
      temperature: 0.7,
    });
    
    return {
      classification: classData,
      response: response.choices[0].message.content,
    };
  }
  
  return {
    classification: classData,
    response: null,
    note: "Ticket cần human review",
  };
}

// Usage
const ticket: SupportTicket = {
  id: "TICKET-001",
  customer: "Nguyễn Văn A",
  subject: "Không thể đăng nhập vào tài khoản",
  message: "Tôi đã thử reset password nhưng không nhận được email. Xin hãy giúp tôi.",
};

const result = await processTicket(ticket);
console.log("Classification:", result.classification);
console.log("Response:", result.response);
```

### 6.2 FAQ Chatbot

Chatbot trả lời FAQ tự động.

```typescript
const faqDatabase = [
  {
    question: "Làm thế nào để reset password?",
    answer: "Bạn có thể reset password bằng cách click vào 'Quên mật khẩu' trên trang đăng nhập...",
  },
  {
    question: "Chính sách hoàn tiền là gì?",
    answer: "Chúng tôi có chính sách hoàn tiền trong vòng 30 ngày...",
  },
  // ... more FAQs
];

async function answerFAQ(userQuestion: string) {
  // Convert FAQ database to context
  const faqContext = faqDatabase
    .map((faq, i) => `${i + 1}. Q: ${faq.question}\n   A: ${faq.answer}`)
    .join("\n\n");
  
  const response = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: [
      {
        role: "user",
        content: `Dựa vào FAQ database sau, trả lời câu hỏi của customer:\n\nFAQ:\n${faqContext}\n\nCâu hỏi: ${userQuestion}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "faq_response",
        strict: true,
        schema: {
          type: "object",
          properties: {
            answer: { type: "string" },
            confidence: {
              type: "string",
              enum: ["high", "medium", "low"],
            },
            related_faqs: {
              type: "array",
              items: { type: "number" },
            },
            needs_human: { type: "boolean" },
          },
          required: ["answer", "confidence", "needs_human"],
          additionalProperties: false,
        },
      },
    },
    temperature: 0.3,
  });
  
  return JSON.parse(response.choices[0].message.content);
}

// Usage
const answer = await answerFAQ("Tôi muốn đổi trả sản phẩm, làm thế nào?");
console.log(answer);
```

### 6.3 Sentiment Analysis Dashboard

Phân tích sentiment của customer feedback.

```typescript
async function analyzeFeedback(feedbacks: string[]) {
  const results = [];
  
  for (const feedback of feedbacks) {
    const response = await aio.chatCompletion({
      provider: "openrouter",
      model: "arcee-ai/trinity-large-preview:free",
      messages: [
        {
          role: "user",
          content: `Phân tích sentiment của feedback: "${feedback}"`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sentiment_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              sentiment: {
                type: "string",
                enum: ["very_positive", "positive", "neutral", "negative", "very_negative"],
              },
              score: { type: "number" }, // -1 to 1
              emotions: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["happy", "satisfied", "frustrated", "angry", "disappointed", "excited"],
                },
              },
              topics: {
                type: "array",
                items: { type: "string" },
              },
              action_required: { type: "boolean" },
            },
            required: ["sentiment", "score", "emotions", "topics", "action_required"],
            additionalProperties: false,
          },
        },
      },
    });
    
    results.push({
      feedback,
      analysis: JSON.parse(response.choices[0].message.content),
    });
  }
  
  // Calculate overall statistics
  const avgScore = results.reduce((sum, r) => sum + r.analysis.score, 0) / results.length;
  const sentimentCounts = results.reduce((acc, r) => {
    acc[r.analysis.sentiment] = (acc[r.analysis.sentiment] || 0) + 1;
    return acc;
  }, {});
  
  return {
    individual: results,
    overall: {
      average_score: avgScore,
      sentiment_distribution: sentimentCounts,
      total_feedbacks: results.length,
    },
  };
}

// Usage
const feedbacks = [
  "Sản phẩm rất tốt, tôi rất hài lòng!",
  "Giao hàng chậm quá, không hài lòng",
  "Chất lượng ổn, giá hơi cao",
];

const analysis = await analyzeFeedback(feedbacks);
console.log(analysis.overall);
```

---

## 7. Education & Learning

### 7.1 Personalized Tutor

AI tutor cá nhân hóa.

```typescript
interface StudentProfile {
  name: string;
  level: string;
  subject: string;
  weaknesses: string[];
}

async function createLesson(profile: StudentProfile, topic: string) {
  const response = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: [
      {
        role: "user",
        content: `Tạo bài học về "${topic}" cho học sinh:
- Tên: ${profile.name}
- Level: ${profile.level}
- Môn: ${profile.subject}
- Điểm yếu: ${profile.weaknesses.join(", ")}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "lesson_plan",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            objectives: {
              type: "array",
              items: { type: "string" },
            },
            content: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  section: { type: "string" },
                  explanation: { type: "string" },
                  examples: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["section", "explanation", "examples"],
              },
            },
            exercises: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  difficulty: {
                    type: "string",
                    enum: ["easy", "medium", "hard"],
                  },
                  answer: { type: "string" },
                },
                required: ["question", "difficulty", "answer"],
              },
            },
            tips: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["title", "objectives", "content", "exercises", "tips"],
          additionalProperties: false,
        },
      },
    },
    temperature: 0.7,
    max_tokens: 2000,
  });
  
  return JSON.parse(response.choices[0].message.content);
}

// Usage
const lesson = await createLesson(
  {
    name: "Minh",
    level: "Lớp 10",
    subject: "Toán",
    weaknesses: ["phương trình bậc 2", "hệ phương trình"],
  },
  "Giải phương trình bậc 2"
);

console.log(lesson);
```

### 7.2 Quiz Generator

Tạo quiz tự động.

```typescript
async function generateQuiz(topic: string, difficulty: string, numQuestions: number) {
  const response = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: [
      {
        role: "user",
        content: `Tạo ${numQuestions} câu hỏi trắc nghiệm về "${topic}" với độ khó ${difficulty}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "quiz",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: {
                    type: "array",
                    items: { type: "string" },
                  },
                  correct_answer: { type: "number" }, // Index of correct option
                  explanation: { type: "string" },
                },
                required: ["question", "options", "correct_answer", "explanation"],
              },
            },
          },
          required: ["title", "questions"],
          additionalProperties: false,
        },
      },
    },
  });
  
  return JSON.parse(response.choices[0].message.content);
}

// Usage
const quiz = await generateQuiz("JavaScript Basics", "medium", 5);
console.log(quiz);
```

---

## 8. Business Intelligence

### 8.1 Market Research Analyzer

Phân tích market research data.

```typescript
async function analyzeMarketData(data: {
  industry: string;
  competitors: string[];
  trends: string[];
  customerFeedback: string[];
}) {
  const response = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: [
      {
        role: "user",
        content: `Phân tích market research data:
Industry: ${data.industry}
Competitors: ${data.competitors.join(", ")}
Trends: ${data.trends.join(", ")}
Customer Feedback: ${data.customerFeedback.join("; ")}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "market_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            market_overview: { type: "string" },
            opportunities: {
              type: "array",
              items: { type: "string" },
            },
            threats: {
              type: "array",
              items: { type: "string" },
            },
            competitive_advantages: {
              type: "array",
              items: { type: "string" },
            },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  priority: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                  },
                  expected_impact: { type: "string" },
                },
                required: ["action", "priority", "expected_impact"],
              },
            },
          },
          required: ["market_overview", "opportunities", "threats", "recommendations"],
          additionalProperties: false,
        },
      },
    },
    temperature: 0.5,
    max_tokens: 2000,
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

### 8.2 Sales Report Generator

Tạo sales reports tự động.

```typescript
async function generateSalesReport(salesData: {
  period: string;
  revenue: number;
  transactions: number;
  topProducts: Array<{ name: string; sales: number }>;
  regions: Array<{ name: string; revenue: number }>;
}) {
  const response = await aio.chatCompletion({
    provider: "openrouter",
    model: "arcee-ai/trinity-large-preview:free",
    messages: [
      {
        role: "user",
        content: `Tạo sales report từ data:\n${JSON.stringify(salesData, null, 2)}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "sales_report",
        strict: true,
        schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            key_metrics: {
              type: "object",
              properties: {
                total_revenue: { type: "number" },
                growth_rate: { type: "string" },
                average_transaction: { type: "number" },
              },
              required: ["total_revenue", "growth_rate", "average_transaction"],
            },
            insights: {
              type: "array",
              items: { type: "string" },
            },
            recommendations: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["executive_summary", "key_metrics", "insights", "recommendations"],
          additionalProperties: false,
        },
      },
    },
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

---

**Đây là một số use cases phổ biến. Framework AIO-LLM có thể được sử dụng cho nhiều ứng dụng khác tùy theo nhu cầu của bạn!**
