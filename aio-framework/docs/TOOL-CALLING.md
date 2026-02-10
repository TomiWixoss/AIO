# Tool Calling - User Guide

## 🎯 Overview

AIO Framework hỗ trợ **text-based tool calling** với streaming real-time. Framework tự động:
- ✅ Parse `[tool]...[/tool]` tags từ AI response
- ✅ Validate parameters (required, enum, types)
- ✅ Apply default values
- ✅ Execute tools với retry logic (max 3 retries)
- ✅ Track execution time và metadata
- ✅ Format results và feed back vào AI
- ✅ Loop iteratively cho multi-step tasks (max 5 iterations)

**CHỈ HỖ TRỢ STREAMING MODE** - Tool calling không có non-streaming.

---

## 🚀 Quick Start

### 1. Define Tools

```typescript
const tools = [
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
        description: "Temperature unit",
        required: false,
        enum: ["celsius", "fahrenheit"],
        default: "celsius", // Auto-applied if not provided
      },
    },
    requireReasoning: true, // Force AI to explain why calling this tool
  },
];
```

### 2. Implement Tool Handler

```typescript
async function handleToolCall(call: ToolCall): Promise<any> {
  console.log(`🔧 Calling: ${call.name}`, call.params);
  
  if (call.name === "get_weather") {
    // Your tool logic here
    const weather = await fetchWeather(call.params.city);
    return {
      temperature: weather.temp,
      condition: weather.condition,
      unit: call.params.unit,
    };
  }
  
  throw new Error(`Unknown tool: ${call.name}`);
}
```

### 3. Start Streaming

```typescript
const stream = await aio.chatCompletionStream({
  provider: "google-ai",
  model: "gemini-flash-latest",
  messages: [
    { role: "user", content: "What's the weather in Tokyo?" }
  ],
  tools,
  onToolCall: handleToolCall,
  maxToolIterations: 5, // Default: 5
});

// Process SSE events
stream.on("data", (chunk) => {
  const data = JSON.parse(chunk.toString().slice(6)); // Remove "data: "
  
  if (data.tool_call) {
    // Tool call event
    console.log("Tool:", data.tool_call.type);
  } else if (data.choices[0].delta.content) {
    // Text content
    process.stdout.write(data.choices[0].delta.content);
  }
});
```

---

## 📋 Tool Definition Schema

### ToolDefinition

```typescript
interface ToolDefinition {
  name: string;                              // Tool name (unique)
  description: string;                       // What this tool does
  parameters: Record<string, ToolParameter>; // Parameter definitions
  requireReasoning?: boolean;                // Force AI to explain (default: false)
}
```

### ToolParameter

```typescript
interface ToolParameter {
  type: string;           // "string" | "number" | "boolean" | "object" | "array"
  description: string;    // Parameter description
  required?: boolean;     // Is required? (default: false)
  enum?: string[];        // Allowed values (validated automatically)
  default?: any;          // Default value (applied automatically)
}
```

### Example: Complex Tool

```typescript
{
  name: "search_database",
  description: "Search database with filters",
  parameters: {
    query: {
      type: "string",
      description: "Search query",
      required: true,
    },
    limit: {
      type: "number",
      description: "Max results",
      required: false,
      default: 10, // Auto-applied
    },
    sort_by: {
      type: "string",
      description: "Sort field",
      required: false,
      enum: ["date", "relevance", "popularity"], // Validated
      default: "relevance",
    },
    filters: {
      type: "object",
      description: "Additional filters",
      required: false,
    },
  },
  requireReasoning: true,
}
```

---

## 🔄 Tool Execution Flow

```
User Message
    ↓
AI generates response with [tool] tag
    ↓
Framework detects [tool] → STOP STREAM
    ↓
Parse JSON → Validate parameters → Apply defaults
    ↓
Execute onToolCall() with retry (max 3 attempts)
    ↓
Format result with metadata (execution time, retry count)
    ↓
Add to messages and continue loop
    ↓
AI uses tool result to generate final response
```

---

## 📡 SSE Event Types

### 1. Text Content

```json
{
  "id": "uuid",
  "provider": "google-ai",
  "model": "gemini-flash-latest",
  "choices": [{
    "index": 0,
    "delta": {
      "content": "Let me check the weather..."
    },
    "finish_reason": null
  }]
}
```

### 2. Tool Call Pending

```json
{
  "id": "tool-123",
  "provider": "google-ai",
  "model": "gemini-flash-latest",
  "choices": [{"index": 0, "delta": {}, "finish_reason": null}],
  "tool_call": {
    "type": "pending"
  }
}
```

### 3. Tool Call Executing

```json
{
  "tool_call": {
    "type": "executing",
    "call": {
      "name": "get_weather",
      "params": {"city": "Tokyo", "unit": "celsius"}
    }
  }
}
```

### 4. Tool Call Success

```json
{
  "tool_call": {
    "type": "success",
    "call": {...},
    "result": {
      "temperature": 22,
      "condition": "Sunny"
    }
  }
}
```

### 5. Tool Call Error

```json
{
  "tool_call": {
    "type": "error",
    "call": {...},
    "error": "Weather API temporarily unavailable"
  }
}
```

---

## ✅ Automatic Features

### 1. Parameter Validation

Framework tự động validate:
- ✅ Required parameters
- ✅ Enum values
- ✅ Unknown parameters

```typescript
// Tool definition
{
  name: "set_temperature",
  parameters: {
    value: { type: "number", required: true },
    unit: { type: "string", enum: ["C", "F"], required: true }
  }
}

// AI calls with invalid enum
[tool]
{"name": "set_temperature", "params": {"value": 25, "unit": "Kelvin"}}
[/tool]

// Framework returns error
[tool_result]
Tool: set_temperature
Success: false
Error: Invalid value for unit. Must be one of: C, F
Suggestion: Check the tool definition and provide all required parameters with correct types.
[/tool_result]
```

### 2. Default Values

```typescript
{
  parameters: {
    limit: { type: "number", default: 10 }
  }
}

// AI calls without limit
{"name": "search", "params": {"query": "test"}}

// Framework applies default
{"name": "search", "params": {"query": "test", "limit": 10}}
```

### 3. Retry Logic

```typescript
async function handleToolCall(call: ToolCall) {
  // Simulate transient error
  if (Math.random() < 0.5) {
    throw new Error("Temporary network error");
  }
  return { success: true };
}

// Framework automatically retries up to 3 times with exponential backoff:
// Attempt 1: Immediate
// Attempt 2: Wait 1s
// Attempt 3: Wait 2s
// Attempt 4: Wait 4s (max 5s)
```

### 4. Execution Metadata

```typescript
[tool_result]
Tool: get_weather
Success: true
Data: {"temperature": 22, "condition": "Sunny"}
Execution Time: 1234ms
Retries: 1
[/tool_result]
```

---

## 🎨 Advanced Patterns

### Pattern 1: Multi-Step Reasoning

```typescript
const tools = [
  {
    name: "search_docs",
    description: "Search documentation",
    parameters: {
      query: { type: "string", required: true },
      explanation: { 
        type: "string", 
        description: "Why you need to search this",
        required: true 
      }
    }
  },
  {
    name: "read_file",
    description: "Read file content",
    parameters: {
      path: { type: "string", required: true },
      explanation: { 
        type: "string", 
        description: "Why you need to read this file",
        required: true 
      }
    }
  }
];

// AI will:
// 1. Search docs → Get file path
// 2. Read file → Get content
// 3. Answer question with content
```

### Pattern 2: Error Recovery

```typescript
async function handleToolCall(call: ToolCall) {
  try {
    return await executeToolLogic(call);
  } catch (error) {
    // Return structured error for AI to learn from
    return {
      success: false,
      error: error.message,
      suggestion: "Try using X instead of Y",
      alternatives: ["tool_a", "tool_b"]
    };
  }
}
```

### Pattern 3: Tool Chaining

```typescript
// AI automatically chains tools:
User: "Find the weather in the capital of Japan"

AI: [tool]{"name": "get_capital", "params": {"country": "Japan"}}[/tool]
→ Result: {"capital": "Tokyo"}

AI: [tool]{"name": "get_weather", "params": {"city": "Tokyo"}}[/tool]
→ Result: {"temp": 22, "condition": "Sunny"}

AI: "The weather in Tokyo (capital of Japan) is 22°C and Sunny."
```

---

## ⚙️ Configuration

### maxToolIterations

```typescript
const stream = await aio.chatCompletionStream({
  // ...
  maxToolIterations: 10, // Default: 5
});
```

**Best Practices:**
- ✅ Use 3-5 for simple tasks
- ✅ Use 5-10 for complex multi-step tasks
- ❌ Avoid > 10 (can cause loops)

### Abort Signal

```typescript
const controller = new AbortController();

const stream = await aio.chatCompletionStream({
  // ...
  signal: controller.signal,
});

// Cancel after 30s
setTimeout(() => controller.abort(), 30000);
```

---

## 🐛 Debugging

### Enable Logging

```typescript
const aio = new AIO({
  providers: [...],
  enableLogging: true, // See all tool calls and iterations
});
```

### Log Output

```
2026-02-10T02:48:04.193Z [info]: Tool iteration {"iteration":1,"maxIterations":5}
2026-02-10T02:48:06.442Z [info]: Executing tool {"name":"get_time","params":{"timezone":"UTC"}}
2026-02-10T02:48:45.004Z [warn]: Tool execution failed {"tool":"get_weather","attempt":1,"maxRetries":4,"error":"Weather API temporarily unavailable"}
```

---

## 📚 Complete Example

See `examples/tool-test-simple.ts` and `examples/tool-calling.ts` for working examples.

---

## 🔍 Comparison with Native Function Calling

| Feature | AIO Text-based | OpenAI Function Calling |
|---------|----------------|-------------------------|
| **Provider Support** | ✅ Any LLM | ❌ OpenAI, Anthropic only |
| **Streaming** | ✅ Yes (only) | ✅ Yes |
| **Validation** | ✅ Built-in | ✅ JSON Schema |
| **Retry** | ✅ Automatic (3x) | ❌ Manual |
| **Metadata** | ✅ Execution time, retry count | ❌ No |
| **Default Values** | ✅ Automatic | ❌ Manual |
| **Format** | Text tags | Native API |

---

## 💡 Best Practices (from Cursor IDE)

### 1. Force Reasoning

```typescript
// ✅ Good - AI explains before calling
{
  name: "delete_file",
  parameters: {
    path: { type: "string", required: true },
    reasoning: { 
      type: "string", 
      description: "Explain why you need to delete this file",
      required: true 
    }
  }
}
```

### 2. Clear Descriptions

```typescript
// ✅ Good
description: "Search codebase for function definitions matching the query"

// ❌ Bad
description: "Search stuff"
```

### 3. Enum for Constrained Values

```typescript
// ✅ Good - Prevents invalid values
{
  sort_by: {
    type: "string",
    enum: ["date", "relevance", "popularity"],
    default: "relevance"
  }
}
```

### 4. Provide Suggestions on Errors

```typescript
async function handleToolCall(call: ToolCall) {
  if (call.name === "read_file") {
    if (!fs.existsSync(call.params.path)) {
      throw new Error(
        `File not found: ${call.params.path}. ` +
        `Did you mean: ${suggestSimilarFiles(call.params.path).join(", ")}?`
      );
    }
  }
}
```

---

## 🚀 Next Steps

- Read [TOOL-CALLING-ARCHITECTURE.md](./TOOL-CALLING-ARCHITECTURE.md) for deep dive
- Check [examples/](../examples/) for more patterns
- See [types.ts](../src/types.ts) for full TypeScript definitions

---
