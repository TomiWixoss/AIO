import { createTool, ToolResult } from "../tools/index.js";
import { dbGet } from "../utils/db-client.js";
import { decrypt } from "../utils/encryption.js";
import { logger } from "../utils/logger.js";

export interface ToolConfig {
  id: number;
  tool_id: string;
  credentials: Record<string, any>;
}

interface ToolRow {
  id: number;
  tool_id: string;
  is_active: boolean;
  config: string | null;
}

interface ApiKeyRow {
  id: number;
  credentials_encrypted: string;
  priority: number;
}

// Generate system prompt cho tools
export function generateToolSystemPrompt(tools: ToolConfig[]): string {
  if (tools.length === 0) return "";

  const toolDescriptions = tools
    .map((t) => {
      const tool = createTool(t.tool_id);
      if (!tool) return "";
      const def = tool.getDefinition();
      return `- ${def.name}: ${def.description}
  Parameters: ${JSON.stringify(def.parameters.properties)}`;
    })
    .filter(Boolean)
    .join("\n");

  return `
You have access to the following tools:
${toolDescriptions}

To use a tool, wrap your request in [tool] tags like this:
[tool]
{"name": "tool_name", "params": {"param1": "value1"}}
[/tool]

Wait for the tool result before continuing. The result will be provided in [tool_result] tags.
Only use tools when necessary to answer the user's question.
`;
}

// Parse tool calls từ response
export function parseToolCalls(
  content: string
): Array<{ name: string; params: Record<string, any> }> | null {
  const toolRegex = /\[tool\]([\s\S]*?)\[\/tool\]/g;
  const matches = [...content.matchAll(toolRegex)];

  if (matches.length === 0) return null;

  const calls: Array<{ name: string; params: Record<string, any> }> = [];

  for (const match of matches) {
    try {
      const json = match[1].trim();
      const parsed = JSON.parse(json);
      if (parsed.name && parsed.params) {
        calls.push(parsed);
      }
    } catch (e) {
      logger.warn("Failed to parse tool call", { content: match[1] });
    }
  }

  return calls.length > 0 ? calls : null;
}

// Execute tool và trả về kết quả
export async function executeTool(
  toolId: string,
  params: Record<string, any>,
  toolConfigs: ToolConfig[]
): Promise<ToolResult> {
  const toolConfig = toolConfigs.find((t) => t.tool_id === toolId);
  if (!toolConfig) {
    return { success: false, error: `Tool ${toolId} not configured` };
  }

  const tool = createTool(toolId);
  if (!tool) {
    return { success: false, error: `Tool ${toolId} not found` };
  }

  try {
    const result = await tool.execute(params, toolConfig.credentials);
    logger.info("Tool executed", { toolId, success: result.success });
    return result;
  } catch (error: any) {
    logger.error("Tool execution error", { toolId, error: error.message });
    return { success: false, error: error.message };
  }
}

// Format tool result để gửi lại cho model
export function formatToolResult(toolName: string, result: ToolResult): string {
  return `[tool_result]
Tool: ${toolName}
Success: ${result.success}
${
  result.success
    ? `Data: ${JSON.stringify(result.data, null, 2)}`
    : `Error: ${result.error}`
}
[/tool_result]`;
}

// Load tool configs từ DB (với credentials đã decrypt)
export async function loadToolConfigs(
  toolIds: number[]
): Promise<ToolConfig[]> {
  if (toolIds.length === 0) return [];

  const configs: ToolConfig[] = [];

  for (const toolId of toolIds) {
    try {
      // Lấy tool info
      const tool = await dbGet<ToolRow>(`/tools/${toolId}`);

      // Lấy active key cho tool
      const keys = await dbGet<ApiKeyRow[]>(`/api-keys/tool/${toolId}/active`);
      if (keys.length === 0) {
        logger.warn("No active key for tool", { toolId });
        continue;
      }

      // Lấy key đầu tiên (đã sort theo priority)
      const key = keys[0];
      const credentials = JSON.parse(decrypt(key.credentials_encrypted));

      configs.push({
        id: toolId,
        tool_id: tool.tool_id,
        credentials,
      });
    } catch (error: any) {
      logger.error("Failed to load tool config", {
        toolId,
        error: error.message,
      });
    }
  }

  return configs;
}
