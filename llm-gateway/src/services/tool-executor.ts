import { executeCustomApiTool } from "../tools/custom-api.js";
import type { ToolConfig, ToolResult } from "../tools/custom-api.js";
export type { ToolConfig, ToolResult };
import {
  searchKnowledge,
  knowledgeSearchToolDefinition,
} from "../tools/knowledge-search.js";
import { dbGet } from "../utils/db-client.js";
import { decrypt } from "../utils/encryption.js";
import { logger } from "../utils/logger.js";

// Built-in tools
const BUILTIN_TOOLS = {
  search_knowledge: {
    execute: searchKnowledge,
    definition: knowledgeSearchToolDefinition,
  },
};

interface ToolRow {
  id: number;
  name: string;
  description: string;
  endpoint_url: string;
  http_method: "GET" | "POST" | "PUT" | "DELETE";
  headers_template: string | null;
  body_template: string | null;
  query_params_template: string | null;
  parameters: string;
  response_mapping: string | null;
}

interface ApiKeyRow {
  id: number;
  credentials_encrypted: string;
}

// Generate system prompt cho tools
export function generateToolSystemPrompt(
  tools: ToolConfig[],
  includeBuiltinTools: boolean = true
): string {
  const allTools: Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }> = [];

  // Add custom API tools
  for (const t of tools) {
    allTools.push({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    });
  }

  // Add built-in tools
  if (includeBuiltinTools) {
    for (const [name, tool] of Object.entries(BUILTIN_TOOLS)) {
      allTools.push({
        name,
        description: tool.definition.description,
        parameters: tool.definition.parameters,
      });
    }
  }

  if (allTools.length === 0) return "";

  const toolDescriptions = allTools
    .map((t) => {
      const paramsDesc = Object.entries(t.parameters)
        .map(
          ([name, info]: [string, any]) =>
            `    - ${name} (${info.type}${
              info.required ? ", required" : ""
            }): ${info.description}`
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
      if (parsed.name) {
        calls.push({
          name: parsed.name,
          params: parsed.params || {},
        });
      }
    } catch (e) {
      logger.warn("Failed to parse tool call", { content: match[1] });
    }
  }

  return calls.length > 0 ? calls : null;
}

// Execute tool
export async function executeTool(
  toolName: string,
  params: Record<string, any>,
  toolConfigs: ToolConfig[]
): Promise<ToolResult> {
  // Check built-in tools first
  if (toolName in BUILTIN_TOOLS) {
    const builtinTool = BUILTIN_TOOLS[toolName as keyof typeof BUILTIN_TOOLS];
    return builtinTool.execute(params as any);
  }

  // Then check custom API tools
  const toolConfig = toolConfigs.find((t) => t.name === toolName);
  if (!toolConfig) {
    return { success: false, error: `Tool "${toolName}" not found` };
  }

  return executeCustomApiTool(toolConfig, params);
}

// Format tool result
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

// Load tool configs từ DB
export async function loadToolConfigs(
  toolIds: number[]
): Promise<ToolConfig[]> {
  if (toolIds.length === 0) return [];

  const configs: ToolConfig[] = [];

  // Helper to safely parse JSON or return as-is if already object
  const safeJsonParse = (value: any): any => {
    if (value === null || value === undefined) return null;
    if (typeof value === "object") return value; // Already parsed
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return null;
  };

  for (const toolId of toolIds) {
    try {
      const tool = await dbGet<ToolRow>(`/tools/${toolId}`);

      // Lấy active key cho tool (nếu có)
      let credentials: Record<string, any> = {};
      try {
        const keys = await dbGet<ApiKeyRow[]>(
          `/api-keys/tool/${toolId}/active`
        );
        if (keys.length > 0) {
          credentials = JSON.parse(decrypt(keys[0].credentials_encrypted));
        }
      } catch (e) {
        // Tool có thể không cần API key
        logger.debug("No API key for tool", { toolId });
      }

      configs.push({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        endpoint_url: tool.endpoint_url,
        http_method: tool.http_method,
        headers_template: safeJsonParse(tool.headers_template),
        body_template: safeJsonParse(tool.body_template),
        query_params_template: safeJsonParse(tool.query_params_template),
        parameters: safeJsonParse(tool.parameters) || {},
        response_mapping: safeJsonParse(tool.response_mapping),
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
