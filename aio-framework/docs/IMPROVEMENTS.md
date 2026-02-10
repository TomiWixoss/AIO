# Tool Calling Improvements Summary

## 🎯 Objective

Cải thiện tool calling system của AIO Framework dựa trên best practices từ **Cursor IDE** và các IDE Agent khác.

---

## ✅ Completed Improvements

### 1. **Parameter Validation** ✅

**Before:**
- Không có validation
- User phải tự validate trong handler
- Errors không rõ ràng

**After:**
```typescript
// Automatic validation
- ✅ Required parameters
- ✅ Enum values
- ✅ Unknown parameters
- ✅ Clear error messages với suggestions

// Example error
Error: Invalid value for unit. Must be one of: celsius, fahrenheit
Suggestion: Check the tool definition and provide all required parameters with correct types.
```

**Implementation:**
- `validateToolCall()` function in `tool-stream-parser.ts`
- Validates before execution
- Returns structured error với suggestions

---

### 2. **Default Values** ✅

**Before:**
- User phải handle defaults manually
- Inconsistent behavior

**After:**
```typescript
// Tool definition
{
  parameters: {
    limit: { type: "number", default: 10 },
    unit: { type: "string", enum: ["celsius", "fahrenheit"], default: "celsius" }
  }
}

// AI calls without defaults
{"name": "search", "params": {"query": "test"}}

// Framework applies automatically
{"name": "search", "params": {"query": "test", "limit": 10}}
```

**Implementation:**
- `applyDefaultValues()` function in `tool-stream-parser.ts`
- Applied before validation
- Works với all parameter types

---

### 3. **Retry Logic với Exponential Backoff** ✅

**Before:**
- No retry
- Transient errors caused failures
- User had to implement retry manually

**After:**
```typescript
// Automatic retry với exponential backoff
Attempt 1: Immediate
Attempt 2: Wait 1s
Attempt 3: Wait 2s
Attempt 4: Wait 4s (max 5s)

// Max 3 retries (4 total attempts)
```

**Implementation:**
- `executeToolWithRetry()` method in `tool-stream-handler.ts`
- Exponential backoff: `Math.min(1000 * Math.pow(2, attempt), 5000)`
- Logs warnings on failures
- Returns metadata với retry count

---

### 4. **Execution Metadata Tracking** ✅

**Before:**
- No timing information
- No retry tracking
- Hard to debug performance issues

**After:**
```typescript
[tool_result]
Tool: get_weather
Success: true
Data: {"temperature": 22, "condition": "Sunny"}
Execution Time: 1234ms
Retries: 1
[/tool_result]
```

**Implementation:**
- Track `executionTime` với `Date.now()`
- Track `retryCount` trong retry loop
- Include `suggestion` field for errors
- Return structured `ToolResult` type

---

### 5. **Improved System Prompt** ✅

**Before:**
```typescript
// Simple, generic prompt
"You have access to these tools: ..."
```

**After:**
```typescript
// Cursor-inspired prompt với:
- ✅ XML-style tags <tool_calling>
- ✅ Clear instructions với examples
- ✅ Force reasoning requirement
- ✅ Critical rules (DO NOT loop > 3 times, etc.)
- ✅ Error handling guidelines
- ✅ Tool result format specification
```

**Key Rules Added:**
- "ALWAYS explain your reasoning before calling a tool"
- "DO NOT generate fake tool results"
- "DO NOT loop more than 3 times trying to fix the same error"
- "Address the root cause of problems, not just symptoms"
- "After outputting [/tool], STOP generating immediately"

**Implementation:**
- `generateToolSystemPrompt()` in `tool-stream-parser.ts`
- Includes parameter details (enum, default, required)
- Shows exact format với examples

---

### 6. **Enhanced Error Messages** ✅

**Before:**
```typescript
Error: Tool execution failed
```

**After:**
```typescript
Error: Invalid value for unit. Must be one of: celsius, fahrenheit
Suggestion: Check the tool definition and provide all required parameters with correct types.

// For retry failures
Error: Weather API temporarily unavailable
Suggestion: Tool failed after multiple retries. Check if the parameters are correct or if the tool is available.
```

**Implementation:**
- Validation errors include allowed values
- Retry errors include suggestion based on retry count
- Unknown tool errors suggest checking tool name
- All errors are actionable

---

## 📊 Impact

### Performance
- ✅ Reduced failed tool calls (validation catches errors early)
- ✅ Better success rate (automatic retry on transient errors)
- ✅ Faster debugging (execution time tracking)

### Developer Experience
- ✅ Less boilerplate (no manual validation/retry)
- ✅ Better error messages (actionable suggestions)
- ✅ Easier debugging (metadata tracking)
- ✅ More reliable (automatic retry)

### AI Behavior
- ✅ Better tool usage (clear system prompt)
- ✅ Less loops (DO NOT loop > 3 times rule)
- ✅ More reasoning (force explanation)
- ✅ Better error recovery (structured feedback)

---

## 🔍 Comparison: Before vs After

### Example: Tool Call với Validation Error

**Before:**
```typescript
// AI calls with wrong enum
[tool]{"name": "get_weather", "params": {"city": "Tokyo", "unit": "Kelvin"}}[/tool]

// User handler throws error
throw new Error("Invalid unit");

// AI gets generic error
[tool_result]
Tool: get_weather
Success: false
Error: Invalid unit
[/tool_result]

// AI might retry with same error
```

**After:**
```typescript
// AI calls with wrong enum
[tool]{"name": "get_weather", "params": {"city": "Tokyo", "unit": "Kelvin"}}[/tool]

// Framework validates BEFORE execution
// Returns detailed error
[tool_result]
Tool: get_weather
Success: false
Error: Invalid value for unit. Must be one of: celsius, fahrenheit
Suggestion: Check the tool definition and provide all required parameters with correct types.
[/tool_result]

// AI understands and fixes
[tool]{"name": "get_weather", "params": {"city": "Tokyo", "unit": "celsius"}}[/tool]
```

### Example: Tool Call với Transient Error

**Before:**
```typescript
// Tool fails due to network error
throw new Error("Network timeout");

// Request fails completely
// User has to retry manually
```

**After:**
```typescript
// Tool fails on first attempt
2026-02-10T02:48:45.004Z [warn]: Tool execution failed 
  {"tool":"get_weather","attempt":1,"maxRetries":4,"error":"Network timeout"}

// Framework retries automatically
// Succeeds on second attempt

[tool_result]
Tool: get_weather
Success: true
Data: {"temperature": 22}
Execution Time: 2145ms
Retries: 1
[/tool_result]
```

---

## 🎓 Lessons from Cursor IDE

### 1. **Force Reasoning**
- Cursor requires explanation parameter for all tools
- Helps AI think before acting
- Reduces unnecessary tool calls

**Applied:**
```typescript
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

### 2. **Clear System Prompts**
- Cursor uses XML-style tags for structure
- Includes critical rules (DO NOT loop, etc.)
- Shows exact format với examples

**Applied:**
```typescript
<tool_calling>
You have access to the following tools...

## Critical Rules
- DO NOT loop more than 3 times
- Address root cause, not symptoms
- STOP generating after [/tool]
</tool_calling>
```

### 3. **Self-Correction**
- Cursor feeds lint results back to AI
- AI learns from errors and fixes them
- Reduces manual intervention

**Applied:**
- Structured error messages với suggestions
- Metadata tracking (execution time, retries)
- Clear feedback loop

### 4. **Prompt Caching**
- Cursor uses static system prompts
- Reduces latency and cost
- Improves consistency

**Future Work:**
- Could cache tool definitions
- Reuse system prompt across requests

---

## 🚀 Future Improvements

### 1. **Parallel Tool Calls** (TODO)
```typescript
// AI calls multiple tools at once
[tool]{"name": "get_weather", "params": {"city": "Tokyo"}}[/tool]
[tool]{"name": "get_time", "params": {"timezone": "JST"}}[/tool]

// Framework executes concurrently
await Promise.all([
  handleToolCall(call1),
  handleToolCall(call2)
]);
```

### 2. **Tool Call Statistics** (TODO)
```typescript
// Track usage patterns
{
  "get_weather": {
    "calls": 150,
    "success_rate": 0.95,
    "avg_execution_time": 1234,
    "most_common_params": {"unit": "celsius"}
  }
}
```

### 3. **Semantic Diff** (TODO)
- Like Cursor's apply model
- AI generates diff instead of full code
- Reduces token usage
- Faster execution

### 4. **Vector Search** (TODO)
- Index tool definitions
- Semantic search for relevant tools
- Better tool discovery

### 5. **MCP Integration** (TODO)
- Support Model Context Protocol
- Standardized tool interface
- Interop với other agents

---

## 📚 References

- [Cursor IDE Architecture](https://blog.sshh.io/p/how-cursor-ai-ide-works)
- [Tool Calling Fundamentals](https://arunbaby.com/ai-agents/0004-tool-calling-fundamentals/)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Windsurf Cascade](https://docs.codeium.com/windsurf/cascade)

---

**Content rephrased for compliance with licensing restrictions. Original sources cited above.**
