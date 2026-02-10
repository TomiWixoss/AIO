# Tool Calling Guide

AIO Framework hỗ trợ **streaming-only tool calling** với real-time tag parsing và execution.

## 🎯 Tính năng

- ✅ **Streaming-only**: Chỉ hỗ trợ streaming mode, không có non-streaming
- ✅ **Real-time parsing**: Parse tool tags trong khi streaming
- ✅ **Event-driven**: Emit events cho từng giai đoạn tool execution
- ✅ **Flexible**: User tự implement tool logic
- ✅ **Iterative**: Tự động loop để xử lý multiple tool calls

## 📋 Flow

```
User Request
    ↓
Framework inject tool prompt vào system message
    ↓
AI streaming response
    ↓
Framework parse real-time:
  - Text trước tool → Stream ngay
  - [tool] tag mở → Emit "pending" event
  - [/tool] tag đóng → Parse JSON → Emit "executing" event
    ↓
Call user's onToolCall handler
    ↓
  - Success → Emit "success" event với result
  - Error → Emit "error" event
    ↓
Add tool result vào messages
    ↓
Loop lại (max 5 iterations)
    ↓
Final response → Stream ra user
```

## 🚀 Usage

### 1. Define Tools

```typescript
import { AIO, ToolCall } from "aio-framework";

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
        description: "Temperature unit (celsius or fahrenheit)",
        required: false,
      },
    },
  },
];
```

### 2. Implement Tool Handler

```typescript
async function handleToolCall(call: ToolCall): Promise<any> {
  console.log(`Tool called: ${call.name}`, call.params);

  if (call.name === "get_weather") {
    const { city, unit = "celsius" } = call.params;
    
    // Call your API
    const response = await fetch(
      `https://api.weather.com/v1/current?city=${city}&unit=${unit}`
    );
    return response.json();
  }

  throw new Error(`Unknown tool: ${call.name}`);
}
```

### 3. Stream with Tools

```typescript
const aio = new AIO({
  providers: [
    {
      provider: "google-ai",
      apiKeys: [{ key: process.env.GOOGLE_AI_API_KEY }],
      models: [{ modelId: "gemini-2.0-flash-exp" }],
    },
  ],
});

const stream = await aio.chatCompletionStream({
  provider: "google-ai",
  model: "gemini-2.0-flash-exp",
  messages: [
    {
      role: "user",
      content: "What's the weather in Tokyo?",
    },
  ],
  tools,
  onToolCall: handleToolCall,
  maxToolIterations: 5, // Default: 5
});
```

### 4. Handle Stream Events

```typescript
stream.on("data", (chunk) => {
  const chunkStr = chunk.toString();

  // SSE format: data: {...}
  if (chunkStr.startsWith("data: ")) {
    try {
      const data = JSON.parse(chunkStr.slice(6));

      // Tool events
      if (data.tool_call) {
        const event = data.tool_call;

        switch (event.type) {
          case "pending":
            console.log("⏳ Tool call detected...");
            break;

          case "executing":
            console.log(`🔄 Executing: ${event.call.name}`);
            console.log(`📝 Params:`, event.call.params);
            break;

          case "success":
            console.log(`✅ Tool completed: ${event.call.name}`);
            console.log(`📊 Result:`, event.result);
            break;

          case "error":
            console.log(`❌ Tool error: ${event.error}`);
            break;
        }
      }
    } catch (e) {
      // Not JSON or [DONE]
    }
  } else {
    // Regular text content
    process.stdout.write(chunkStr);
  }
});

stream.on("end", () => {
  console.log("\n✨ Stream completed!");
});

stream.on("error", (error) => {
  console.error("❌ Error:", error.message);
});
```

## 📊 Tool Event Types

### `pending`
```json
{
  "tool_call": {
    "type": "pending"
  }
}
```
Phát ra khi detect `[tool]` tag mở.

### `executing`
```json
{
  "tool_call": {
    "type": "executing",
    "call": {
      "name": "get_weather",
      "params": { "city": "Tokyo" }
    }
  }
}
```
Phát ra khi `[/tool]` tag đóng và bắt đầu execute.

### `success`
```json
{
  "tool_call": {
    "type": "success",
    "call": {
      "name": "get_weather",
      "params": { "city": "Tokyo" }
    },
    "result": {
      "temperature": 22,
      "condition": "Sunny"
    }
  }
}
```
Phát ra khi tool execution thành công.

### `error`
```json
{
  "tool_call": {
    "type": "error",
    "call": {
      "name": "get_weather",
      "params": { "city": "Tokyo" }
    },
    "error": "API key invalid"
  }
}
```
Phát ra khi tool execution lỗi.

## 🔧 Tool Tag Format

AI sẽ generate tool calls theo format:

```
[tool]
{"name": "get_weather", "params": {"city": "Tokyo", "unit": "celsius"}}
[/tool]
```

Framework tự động:
1. Parse JSON từ trong tag
2. Validate tool name
3. Call `onToolCall` handler
4. Format result thành `[tool_result]` tag
5. Gửi lại cho AI để tiếp tục

## ⚙️ Configuration

```typescript
interface ChatCompletionRequest {
  // ... other fields
  
  // Tool calling (streaming only)
  tools?: ToolDefinition[];
  onToolCall?: ToolCallHandler;
  maxToolIterations?: number; // Default: 5
}
```

### `tools`
Array of tool definitions mà AI có thể sử dụng.

### `onToolCall`
Async function để execute tool:
```typescript
type ToolCallHandler = (call: ToolCall) => Promise<any>;
```

### `maxToolIterations`
Số lần tối đa framework sẽ loop để xử lý tool calls. Default: 5.

## 💡 Best Practices

### 1. Error Handling
```typescript
async function handleToolCall(call: ToolCall): Promise<any> {
  try {
    // Your tool logic
    return await executeTool(call);
  } catch (error: any) {
    // Return error info, framework sẽ format và gửi cho AI
    throw new Error(`Tool execution failed: ${error.message}`);
  }
}
```

### 2. Timeout
```typescript
async function handleToolCall(call: ToolCall): Promise<any> {
  const timeout = 30000; // 30s
  
  return Promise.race([
    executeTool(call),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Tool timeout")), timeout)
    ),
  ]);
}
```

### 3. Validation
```typescript
async function handleToolCall(call: ToolCall): Promise<any> {
  // Validate params
  if (call.name === "get_weather") {
    if (!call.params.city) {
      throw new Error("city parameter is required");
    }
  }
  
  // Execute
  return executeTool(call);
}
```

### 4. Logging
```typescript
async function handleToolCall(call: ToolCall): Promise<any> {
  console.log(`[${new Date().toISOString()}] Tool: ${call.name}`);
  console.log(`Params:`, JSON.stringify(call.params, null, 2));
  
  const result = await executeTool(call);
  
  console.log(`Result:`, JSON.stringify(result, null, 2));
  return result;
}
```

## 🎯 Examples

### Weather Tool
```typescript
const tools = [
  {
    name: "get_weather",
    description: "Get current weather",
    parameters: {
      city: { type: "string", description: "City name", required: true },
    },
  },
];

async function handleToolCall(call: ToolCall) {
  if (call.name === "get_weather") {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${call.params.city}&appid=${API_KEY}`
    );
    return res.json();
  }
}
```

### Database Query Tool
```typescript
const tools = [
  {
    name: "query_database",
    description: "Query database",
    parameters: {
      query: { type: "string", description: "SQL query", required: true },
    },
  },
];

async function handleToolCall(call: ToolCall) {
  if (call.name === "query_database") {
    const result = await db.query(call.params.query);
    return result.rows;
  }
}
```

### Multiple Tools
```typescript
const tools = [
  {
    name: "get_weather",
    description: "Get weather",
    parameters: {
      city: { type: "string", required: true },
    },
  },
  {
    name: "search_web",
    description: "Search web",
    parameters: {
      query: { type: "string", required: true },
    },
  },
];

async function handleToolCall(call: ToolCall) {
  switch (call.name) {
    case "get_weather":
      return getWeather(call.params.city);
    case "search_web":
      return searchWeb(call.params.query);
    default:
      throw new Error(`Unknown tool: ${call.name}`);
  }
}
```

## 🚨 Limitations

1. **Streaming only**: Không hỗ trợ non-streaming mode
2. **Provider support**: Phụ thuộc vào khả năng của provider (Google AI, OpenRouter, etc.)
3. **Max iterations**: Default 5, có thể config nhưng nên giữ < 10
4. **Tag format**: AI phải generate đúng format `[tool]...[/tool]`

## 🔍 Troubleshooting

### Tool không được gọi
- Check tool definition có đúng format không
- Check system prompt có được inject không (enable logging)
- Thử prompt rõ ràng hơn: "Use the get_weather tool to check Tokyo weather"

### Parse error
- Check AI có generate đúng JSON format không
- Enable logging để xem raw tool content
- Validate tool parameters

### Timeout
- Implement timeout trong `onToolCall`
- Reduce `maxToolIterations`
- Check tool execution time

## 📚 See Also

- [Basic Usage](./HUONG-DAN-SU-DUNG.md)
- [Examples](../examples/)
- [API Reference](./README.md)
