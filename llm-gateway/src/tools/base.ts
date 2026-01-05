// Base interface cho tất cả tools
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export abstract class BaseTool {
  abstract readonly id: string;
  abstract readonly displayName: string;
  abstract readonly description: string;

  // OpenAI function calling format
  abstract getDefinition(): ToolDefinition;

  // Execute tool với credentials (có thể là object chứa nhiều key)
  abstract execute(
    params: Record<string, any>,
    credentials: Record<string, any>
  ): Promise<ToolResult>;
}

// Registry các tool có sẵn
export const AVAILABLE_TOOLS: Record<string, string> = {
  google_search: "Google Custom Search API",
};
