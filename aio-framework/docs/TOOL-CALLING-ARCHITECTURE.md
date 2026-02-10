# Tool Calling Architecture

## 🏗️ Nguyên lý hoạt động của AIO Framework

### Flow tổng quan

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER APPLICATION                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. Define Tools                                                     │
│     const tools = [{                                                 │
│       name: "get_weather",                                           │
│       description: "Get weather info",                               │
│       parameters: {...}                                              │
│     }]                                                               │
│                                                                       │
│  2. Implement Handler                                                │
│     async function handleToolCall(call) {                            │
│       // Execute tool logic                                          │
│       return result;                                                 │
│     }                                                                │
│                                                                       │
│  3. Start Stream                                                     │
│     const stream = await aio.chatCompletionStream({                  │
│       messages: [...],                                               │
│       tools,                                                         │
│       onToolCall: handleToolCall                                     │
│     })                                                               │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      AIO FRAMEWORK CORE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 1. TOOL STREAM HANDLER (Orchestrator)                        │  │
│  │    - Inject tool definitions vào system prompt               │  │
│  │    - Manage iterative loop (max 5 iterations)                │  │
│  │    - Coordinate giữa AI và tool execution                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↓                                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 2. PROVIDER (Google AI, OpenRouter, etc.)                    │  │
│  │    - Send request với system prompt chứa tool definitions    │  │
│  │    - Start streaming response                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↓                                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 3. STREAM PARSER (Real-time Tag Detection)                   │  │
│  │    ┌────────────────────────────────────────────────────┐    │  │
│  │    │ For each SSE chunk:                                │    │  │
│  │    │   - Extract text content                          │    │  │
│  │    │   - Detect [tool] opening tag → Emit "pending"    │    │  │
│  │    │   - Accumulate tool content                       │    │  │
│  │    │   - Detect [/tool] closing tag:                   │    │  │
│  │    │     • Parse JSON                                  │    │  │
│  │    │     • STOP STREAM immediately                     │    │  │
│  │    │     • Emit "executing"                            │    │  │
│  │    │     • Break loop                                  │    │  │
│  │    └────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↓                                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 4. TOOL EXECUTION                                             │  │
│  │    - Call user's onToolCall(toolCall)                        │  │
│  │    - Wait for result                                         │  │
│  │    - Emit "success" or "error"                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↓                                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 5. CONTINUE LOOP                                              │  │
│  │    - Add assistant message (with tool call)                  │  │
│  │    - Add user message (with tool result)                     │  │
│  │    - Start new iteration                                     │  │
│  │    - Repeat until no more tool calls or max iterations       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         OUTPUT STREAM                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  SSE Events:                                                         │
│  • data: {delta: {content: "text"}} - Normal text                   │
│  • data: {tool_call: {type: "pending"}} - Tool detected             │
│  • data: {tool_call: {type: "executing", call: {...}}}              │
│  • data: {tool_call: {type: "success", result: {...}}}              │
│  • data: {tool_call: {type: "error", error: "..."}}                 │
│  • data: [DONE]                                                      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Chi tiết Stream Parsing

```
AI Response Stream:
┌─────────────────────────────────────────────────────────────────┐
│ "Let me check the weather for you.\n\n[tool]\n{\"name\":       │
│ \"get_weather\", \"params\": {\"city\": \"Tokyo\"}}\n[/tool]"  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PARSER STATE MACHINE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  State: NORMAL                                                   │
│  ├─ Buffer: "Let me check the weather for you.\n\n"            │
│  ├─ Action: Forward text to output                             │
│  └─ Output: "Let me check the weather for you.\n\n"            │
│                                                                   │
│  State: NORMAL → TOOL_PENDING                                   │
│  ├─ Detect: "[tool]"                                            │
│  ├─ Action: Set inToolTag = true                               │
│  └─ Emit: {tool_call: {type: "pending"}}                       │
│                                                                   │
│  State: TOOL_PENDING                                             │
│  ├─ Buffer: "\n{\"name\": \"get_weather\", \"params\": ..."    │
│  ├─ Action: Accumulate in toolContent                          │
│  └─ Output: (nothing - waiting for closing tag)                │
│                                                                   │
│  State: TOOL_PENDING → TOOL_COMPLETE                            │
│  ├─ Detect: "[/tool]"                                           │
│  ├─ Action:                                                     │
│  │   • Parse JSON from toolContent                             │
│  │   • DESTROY STREAM (stop AI generation)                     │
│  │   • Set inToolTag = false                                   │
│  └─ Emit: {tool_call: {type: "executing", call: {...}}}        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      TOOL EXECUTION                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  const result = await onToolCall({                              │
│    name: "get_weather",                                         │
│    params: {city: "Tokyo"}                                      │
│  })                                                             │
│                                                                   │
│  // result = {temp: 22, condition: "Sunny"}                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BUILD NEXT ITERATION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  messages = [                                                    │
│    ...previousMessages,                                         │
│    {                                                            │
│      role: "assistant",                                         │
│      content: "Let me check...\n\n[tool]\n{...}\n[/tool]"     │
│    },                                                           │
│    {                                                            │
│      role: "user",                                              │
│      content: "[tool_result]\nTool: get_weather\n              │
│                Success: true\nData: {...}\n[/tool_result]"     │
│    }                                                            │
│  ]                                                              │
│                                                                   │
│  → Start new stream with updated messages                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 🔍 So sánh với các IDE Agent khác

### 1. **Cursor IDE** (Anthropic Claude-based)

**Architecture:**
```
User Prompt
    ↓
Cursor IDE (VSCode Fork)
    ↓
System Prompt + Tools Definition
    ↓
Claude 3.5 Sonnet (Agentic Mode)
    ↓
Tool Calls (Native Function Calling):
  - codebase_search()
  - read_file()
  - edit_file() → Semantic Diff
  - grep_search()
  - file_search()
  - web_search()
  - run_command()
    ↓
Apply Model (Cheaper LLM)
  - Convert semantic diff → actual code
  - Fix syntax errors
  - Run linter
    ↓
Return to Main Agent with lint results
    ↓
Loop until done (max ~25 tool calls)
```

**Key Differences:**
- ✅ **Native Function Calling**: Dùng OpenAI/Anthropic function calling API
- ✅ **Two-Model System**: Main agent (expensive) + Apply model (cheap)
- ✅ **Semantic Diff**: Agent chỉ generate diff, không phải full code
- ✅ **Lint Feedback Loop**: Linter results được feed back vào agent
- ✅ **Prompt Caching**: Static system prompt để cache và giảm latency
- ✅ **Vector Search**: Codebase được index vào vectorstore
- ❌ **Closed Source**: System prompts và tools là proprietary

**Cursor System Prompt Highlights:**
```
"You are Cursor, an AI programming assistant..."
"powered by Claude 3.5 Sonnet"
"NEVER output code to the USER" (chỉ dùng tools)
"Before calling each tool, first explain..."
"DO NOT loop more than 3 times on fixing linter errors"
"Address the root cause instead of the symptoms"
```

---

### 2. **Windsurf IDE** (Codeium Cascade)

**Architecture:**
```
User Prompt
    ↓
Windsurf IDE (VSCode-based)
    ↓
Cascade Agent (AI Flow Paradigm)
    ↓
Agentic Tools:
  - Autonomous decision making
  - Multi-step planning
  - Context gathering
  - Code generation
    ↓
Supercomplete (Fast completion model)
    ↓
Terminal Integration
    ↓
Self-correction loop
```

**Key Differences:**
- ✅ **AI Flow Paradigm**: Agent có thể work independently
- ✅ **Autonomous**: Tự quyết định next steps
- ✅ **Self-Correction**: Detect và fix own errors
- ✅ **Enterprise-Ready**: Security, hybrid/self-hosted deployment
- ✅ **Proprietary Infrastructure**: Custom code completion, retrieval
- ❌ **Less Transparent**: Ít thông tin về internal architecture

---

### 3. **OpenAI Function Calling** (Standard Approach)

**Architecture:**
```
User Prompt
    ↓
OpenAI API
    ↓
System Prompt + Functions Schema
    ↓
GPT-4 (with function calling)
    ↓
Response with tool_calls array:
  {
    "tool_calls": [{
      "id": "call_abc",
      "type": "function",
      "function": {
        "name": "get_weather",
        "arguments": "{\"city\":\"Tokyo\"}"
      }
    }]
  }
    ↓
Client executes function
    ↓
Send result back as tool message:
  {
    "role": "tool",
    "tool_call_id": "call_abc",
    "content": "{\"temp\": 22}"
  }
    ↓
Loop until finish_reason = "stop"
```

**Streaming với Function Calling:**
```
Chunk 1: {delta: {tool_calls: [{index: 0, function: {name: "get_weather"}}]}}
Chunk 2: {delta: {tool_calls: [{index: 0, function: {arguments: "{\"city\""}}]}}
Chunk 3: {delta: {tool_calls: [{index: 0, function: {arguments: ":\"Tokyo\"}"}}]}}
Chunk 4: {delta: {tool_calls: [{index: 0, function: {arguments: "}"}}]}}
Chunk 5: {finish_reason: "tool_calls"}
```

**Key Differences:**
- ✅ **Native API Support**: Built into OpenAI/Anthropic APIs
- ✅ **Structured Output**: JSON schema validation
- ✅ **Tool Call IDs**: Track multiple parallel tool calls
- ✅ **Streaming Support**: Arguments streamed incrementally
- ❌ **API-Dependent**: Phải dùng providers hỗ trợ function calling
- ❌ **Less Flexible**: Bị giới hạn bởi API format

---

### 4. **AIO Framework** (Text-based Tool Calling)

**Architecture:**
```
User Prompt
    ↓
AIO Framework
    ↓
Inject Tool Prompt vào systemPrompt
    ↓
Any LLM Provider (Google AI, OpenRouter, etc.)
    ↓
Stream Response với [tool] tags:
  "Let me check...\n\n[tool]\n{\"name\":\"get_weather\",...}\n[/tool]"
    ↓
Real-time Tag Parser:
  - Detect [tool] → Emit "pending"
  - Accumulate JSON content
  - Detect [/tool] → STOP STREAM
  - Parse JSON → Emit "executing"
    ↓
User's onToolCall() handler
    ↓
Format result as [tool_result] tag
    ↓
Add to messages và loop
```

**Key Differences:**
- ✅ **Provider-Agnostic**: Works với bất kỳ LLM nào
- ✅ **No API Dependency**: Không cần function calling API
- ✅ **User Control**: User tự implement tool logic
- ✅ **Streaming-Only**: Optimized cho real-time UX
- ✅ **Lightweight**: Minimal framework overhead
- ❌ **Text-based**: Phụ thuộc vào LLM generate đúng format
- ❌ **No Validation**: Không có JSON schema validation built-in

---

## 📊 Comparison Table

| Feature | Cursor | Windsurf | OpenAI API | AIO Framework |
|---------|--------|----------|------------|---------------|
| **Tool Calling Method** | Native Function Calling | Proprietary Agentic | Native Function Calling | Text-based Tags |
| **Provider Support** | Anthropic, OpenAI | Proprietary | OpenAI, Anthropic | Any LLM |
| **Streaming** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes (Only) |
| **Self-Correction** | ✅ Lint Feedback | ✅ Autonomous | ❌ Manual | ✅ Iterative Loop |
| **Code Apply** | ✅ Semantic Diff + Apply Model | ✅ Built-in | ❌ Manual | ❌ User Implements |
| **Vector Search** | ✅ Built-in | ✅ Built-in | ❌ Manual | ❌ User Implements |
| **Max Tool Calls** | ~25 per interaction | Unlimited | Unlimited | 5 (configurable) |
| **Open Source** | ❌ Closed | ❌ Closed | ✅ API Docs | ✅ Open Source |
| **Cost** | $20/month | $10-15/month | Pay-per-token | Pay-per-token |
| **Customization** | ⚠️ Rules only | ⚠️ Limited | ✅ Full Control | ✅ Full Control |

---

## 🎯 Key Insights

### **Cursor's Secret Sauce:**
1. **Two-Model Architecture**: Expensive agent + cheap apply model
2. **Semantic Diff**: Agent không viết full code, chỉ viết diff
3. **Lint Feedback**: Linter results được feed back vào agent
4. **Prompt Engineering**: Rất chi tiết và well-crafted system prompts
5. **Caching**: Static prompts để tận dụng prompt caching

### **Why Text-based Tool Calling Works:**
1. **Universal**: Works với mọi LLM, không cần API support
2. **Simple**: Dễ implement và debug
3. **Flexible**: User có full control over tool execution
4. **Transparent**: Có thể see exactly what AI is doing

### **Trade-offs:**
- **Native Function Calling** (Cursor, OpenAI):
  - ✅ Structured, validated, reliable
  - ❌ API-dependent, less flexible
  
- **Text-based Tool Calling** (AIO):
  - ✅ Universal, flexible, transparent
  - ❌ Depends on LLM following format

---

## 💡 Best Practices (Learned from Cursor)

### 1. **System Prompt Design**
```typescript
// ✅ Good - Clear, actionable instructions
"Before calling each tool, explain what you're doing"
"Address the root cause instead of symptoms"
"DO NOT loop more than 3 times on fixing errors"

// ❌ Bad - Vague, negative instructions
"Don't make mistakes"
"Be careful"
"Try your best"
```

### 2. **Tool Design**
```typescript
// ✅ Good - Force reasoning with explanation parameter
{
  name: "read_file",
  parameters: {
    file_path: { type: "string", required: true },
    explanation: { 
      type: "string", 
      description: "Why you need to read this file",
      required: true 
    }
  }
}

// ❌ Bad - No reasoning required
{
  name: "read_file",
  parameters: {
    file_path: { type: "string", required: true }
  }
}
```

### 3. **Codebase Organization**
```
✅ Good:
  - Unique file names (foo-page.js, bar-page.js)
  - Full file paths in docs
  - Files < 500 LoC
  - Rich comments and docstrings
  - Organized hot-paths

❌ Bad:
  - Multiple page.js files
  - Relative paths everywhere
  - Huge monolithic files
  - No comments
  - Scattered related code
```

### 4. **Error Handling**
```typescript
// ✅ Good - Self-correction with feedback
try {
  const result = await executeTool(call);
  return { success: true, data: result };
} catch (error) {
  // Return detailed error for AI to learn from
  return { 
    success: false, 
    error: error.message,
    suggestion: "Try using X instead of Y"
  };
}
```

---

## 🚀 Future Directions

### **MCP (Model Context Protocol)**
- Standardized way to expose tools to LLMs
- Cursor, Claude, and others adopting MCP
- AIO Framework could integrate MCP servers

### **Agentic Evolution**
```
Phase 1: Auto-complete (GPT-2 era)
Phase 2: Instruction following (ChatGPT)
Phase 3: Tool calling (Current - Cursor, AIO)
Phase 4: Autonomous agents (Future - Windsurf Cascade)
Phase 5: Multi-agent systems (Future)
```

### **AI-Friendly Codebases**
The future: Codebases so well-structured that agents need minimal tools and rules to work perfectly.

---

## 📚 References

- [How Cursor AI IDE Works](https://blog.sshh.io/p/how-cursor-ai-ide-works) - Deep dive into Cursor architecture
- [Cursor System Prompts](https://medium.com/@johnmunn/the-anatomy-of-a-cursor-prompt-f7146f9bdd4e) - Extracted prompts
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling) - Official docs
- [Windsurf Cascade](https://docs.codeium.com/windsurf/cascade) - Agentic IDE documentation
- [Tool Calling Fundamentals](https://arunbaby.com/ai-agents/0004-tool-calling-fundamentals/) - Concepts

---

**Content rephrased for compliance with licensing restrictions. Original sources cited above.**

