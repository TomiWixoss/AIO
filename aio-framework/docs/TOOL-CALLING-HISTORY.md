# Tool Calling - Message History Management

## 🎯 Overview

Khi sử dụng tool calling, AI **LUÔN NHỚ** toàn bộ lịch sử tool calls và results. Framework tự động quản lý message history để AI có context đầy đủ.

---

## 📝 Message History Flow

### Iteration 1: First Tool Call

```
┌─────────────────────────────────────────────────────────────┐
│ INITIAL MESSAGES                                             │
├─────────────────────────────────────────────────────────────┤
│ [                                                            │
│   {                                                          │
│     role: "user",                                            │
│     content: "What's the weather in Tokyo?"                  │
│   }                                                          │
│ ]                                                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ AI RESPONSE (with tool call)                                 │
├─────────────────────────────────────────────────────────────┤
│ "Let me check the weather for you.                          │
│                                                              │
│ [tool]                                                       │
│ {"name": "get_weather", "params": {"city": "Tokyo"}}        │
│ [/tool]"                                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ FRAMEWORK EXECUTES TOOL                                      │
├─────────────────────────────────────────────────────────────┤
│ Result: {temperature: 22, condition: "Sunny"}               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ UPDATED MESSAGES (for next iteration)                        │
├─────────────────────────────────────────────────────────────┤
│ [                                                            │
│   {                                                          │
│     role: "user",                                            │
│     content: "What's the weather in Tokyo?"                  │
│   },                                                         │
│   {                                                          │
│     role: "assistant",                                       │
│     content: "Let me check the weather for you.\n\n         │
│               [tool]\n{...}\n[/tool]"                       │
│   },                                                         │
│   {                                                          │
│     role: "user",                                            │
│     content: "[tool_result]\n                                │
│               Tool: get_weather\n                            │
│               Success: true\n                                │
│               Data: {temperature: 22, condition: 'Sunny'}\n  │
│               Execution Time: 1234ms\n                       │
│               [/tool_result]"                                │
│   }                                                          │
│ ]                                                            │
└─────────────────────────────────────────────────────────────┘
```

### Iteration 2: AI Uses Tool Result

```
┌─────────────────────────────────────────────────────────────┐
│ MESSAGES FROM ITERATION 1                                    │
├─────────────────────────────────────────────────────────────┤
│ [                                                            │
│   { role: "user", content: "What's the weather in Tokyo?" },│
│   { role: "assistant", content: "Let me check...[tool]..." },│
│   { role: "user", content: "[tool_result]..." }             │
│ ]                                                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ AI RESPONSE (using tool result)                              │
├─────────────────────────────────────────────────────────────┤
│ "The weather in Tokyo is currently 22°C and sunny."         │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ AI Nhớ Gì?

### 1. **Tool Call History** ✅

AI nhớ:
- ✅ Tool nào đã được gọi
- ✅ Parameters nào đã được truyền
- ✅ Kết quả trả về là gì
- ✅ Tool có thành công hay fail
- ✅ Execution time và retry count

```typescript
// AI sees this in history:
{
  role: "assistant",
  content: "Let me check...\n\n[tool]\n{\"name\": \"get_weather\", \"params\": {\"city\": \"Tokyo\"}}\n[/tool]"
}

// And the result:
{
  role: "user",
  content: "[tool_result]\nTool: get_weather\nSuccess: true\nData: {temperature: 22}\nExecution Time: 1234ms\n[/tool_result]"
}
```

### 2. **Error History** ✅

Nếu tool fail, AI cũng nhớ:

```typescript
// Failed tool call
{
  role: "assistant",
  content: "[tool]\n{\"name\": \"get_weather\", \"params\": {\"city\": \"InvalidCity\"}}\n[/tool]"
}

// Error result
{
  role: "user",
  content: "[tool_result]\nTool: get_weather\nSuccess: false\nError: City not found\nSuggestion: Check the city name and try again\n[/tool_result]"
}
```

AI sẽ:
- ✅ Hiểu tool đã fail
- ✅ Đọc error message
- ✅ Đọc suggestion
- ✅ Thử lại với parameters khác hoặc tool khác

### 3. **Multi-Step Context** ✅

AI nhớ toàn bộ chain of tool calls:

```typescript
// Step 1: Search docs
{
  role: "assistant",
  content: "[tool]\n{\"name\": \"search_docs\", \"params\": {\"query\": \"authentication\"}}\n[/tool]"
}
{
  role: "user",
  content: "[tool_result]\nData: {file_path: \"docs/auth.md\"}\n[/tool_result]"
}

// Step 2: Read file (AI remembers file_path from step 1)
{
  role: "assistant",
  content: "[tool]\n{\"name\": \"read_file\", \"params\": {\"path\": \"docs/auth.md\"}}\n[/tool]"
}
{
  role: "user",
  content: "[tool_result]\nData: {content: \"...authentication guide...\"}\n[/tool_result]"
}

// Step 3: Answer using both results
{
  role: "assistant",
  content: "Based on the authentication guide in docs/auth.md, here's how to..."
}
```

---

## 🔄 Example: Complete Conversation Flow

### User Query
```
"What's the weather in Tokyo and calculate 15 + 27?"
```

### Full Message History

```typescript
// Iteration 1: Initial request
[
  {
    role: "user",
    content: "What's the weather in Tokyo and calculate 15 + 27?"
  }
]

// AI calls first tool
[
  { role: "user", content: "What's the weather in Tokyo and calculate 15 + 27?" },
  {
    role: "assistant",
    content: "I'll look up the weather in Tokyo.\n\n[tool]\n{\"name\": \"get_weather\", \"params\": {\"city\": \"Tokyo\"}}\n[/tool]"
  },
  {
    role: "user",
    content: "[tool_result]\nTool: get_weather\nSuccess: true\nData: {temperature: 22, condition: 'Sunny'}\nExecution Time: 1234ms\n[/tool_result]"
  }
]

// Iteration 2: AI calls second tool
[
  { role: "user", content: "What's the weather in Tokyo and calculate 15 + 27?" },
  { role: "assistant", content: "I'll look up the weather...[tool]..." },
  { role: "user", content: "[tool_result]...{temperature: 22}..." },
  {
    role: "assistant",
    content: "Now I'll calculate 15 + 27.\n\n[tool]\n{\"name\": \"calculate\", \"params\": {\"operation\": \"add\", \"a\": 15, \"b\": 27}}\n[/tool]"
  },
  {
    role: "user",
    content: "[tool_result]\nTool: calculate\nSuccess: true\nData: {result: 42}\nExecution Time: 5ms\n[/tool_result]"
  }
]

// Iteration 3: Final response
[
  { role: "user", content: "What's the weather in Tokyo and calculate 15 + 27?" },
  { role: "assistant", content: "I'll look up the weather...[tool]..." },
  { role: "user", content: "[tool_result]...{temperature: 22}..." },
  { role: "assistant", content: "Now I'll calculate...[tool]..." },
  { role: "user", content: "[tool_result]...{result: 42}..." },
  {
    role: "assistant",
    content: "The weather in Tokyo is 22°C and sunny. Also, 15 + 27 equals 42."
  }
]
```

---

## 🎯 Key Points

### 1. **AI Luôn Có Full Context** ✅

Mỗi iteration, AI nhận:
- ✅ Original user question
- ✅ All previous tool calls
- ✅ All tool results
- ✅ All previous AI responses

### 2. **Tool Results Are Structured** ✅

Framework format tool results với:
- ✅ Tool name
- ✅ Success/failure status
- ✅ Data or error message
- ✅ Execution metadata (time, retries)
- ✅ Suggestions for errors

### 3. **AI Can Self-Correct** ✅

Nếu tool fail, AI có thể:
- ✅ Đọc error message
- ✅ Hiểu vấn đề
- ✅ Thử lại với parameters khác
- ✅ Hoặc dùng tool khác

### 4. **History Persists Across Iterations** ✅

Framework maintain history qua tất cả iterations:
```typescript
let currentMessages = [...request.messages]; // Initial messages

while (iteration < maxIterations) {
  // Stream from AI với currentMessages
  
  // Add assistant message (with tool call)
  currentMessages.push({
    role: "assistant",
    content: assistantMessage
  });
  
  // Add tool result
  currentMessages.push({
    role: "user",
    content: formatToolResult(...)
  });
  
  // Next iteration uses updated currentMessages
}
```

---

## 🔍 Example: Error Recovery

### Scenario: Invalid Parameter

```typescript
// User: "Set temperature to 25 Kelvin"

// Iteration 1: AI calls with invalid enum
{
  role: "assistant",
  content: "[tool]\n{\"name\": \"set_temperature\", \"params\": {\"value\": 25, \"unit\": \"Kelvin\"}}\n[/tool]"
}

// Framework validates and returns error
{
  role: "user",
  content: "[tool_result]\nTool: set_temperature\nSuccess: false\nError: Invalid value for unit. Must be one of: C, F\nSuggestion: Check the tool definition and provide all required parameters.\n[/tool_result]"
}

// Iteration 2: AI self-corrects
{
  role: "assistant",
  content: "I apologize for the error. Let me use Celsius instead.\n\n[tool]\n{\"name\": \"set_temperature\", \"params\": {\"value\": 25, \"unit\": \"C\"}}\n[/tool]"
}

// Success!
{
  role: "user",
  content: "[tool_result]\nTool: set_temperature\nSuccess: true\nData: {temperature: 25, unit: 'C'}\n[/tool_result]"
}
```

AI nhớ:
1. ✅ First attempt failed với "Kelvin"
2. ✅ Error message said "Must be one of: C, F"
3. ✅ Corrected to use "C"
4. ✅ Second attempt succeeded

---

## 💡 Best Practices

### 1. **Include Context in Tool Results**

```typescript
// ✅ Good - AI can understand what happened
{
  success: true,
  data: {
    temperature: 22,
    city: "Tokyo", // Include original parameter
    unit: "celsius",
    timestamp: "2026-02-10T03:00:00Z"
  }
}

// ❌ Bad - AI loses context
{
  success: true,
  data: 22
}
```

### 2. **Provide Actionable Error Messages**

```typescript
// ✅ Good - AI knows what to do
throw new Error(
  "City not found: 'Tokyoo'. Did you mean: Tokyo, Kyoto, Osaka?"
);

// ❌ Bad - AI doesn't know how to fix
throw new Error("Invalid city");
```

### 3. **Return Structured Data**

```typescript
// ✅ Good - AI can extract specific fields
return {
  weather: {
    temperature: 22,
    condition: "Sunny",
    humidity: 65,
    wind_speed: 10
  },
  location: {
    city: "Tokyo",
    country: "Japan",
    timezone: "JST"
  }
};

// ❌ Bad - AI has to parse text
return "The weather in Tokyo is 22°C and sunny with 65% humidity...";
```

### 4. **Track Tool Call Chain**

```typescript
// Add metadata to help AI understand the flow
return {
  data: {...},
  metadata: {
    previous_tool: "search_docs",
    next_suggested_tool: "read_file",
    confidence: 0.95
  }
};
```

---

## 🚀 Advanced: Custom History Management

Nếu bạn muốn custom history (ví dụ: limit history length):

```typescript
// Framework handles this automatically, but you can access history:
const stream = await aio.chatCompletionStream({
  messages: [...], // Initial messages
  tools: [...],
  onToolCall: async (call) => {
    // You can log or store tool calls here
    console.log("Tool called:", call.name, call.params);
    
    const result = await executeToolLogic(call);
    
    // You can also log results
    console.log("Tool result:", result);
    
    return result;
  }
});

// Framework automatically adds to history:
// 1. Assistant message with tool call
// 2. User message with tool result
// 3. Continues loop with updated history
```

---

## 📊 Summary

| Question | Answer |
|----------|--------|
| **AI có nhớ tool calls không?** | ✅ Có, toàn bộ |
| **AI có nhớ tool results không?** | ✅ Có, bao gồm data và metadata |
| **AI có nhớ tool errors không?** | ✅ Có, bao gồm error message và suggestions |
| **AI có thể self-correct không?** | ✅ Có, dựa trên error messages |
| **History có persist qua iterations không?** | ✅ Có, framework tự động maintain |
| **AI có thể chain tools không?** | ✅ Có, dựa trên previous results |
| **History có bị giới hạn không?** | ❌ Không, nhưng có maxToolIterations (default: 5) |

---

## 🔗 Related Documentation

- [Tool Calling User Guide](./TOOL-CALLING.md)
- [Tool Calling Architecture](./TOOL-CALLING-ARCHITECTURE.md)
- [Improvements Summary](./IMPROVEMENTS.md)

---
