# 📚 Tài liệu AIO-LLM Framework

Chào mừng bạn đến với tài liệu chi tiết của AIO-LLM Framework!

## 📖 Danh sách tài liệu

### 1. [Hướng dẫn sử dụng](./HUONG-DAN-SU-DUNG.md)
**Tài liệu đầy đủ về cách sử dụng framework**

Nội dung bao gồm:
- ✨ Giới thiệu và tính năng chính
- 📦 Cài đặt và setup
- 🚀 Khởi tạo cơ bản
- 🎮 Các chế độ hoạt động (Direct Mode, Auto Mode)
- 🔑 Priority Management
- 🎨 Tính năng nâng cao:
  - System Prompt
  - Temperature và Sampling
  - Streaming Responses
  - Abort/Cancel Requests
  - Multimodal Input (Images, Video, Audio, PDF)
  - Structured Outputs (JSON Mode, JSON Schema)
  - Conversation Memory
  - Key Management
  - Error Handling và Retry Logic
  - Logging
- 📖 API Reference đầy đủ
- 💡 Examples thực tế
- 🔧 Troubleshooting
- 🎯 Best Practices

**Đọc tài liệu này nếu bạn:**
- Mới bắt đầu với framework
- Muốn tìm hiểu các tính năng
- Cần reference cho API
- Gặp vấn đề và cần troubleshoot

---

### 2. [Kiến trúc dự án](./KIEN-TRUC-DU-AN.md)
**Tài liệu về kiến trúc và cấu trúc code**

Nội dung bao gồm:
- 📁 Cấu trúc thư mục chi tiết
- 🎯 Kiến trúc tổng quan (Layered Architecture)
- 🔧 Chi tiết các module:
  - AIO Main Class
  - Core Handlers (Auto Mode, Direct Mode, Stream Handler)
  - Provider Layer (OpenRouter, Groq, Cerebras, Google AI)
  - Utility Layer (Logger, Retry, Validation, Key Manager, Abort Manager)
- 🔄 Data Flow (Request flow, Error handling flow)
- 🎨 Design Patterns được sử dụng
- 🔐 Security Considerations
- 📊 Performance Optimization
- 🧪 Testing Strategy
- 🚀 Deployment
- 📈 Monitoring & Observability
- 🔄 Extensibility (Cách thêm provider mới)
- 📚 Dependencies
- 🎯 Future Enhancements
- 📝 Code Style & Conventions

**Đọc tài liệu này nếu bạn:**
- Muốn hiểu cách framework hoạt động
- Cần customize hoặc extend framework
- Muốn contribute vào project
- Đang debug issues phức tạp

---

### 3. [Use Cases](./USE-CASES.md)
**Các trường hợp sử dụng thực tế với code examples**

Nội dung bao gồm:

#### 1. Chatbot Applications
- Website Chatbot với streaming
- Discord Bot với conversation memory
- Telegram Bot với inline keyboard

#### 2. Content Generation
- Blog Post Generator
- Social Media Content (Facebook, Twitter, Instagram, LinkedIn)
- Product Description Generator

#### 3. Data Extraction
- Resume Parser
- Invoice Data Extraction
- Email Classification

#### 4. Code Assistant
- Code Review Bot
- Code Generator
- Bug Finder

#### 5. Document Analysis
- PDF Document Analyzer
- Image OCR và Analysis
- Video Summarization

#### 6. Customer Support
- Automated Support Ticket System
- FAQ Chatbot
- Sentiment Analysis Dashboard

#### 7. Education & Learning
- Personalized Tutor
- Quiz Generator

#### 8. Business Intelligence
- Market Research Analyzer
- Sales Report Generator

**Đọc tài liệu này nếu bạn:**
- Cần ý tưởng cho ứng dụng
- Muốn xem code examples thực tế
- Đang implement một use case cụ thể
- Muốn học cách sử dụng các tính năng nâng cao

---

## 🚀 Quick Start

### Bắt đầu nhanh

1. **Cài đặt:**
```bash
npm install aio-llm
```

2. **Setup API Keys:**
```bash
# Tạo file .env
OPENROUTER_API_KEY=sk-or-v1-xxxxx
GROQ_API_KEY=gsk_xxxxx
CEREBRAS_API_KEY=csk_xxxxx
GOOGLE_AI_API_KEY=AIzaSyxxxxx
```

3. **Code đầu tiên:**
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

const response = await aio.chatCompletion({
  provider: "openrouter",
  model: "arcee-ai/trinity-large-preview:free",
  messages: [
    { role: "user", content: "Xin chào!" }
  ],
});

console.log(response.choices[0].message.content);
```

---

## 📚 Tài liệu theo mục đích

### Tôi muốn...

#### ...học cách sử dụng framework
→ Đọc [Hướng dẫn sử dụng](./HUONG-DAN-SU-DUNG.md) từ đầu đến cuối

#### ...hiểu cách framework hoạt động
→ Đọc [Kiến trúc dự án](./KIEN-TRUC-DU-AN.md)

#### ...xem code examples
→ Đọc [Use Cases](./USE-CASES.md) hoặc xem thư mục `/examples`

#### ...tìm API reference
→ Xem phần "API Reference" trong [Hướng dẫn sử dụng](./HUONG-DAN-SU-DUNG.md)

#### ...fix lỗi
→ Xem phần "Troubleshooting" trong [Hướng dẫn sử dụng](./HUONG-DAN-SU-DUNG.md)

#### ...thêm provider mới
→ Xem phần "Extensibility" trong [Kiến trúc dự án](./KIEN-TRUC-DU-AN.md)

#### ...optimize performance
→ Xem phần "Performance Optimization" trong [Kiến trúc dự án](./KIEN-TRUC-DU-AN.md)

#### ...implement một use case cụ thể
→ Tìm use case tương tự trong [Use Cases](./USE-CASES.md)

---

## 🎯 Tính năng nổi bật

### 🔄 Multi-Provider Support
Hỗ trợ 4 providers: OpenRouter, Groq, Cerebras, Google AI

### 🎯 Auto Fallback
Tự động chuyển sang provider/model khác khi fail

### 🔑 Priority Management
Quản lý độ ưu tiên cho providers, models và API keys

### 🔁 Key Rotation
Tự động thử các API keys khác khi key hiện tại fail

### 🖼️ Multimodal Support
Hỗ trợ images, video, audio, PDF (Google AI)

### 📊 Structured Outputs
JSON mode và JSON Schema validation

### 🌊 Streaming
Real-time streaming responses với abort control

### 🛑 Abort Control
Cancel requests bất kỳ lúc nào

### 🔄 Retry Logic
Exponential backoff retry với error classification

### ✅ Validation
Zod schema validation cho config và requests

### 📝 Logging
Winston logger với multiple levels

---

## 🔗 Links hữu ích

### Documentation
- [Main README](../README.md)
- [Examples](../examples/)
- [Source Code](../src/)

### Provider Documentation
- [OpenRouter](https://openrouter.ai/docs)
- [Groq](https://console.groq.com/docs)
- [Cerebras](https://inference-docs.cerebras.ai/)
- [Google AI](https://ai.google.dev/docs)

### Free Models
- [OpenRouter Free Models](https://openrouter.ai/models?order=newest&max_price=0)
- [Groq Models](https://console.groq.com/docs/models)
- [Cerebras Models](https://inference-docs.cerebras.ai/introduction)
- [Google AI Pricing](https://ai.google.dev/pricing)

---

## 💬 Support

Nếu bạn có câu hỏi hoặc gặp vấn đề:

1. **Đọc tài liệu:** Hầu hết câu hỏi đều được trả lời trong docs
2. **Xem examples:** Check thư mục `/examples` cho code mẫu
3. **GitHub Issues:** Tạo issue nếu tìm thấy bug
4. **Discussions:** Tham gia discussions để hỏi đáp

---

## 📄 License

MIT License - Xem file [LICENSE](../LICENSE) để biết thêm chi tiết.

---

**Chúc bạn code vui vẻ với AIO-LLM Framework! 🚀**
