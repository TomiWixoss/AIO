/**
 * Tool Stream Parser
 * Parse tool calls từ streaming response real-time
 */

import { ToolCall, ToolDefinition } from "../types.js";

/**
 * Generate system prompt for tools (XML format - inspired by Cursor IDE)
 */
export function generateToolSystemPrompt(tools: ToolDefinition[]): string {
  if (tools.length === 0) return "";

  const toolDescriptions = tools
    .map((t) => {
      const paramsDesc = Object.entries(t.parameters)
        .map(([name, info]) => {
          let desc = `  <${name}>${info.description}`;
          if (info.required) desc += ` (required)`;
          if (info.enum) desc += ` [${info.enum.join("|")}]`;
          if (info.default !== undefined) desc += ` (default: ${info.default})`;
          desc += `</${name}>`;
          return desc;
        })
        .join("\n");

      return `<${t.name}>
  Description: ${t.description}
  Parameters:
${paramsDesc}
</${t.name}>`;
    })
    .join("\n\n");

  return `
You have access to the following tools:

${toolDescriptions}

## How to Use Tools

Use XML format to call tools. Example:

<tool_call>
<function=tool_name>
<param1>value1</param1>
<param2>value2</param2>
</function>
</tool_call>

## Critical Rules

- Use the EXACT parameter names as specified above
- After outputting </tool_call>, STOP generating - the system will execute the tool
- DO NOT generate fake tool results - wait for the real result
- If a tool fails, analyze the error and try a different approach
- Focus on solving the problem, not apologizing

## Tool Result Format

After you call a tool, the system provides results:

<tool_result>
<tool>tool_name</tool>
<success>true/false</success>
<data>...</data>
</tool_result>

Use this information to continue or call additional tools if needed.
`;
}

/**
 * Format tool result for LLM (XML format with metadata)
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
  let output = `<tool_result>
<tool>${toolName}</tool>
<success>${!error}</success>`;

  if (error) {
    output += `\n<error>${error}</error>`;
    if (metadata?.suggestion) {
      output += `\n<suggestion>${metadata.suggestion}</suggestion>`;
    }
  } else {
    output += `\n<data>${JSON.stringify(result)}</data>`;
  }

  if (metadata?.executionTime) {
    output += `\n<execution_time>${metadata.executionTime}ms</execution_time>`;
  }

  if (metadata?.retryCount && metadata.retryCount > 0) {
    output += `\n<retries>${metadata.retryCount}</retries>`;
  }

  output += `\n</tool_result>`;
  
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
 * Tool Stream Parser (XML format)
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
    toolCallPending?: boolean; // Tag <tool_call> mở
    toolCall?: ToolCall; // Tool call hoàn chỉnh khi tag đóng
    toolCallError?: string; // Lỗi parse tool call
  } {
    this.buffer += chunk;

    // Check for <tool_call> opening tag
    if (!this.inToolTag && this.buffer.includes("<tool_call>")) {
      const splitPoint = this.buffer.indexOf("<tool_call>");
      this.textBeforeTool = this.buffer.substring(0, splitPoint);
      this.buffer = this.buffer.substring(splitPoint + 11); // length of "<tool_call>"
      this.inToolTag = true;
      this.toolContent = "";

      return {
        text: this.textBeforeTool,
        toolCallPending: true,
      };
    }

    // Check for </tool_call> closing tag
    if (this.inToolTag && this.buffer.includes("</tool_call>")) {
      const parts = this.buffer.split("</tool_call>");
      this.toolContent += parts[0];
      this.buffer = parts.slice(1).join("</tool_call>");
      this.inToolTag = false;

      // Parse XML tool call
      try {
        const toolCall = this.parseXMLToolCall(this.toolContent.trim());

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
   * Parse XML tool call format:
   * <function=tool_name>
   * <param1>value1</param1>
   * <param2>value2</param2>
   * </function>
   */
  private parseXMLToolCall(xmlContent: string): ToolCall {
    // Extract function name from <function=name>
    const functionMatch = xmlContent.match(/<function=(\w+)>/);
    if (!functionMatch) {
      throw new Error("Could not find function name in tool call");
    }

    const toolName = functionMatch[1];
    const params: Record<string, any> = {};

    // Extract parameters using regex
    const paramRegex = /<(\w+)>(.*?)<\/\1>/gs;
    let match;

    while ((match = paramRegex.exec(xmlContent)) !== null) {
      const [, paramName, paramValue] = match;
      
      // Skip the function tag itself
      if (paramName === "function") continue;

      // Try to parse as number if it looks like one
      const trimmedValue = paramValue.trim();
      if (/^\d+$/.test(trimmedValue)) {
        params[paramName] = parseInt(trimmedValue, 10);
      } else if (/^\d+\.\d+$/.test(trimmedValue)) {
        params[paramName] = parseFloat(trimmedValue);
      } else {
        params[paramName] = trimmedValue;
      }
    }

    return {
      name: toolName,
      params,
    };
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
