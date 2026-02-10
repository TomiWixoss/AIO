# 📋 HƯỚNG DẪN SỬ DỤNG JSON MODE VỚI GOOGLE AI

## 🎯 Tổng quan

Google AI (Gemini) hỗ trợ 2 loại JSON response format:
1. **JSON Object Mode**: Trả về valid JSON (không có schema cụ thể)
2. **JSON Schema Mode**: Trả về JSON theo schema cụ thể (structured outputs)

---

## 1️⃣ JSON Object Mode

### Cách sử dụng

```typescript
import { AIO } from "aio-llm";

const aio = new AIO({
  providers: [
    {
      provider: "google-ai",
      apiKeys: [{ key: process.env.GOOGLE_AI_API_KEY }],
      models: [{ modelId: "gemini-1.5-flash" }],
    },
  ],
});

const response = await aio.chatCompletion({
  provider: "google-ai",
  model: "gemini-1.5-flash",
  messages: [
    {
      role: "user",
      content: "Trả về thông tin: Tên: Nguyễn Văn A, Tuổi: 25, Thành phố: Hà Nội",
    },
  ],
  response_format: { type: "json_object" }, // ← JSON Object Mode
});

const data = JSON.parse(response.choices[0].message.content);
console.log(data);
// Output: { "name": "Nguyễn Văn A", "age": 25, "city": "Hà Nội" }
```

### Cách hoạt động

Khi bạn set `response_format: { type: "json_object" }`, framework sẽ:
1. Set `responseMimeType: "application/json"` trong Google AI config
2. Google AI sẽ trả về valid JSON
3. Bạn cần parse JSON bằng `JSON.parse()`

### Lưu ý

- ✅ Luôn trả về valid JSON
- ❌ Không đảm bảo schema cụ thể
- ⚠️ Nên nhắc AI trả về JSON trong prompt

---

## 2️⃣ JSON Schema Mode (Structured Outputs)

### Cách sử dụng cơ bản

```typescript
const response = await aio.chatCompletion({
  provider: "google-ai",
  model: "gemini-1.5-flash",
  messages: [
    {
      role: "user",
      content: "Phân tích review: iPhone 15 Pro - Camera tuyệt vời, giá cao. Rating: 4.5/5",
    },
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "product_review", // Tên schema (bắt buộc)
      schema: {
        type: "object",
        properties: {
          product_name: { type: "string" },
          rating: { type: "number" },
          sentiment: {
            type: "string",
            enum: ["positive", "negative", "neutral"],
          },
          key_features: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["product_name", "rating", "sentiment"],
      },
    },
  },
});

const data = JSON.parse(response.choices[0].message.content);
console.log(data);
// Output:
// {
//   "product_name": "iPhone 15 Pro",
//   "rating": 4.5,
//   "sentiment": "positive",
//   "key_features": ["Camera tuyệt vời"]
// }
```

### Cách hoạt động

Khi bạn set `response_format: { type: "json_schema" }`, framework sẽ:
1. Set `responseMimeType: "application/json"` trong Google AI config
2. Set `responseSchema: schema` trong Google AI config
3. Google AI sẽ trả về JSON tuân thủ schema

### Schema Format (JSON Schema)

Google AI sử dụng JSON Schema format. Các types được hỗ trợ:

#### String

```typescript
{
  type: "string"
}

// Với enum
{
  type: "string",
  enum: ["option1", "option2", "option3"]
}

// Với description
{
  type: "string",
  description: "Tên sản phẩm"
}
```

#### Number

```typescript
{
  type: "number"
}

// Với constraints
{
  type: "number",
  minimum: 0,
  maximum: 5
}
```

#### Integer

```typescript
{
  type: "integer"
}

// Với constraints
{
  type: "integer",
  minimum: 1,
  maximum: 100
}
```

#### Boolean

```typescript
{
  type: "boolean"
}
```

#### Array

```typescript
{
  type: "array",
  items: { type: "string" }
}

// Array of objects
{
  type: "array",
  items: {
    type: "object",
    properties: {
      name: { type: "string" },
      value: { type: "number" }
    },
    required: ["name", "value"]
  }
}
```

#### Object

```typescript
{
  type: "object",
  properties: {
    field1: { type: "string" },
    field2: { type: "number" }
  },
  required: ["field1"]
}
```

#### Nested Objects

```typescript
{
  type: "object",
  properties: {
    user: {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "integer" }
      },
      required: ["name"]
    },
    address: {
      type: "object",
      properties: {
        city: { type: "string" },
        country: { type: "string" }
      }
    }
  },
  required: ["user"]
}
```

---

## 📝 Examples chi tiết

### Example 1: Extract thông tin người dùng

```typescript
const response = await aio.chatCompletion({
  provider: "google-ai",
  model: "gemini-1.5-flash",
  messages: [
    {
      role: "user",
      content: "Extract info: John Doe, 30 tuổi, Software Engineer tại Google, email: john@example.com",
    },
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "person_info",
      schema: {
        type: "object",
        properties: {
          name: { 
            type: "string",
            description: "Tên đầy đủ"
          },
          age: { 
            type: "integer",
            description: "Tuổi"
          },
          job_title: { 
            type: "string",
            description: "Chức danh công việc"
          },
          company: { 
            type: "string",
            description: "Tên công ty"
          },
          email: { 
            type: "string",
            description: "Địa chỉ email"
          },
        },
        required: ["name", "age", "job_title", "company", "email"],
      },
    },
  },
});

const data = JSON.parse(response.choices[0].message.content);
console.log(data);
// {
//   "name": "John Doe",
//   "age": 30,
//   "job_title": "Software Engineer",
//   "company": "Google",
//   "email": "john@example.com"
// }
```

### Example 2: Phân tích sentiment với enum

```typescript
const response = await aio.chatCompletion({
  provider: "google-ai",
  model: "gemini-1.5-flash",
  messages: [
    {
      role: "user",
      content: "Phân tích sentiment: Sản phẩm rất tốt, tôi rất hài lòng!",
    },
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "sentiment_analysis",
      schema: {
        type: "object",
        properties: {
          sentiment: {
            type: "string",
            enum: ["very_positive", "positive", "neutral", "negative", "very_negative"],
            description: "Mức độ sentiment"
          },
          score: {
            type: "number",
            description: "Điểm sentiment từ -1 đến 1"
          },
          confidence: {
            type: "number",
            description: "Độ tin cậy từ 0 đến 1"
          },
        },
        required: ["sentiment", "score", "confidence"],
      },
    },
  },
});

const data = JSON.parse(response.choices[0].message.content);
console.log(data);
// {
//   "sentiment": "very_positive",
//   "score": 0.95,
//   "confidence": 0.98
// }
```

### Example 3: Array of objects

```typescript
const response = await aio.chatCompletion({
  provider: "google-ai",
  model: "gemini-1.5-flash",
  messages: [
    {
      role: "user",
      content: "Extract products: iPhone 15 Pro - $999, MacBook Air - $1199, AirPods Pro - $249",
    },
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "product_list",
      schema: {
        type: "object",
        properties: {
          products: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                price: { type: "number" },
                currency: { type: "string" },
              },
              required: ["name", "price"],
            },
          },
          total_items: { type: "integer" },
        },
        required: ["products", "total_items"],
      },
    },
  },
});

const data = JSON.parse(response.choices[0].message.content);
console.log(data);
// {
//   "products": [
//     { "name": "iPhone 15 Pro", "price": 999, "currency": "USD" },
//     { "name": "MacBook Air", "price": 1199, "currency": "USD" },
//     { "name": "AirPods Pro", "price": 249, "currency": "USD" }
//   ],
//   "total_items": 3
// }
```

### Example 4: Nested objects

```typescript
const response = await aio.chatCompletion({
  provider: "google-ai",
  model: "gemini-1.5-flash",
  messages: [
    {
      role: "user",
      content: "Parse: Order #12345, Customer: John Doe (john@example.com), Items: 2x iPhone ($999 each), Total: $1998",
    },
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "order_info",
      schema: {
        type: "object",
        properties: {
          order_id: { type: "string" },
          customer: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string" },
            },
            required: ["name", "email"],
          },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product: { type: "string" },
                quantity: { type: "integer" },
                unit_price: { type: "number" },
              },
              required: ["product", "quantity", "unit_price"],
            },
          },
          total: { type: "number" },
        },
        required: ["order_id", "customer", "items", "total"],
      },
    },
  },
});

const data = JSON.parse(response.choices[0].message.content);
console.log(data);
// {
//   "order_id": "12345",
//   "customer": {
//     "name": "John Doe",
//     "email": "john@example.com"
//   },
//   "items": [
//     {
//       "product": "iPhone",
//       "quantity": 2,
//       "unit_price": 999
//     }
//   ],
//   "total": 1998
// }
```

### Example 5: Complex schema với descriptions

```typescript
const response = await aio.chatCompletion({
  provider: "google-ai",
  model: "gemini-1.5-flash",
  messages: [
    {
      role: "user",
      content: "Tạo profile cho: Nguyễn Văn A, 25 tuổi, Developer, skills: JavaScript, Python, React",
    },
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "user_profile",
      description: "User profile information",
      schema: {
        type: "object",
        properties: {
          personal_info: {
            type: "object",
            description: "Thông tin cá nhân",
            properties: {
              full_name: { 
                type: "string",
                description: "Họ và tên đầy đủ"
              },
              age: { 
                type: "integer",
                description: "Tuổi"
              },
            },
            required: ["full_name", "age"],
          },
          professional_info: {
            type: "object",
            description: "Thông tin nghề nghiệp",
            properties: {
              title: { 
                type: "string",
                description: "Chức danh"
              },
              skills: {
                type: "array",
                description: "Danh sách kỹ năng",
                items: { type: "string" },
              },
              experience_years: {
                type: "integer",
                description: "Số năm kinh nghiệm"
              },
            },
            required: ["title", "skills"],
          },
        },
        required: ["personal_info", "professional_info"],
      },
    },
  },
});

const data = JSON.parse(response.choices[0].message.content);
console.log(data);
// {
//   "personal_info": {
//     "full_name": "Nguyễn Văn A",
//     "age": 25
//   },
//   "professional_info": {
//     "title": "Developer",
//     "skills": ["JavaScript", "Python", "React"],
//     "experience_years": 3
//   }
// }
```

---

## ⚙️ Configuration Options

### Không có `strict` field

**Lưu ý quan trọng:** Google AI không có field `strict` như OpenRouter/Groq/Cerebras. 

❌ **SAI:**
```typescript
response_format: {
  type: "json_schema",
  json_schema: {
    name: "schema_name",
    strict: true, // ← Google AI không có field này!
    schema: {...}
  }
}
```

✅ **ĐÚNG:**
```typescript
response_format: {
  type: "json_schema",
  json_schema: {
    name: "schema_name", // Chỉ cần name và schema
    schema: {...}
  }
}
```

### Optional fields

- `name`: **Bắt buộc** - Tên của schema
- `description`: **Optional** - Mô tả schema
- `schema`: **Bắt buộc** - JSON Schema object

```typescript
response_format: {
  type: "json_schema",
  json_schema: {
    name: "my_schema",
    description: "This is my schema description", // Optional
    schema: {
      type: "object",
      properties: {...},
      required: [...]
    }
  }
}
```

---

## 🎯 Best Practices

### 1. Luôn dùng `required` field

```typescript
// ✅ GOOD
schema: {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "integer" }
  },
  required: ["name", "age"] // Bắt buộc có
}

// ❌ BAD
schema: {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "integer" }
  }
  // Thiếu required
}
```

### 2. Thêm descriptions cho clarity

```typescript
schema: {
  type: "object",
  properties: {
    sentiment: {
      type: "string",
      enum: ["positive", "negative", "neutral"],
      description: "Overall sentiment of the text" // Giúp AI hiểu rõ hơn
    }
  }
}
```

### 3. Sử dụng enum cho fixed values

```typescript
// ✅ GOOD - Sử dụng enum
{
  type: "string",
  enum: ["small", "medium", "large"]
}

// ❌ BAD - Không dùng enum
{
  type: "string" // AI có thể trả về bất kỳ string nào
}
```

### 4. Validate sau khi parse

```typescript
const response = await aio.chatCompletion({...});
const data = JSON.parse(response.choices[0].message.content);

// Validate data
if (!data.name || !data.age) {
  throw new Error("Invalid response format");
}

// Use data
console.log(data);
```

### 5. Handle parsing errors

```typescript
try {
  const response = await aio.chatCompletion({...});
  const data = JSON.parse(response.choices[0].message.content);
  console.log(data);
} catch (error) {
  if (error instanceof SyntaxError) {
    console.error("Invalid JSON response:", error);
  } else {
    console.error("Request failed:", error);
  }
}
```

---

## 🔄 So sánh với các providers khác

### Google AI vs OpenRouter/Groq/Cerebras

| Feature | Google AI | OpenRouter/Groq/Cerebras |
|---------|-----------|--------------------------|
| JSON Object Mode | ✅ `responseMimeType` | ✅ `response_format.type` |
| JSON Schema Mode | ✅ `responseSchema` | ✅ `response_format.json_schema` |
| Strict mode | ❌ Không có | ✅ `strict: true` |
| Schema format | JSON Schema | JSON Schema |
| Guaranteed compliance | ✅ Cao | ✅ Rất cao (với strict) |

### Cách framework xử lý

Framework tự động convert format phù hợp cho từng provider:

```typescript
// Bạn viết code giống nhau
response_format: {
  type: "json_schema",
  json_schema: {
    name: "schema_name",
    schema: {...}
  }
}

// Framework tự động convert:
// - Google AI: responseMimeType + responseSchema
// - OpenRouter/Groq/Cerebras: response_format với strict mode
```

---

## 🐛 Troubleshooting

### 1. Response không phải JSON

**Vấn đề:** Response trả về text thay vì JSON

**Giải pháp:**
- Kiểm tra `response_format` đã set đúng chưa
- Thử thêm prompt nhắc AI trả về JSON
- Check model có hỗ trợ JSON mode không

```typescript
messages: [
  {
    role: "user",
    content: "Trả về JSON với format: {name, age, city}. Data: Nguyễn Văn A, 25, Hà Nội"
  }
],
response_format: { type: "json_object" }
```

### 2. JSON parse error

**Vấn đề:** `JSON.parse()` throw error

**Giải pháp:**
```typescript
try {
  const data = JSON.parse(response.choices[0].message.content);
} catch (error) {
  console.error("Raw response:", response.choices[0].message.content);
  console.error("Parse error:", error);
}
```

### 3. Schema không được tuân thủ

**Vấn đề:** Response JSON không match schema

**Giải pháp:**
- Kiểm tra schema có hợp lệ không
- Thêm `required` fields
- Thêm descriptions cho clarity
- Thử với prompt rõ ràng hơn

### 4. Missing fields

**Vấn đề:** Response thiếu một số fields

**Giải pháp:**
```typescript
schema: {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "integer" }
  },
  required: ["name", "age"] // Bắt buộc có cả 2 fields
}
```

---

## 📚 Tài liệu tham khảo

- [Google AI JSON Mode](https://ai.google.dev/gemini-api/docs/json-mode)
- [JSON Schema Specification](https://json-schema.org/)
- [Google AI API Reference](https://ai.google.dev/api)

---

**Chúc bạn sử dụng JSON mode với Google AI thành công! 🚀**
