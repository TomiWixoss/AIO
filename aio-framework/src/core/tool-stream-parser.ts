/**
 * Tool Stream Parser
 * Parse tool calls từ streaming response real-time
 */

import { ToolCall, ToolDefinition } from "../types.js";

/**
 * Generate system prompt for tools
 */
export function generateToolSystemPrompt(tools: ToolDefinition[]): string {
  if (tools.length === 0) return "";

  const toolDescriptions = tools
    .map((t) => {
      const paramsDesc = Object.entries(t.parameters)
        .map(
          ([name, info]) =>
            `    - ${name} (${info.type}${info.required ? ", required" : ""}): ${info.description}`
        )
        .join("\n");

      return `- ${t.name}: ${t.description}
  Parameters:
${paramsDesc}`;
    })
    .join("\n\n");

  return `
You have access to the following tools to help answer user questions:

${toolDescriptions}

To use a tool, wrap your request in [tool] tags like this:
[tool]
{"name": "tool_name", "params": {"param1": "value1", "param2": "value2"}}
[/tool]

Wait for the tool result before continuing. The result will be provided in [tool_result] tags.
Only use tools when necessary to answer the user's question.
Always use the exact parameter names as specified above.
`;
}

/**
 * Format tool result for LLM
 */
export function formatToolResult(toolName: string, result: any, error?: string): string {
  return `[tool_result]
Tool: ${toolName}
Success: ${!error}
${error ? `Error: ${error}` : `Data: ${JSON.stringify(result, null, 2)}`}
[/tool_result]`;
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

    // Check for [tool] opening tag
    if (!this.inToolTag && this.buffer.includes("[tool]")) {
      const parts = this.buffer.split("[tool]");
      this.textBeforeTool = parts[0];
      this.buffer = parts.slice(1).join("[tool]");
      this.inToolTag = true;
      this.toolContent = "";

      return {
        text: this.textBeforeTool,
        toolCallPending: true,
      };
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
