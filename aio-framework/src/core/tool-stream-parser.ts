/**
 * Tool Stream Parser
 * Parse tool calls từ streaming response real-time
 */

import { ToolCall, ToolDefinition } from "../types.js";

/**
 * Generate system prompt for tools (inspired by Cursor IDE)
 */
export function generateToolSystemPrompt(tools: ToolDefinition[]): string {
  if (tools.length === 0) return "";

  const toolDescriptions = tools
    .map((t) => {
      const paramsDesc = Object.entries(t.parameters)
        .map(([name, info]) => {
          let desc = `    - ${name} (${info.type}${info.required ? ", required" : ""})`;
          if (info.enum) desc += ` [${info.enum.join("|")}]`;
          if (info.default !== undefined) desc += ` (default: ${info.default})`;
          desc += `: ${info.description}`;
          return desc;
        })
        .join("\n");

      return `- ${t.name}: ${t.description}
  Parameters:
${paramsDesc}`;
    })
    .join("\n\n");

  return `
<tool_calling>
You have access to the following tools to help answer user questions:

${toolDescriptions}

## How to Use Tools

To use a tool, you MUST:
1. First explain what you're about to do and why (this helps the user understand your reasoning)
2. Then wrap your tool request in [tool] tags with this EXACT format:

[tool]
{
  "name": "tool_name",
  "params": {"param1": "value1", "param2": "value2"},
  "reasoning": "Brief explanation of why you're calling this tool"
}
[/tool]

## Critical Rules

- ALWAYS explain your reasoning before calling a tool
- ONLY use tools when necessary to answer the user's question
- Use the EXACT parameter names as specified above
- After outputting [/tool], STOP generating immediately - the system will execute the tool
- DO NOT generate fake tool results - wait for the real result in [tool_result] tags
- DO NOT apologize excessively - just focus on solving the problem
- If a tool fails, analyze the error and try a different approach
- Address the root cause of problems, not just symptoms
- DO NOT loop more than 3 times trying to fix the same error

## Tool Result Format

After you call a tool, the system will provide results in this format:
[tool_result]
Tool: tool_name
Success: true/false
Data: {...} or Error: error message
[/tool_result]

Use this information to continue your response or call additional tools if needed.
</tool_calling>
`;
}

/**
 * Format tool result for LLM (with metadata)
 */
export function formatToolResult(
  toolName: string, 
  result: any, 
  error?: string,
  metadata?: {
    executionTime?: number;
    retryCount?: number;
    suggestion?: string;
  }
): string {
  let output = `[tool_result]
Tool: ${toolName}
Success: ${!error}`;

  if (error) {
    output += `\nError: ${error}`;
    if (metadata?.suggestion) {
      output += `\nSuggestion: ${metadata.suggestion}`;
    }
  } else {
    output += `\nData: ${JSON.stringify(result, null, 2)}`;
  }

  if (metadata?.executionTime) {
    output += `\nExecution Time: ${metadata.executionTime}ms`;
  }

  if (metadata?.retryCount && metadata.retryCount > 0) {
    output += `\nRetries: ${metadata.retryCount}`;
  }

  output += `\n[/tool_result]`;
  
  return output;
}

/**
 * Validate tool call parameters
 */
export function validateToolCall(
  call: ToolCall,
  toolDef: ToolDefinition
): { valid: boolean; error?: string } {
  // Check required parameters
  for (const [paramName, paramInfo] of Object.entries(toolDef.parameters)) {
    if (paramInfo.required && !(paramName in call.params)) {
      return {
        valid: false,
        error: `Missing required parameter: ${paramName}`,
      };
    }
  }

  // Check enum values
  for (const [paramName, paramValue] of Object.entries(call.params)) {
    const paramInfo = toolDef.parameters[paramName];
    if (!paramInfo) {
      return {
        valid: false,
        error: `Unknown parameter: ${paramName}`,
      };
    }

    if (paramInfo.enum && !paramInfo.enum.includes(paramValue)) {
      return {
        valid: false,
        error: `Invalid value for ${paramName}. Must be one of: ${paramInfo.enum.join(", ")}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Apply default values to tool call parameters
 */
export function applyDefaultValues(
  call: ToolCall,
  toolDef: ToolDefinition
): ToolCall {
  const params = { ...call.params };

  for (const [paramName, paramInfo] of Object.entries(toolDef.parameters)) {
    if (!(paramName in params) && paramInfo.default !== undefined) {
      params[paramName] = paramInfo.default;
    }
  }

  return { ...call, params };
}

/**
 * Tool Stream Parser
 * Parse streaming chunks để detect và extract tool calls
 */
export class ToolStreamParser {
  private buffer = "";
  private inToolTag = false;
  private toolContent = "";
  private textBeforeTool = "";

  /**
   * Process chunk từ stream
   * @returns Object chứa text content và tool call (nếu có)
   */
  processChunk(chunk: string): {
    text: string; // Text để stream ra
    toolCallPending?: boolean; // Tag [tool] mở
    toolCall?: ToolCall; // Tool call hoàn chỉnh khi tag đóng
    toolCallError?: string; // Lỗi parse tool call
  } {
    this.buffer += chunk;

    // Check for [tool opening tag (handle partial tags)
    if (!this.inToolTag && (this.buffer.includes("[tool]") || this.buffer.includes("[tool"))) {
      let splitPoint = -1;
      let tagToSplit = "";
      
      if (this.buffer.includes("[tool]")) {
        splitPoint = this.buffer.indexOf("[tool]");
        tagToSplit = "[tool]";
      } else if (this.buffer.includes("[tool")) {
        // Partial tag at end of buffer - wait for more data
        // But if we have newline after [tool, it's complete
        const toolIndex = this.buffer.indexOf("[tool");
        const afterTool = this.buffer.substring(toolIndex + 5);
        if (afterTool.includes("\n") || afterTool.includes("]")) {
          splitPoint = toolIndex;
          tagToSplit = "[tool";
        }
      }
      
      if (splitPoint >= 0) {
        this.textBeforeTool = this.buffer.substring(0, splitPoint);
        this.buffer = this.buffer.substring(splitPoint + tagToSplit.length);
        this.inToolTag = true;
        this.toolContent = "";

        return {
          text: this.textBeforeTool,
          toolCallPending: true,
        };
      }
    }

    // Check for [/tool] closing tag
    if (this.inToolTag && this.buffer.includes("[/tool]")) {
      const parts = this.buffer.split("[/tool]");
      this.toolContent += parts[0];
      this.buffer = parts.slice(1).join("[/tool]");
      this.inToolTag = false;

      // Parse tool call
      try {
        const parsed = JSON.parse(this.toolContent.trim());
        const toolCall: ToolCall = {
          name: parsed.name,
          params: parsed.params || {},
        };

        // Reset
        this.toolContent = "";
        this.textBeforeTool = "";

        return {
          text: "",
          toolCall,
        };
      } catch (error: any) {
        const errorMsg = `Failed to parse tool call: ${error.message}`;
        this.toolContent = "";
        this.textBeforeTool = "";

        return {
          text: "",
          toolCallError: errorMsg,
        };
      }
    }

    // Accumulate tool content
    if (this.inToolTag) {
      this.toolContent += this.buffer;
      this.buffer = "";
      return { text: "" };
    }

    // Normal text streaming
    const text = this.buffer;
    this.buffer = "";
    return { text };
  }

  /**
   * Check if currently inside a tool tag
   */
  isInToolTag(): boolean {
    return this.inToolTag;
  }

  /**
   * Get remaining buffer (for cleanup)
   */
  getBuffer(): string {
    return this.buffer;
  }

  /**
   * Reset parser state
   */
  reset(): void {
    this.buffer = "";
    this.inToolTag = false;
    this.toolContent = "";
    this.textBeforeTool = "";
  }
}
