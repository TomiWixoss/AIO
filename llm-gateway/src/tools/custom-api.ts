import { logger } from "../utils/logger.js";

export interface ToolConfig {
  id: number;
  name: string;
  description: string;
  endpoint_url: string;
  http_method: "GET" | "POST" | "PUT" | "DELETE";
  headers_template: Record<string, string> | null;
  body_template: Record<string, any> | null;
  query_params_template: Record<string, string> | null;
  parameters: Record<
    string,
    { type: string; description: string; required?: boolean }
  >;
  response_mapping: Record<string, string> | null;
  credentials: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Replace placeholders trong string: {{api_key}} -> actual value
function replacePlaceholders(
  template: string,
  values: Record<string, any>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return values[key] !== undefined ? String(values[key]) : `{{${key}}}`;
  });
}

// Replace placeholders trong object
function replaceInObject(
  obj: Record<string, any>,
  values: Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = replacePlaceholders(value, values);
    } else if (typeof value === "object" && value !== null) {
      result[key] = replaceInObject(value, values);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// Execute custom API tool
export async function executeCustomApiTool(
  tool: ToolConfig,
  params: Record<string, any>
): Promise<ToolResult> {
  try {
    // Merge credentials + params for placeholder replacement
    const allValues = { ...tool.credentials, ...params };

    // Build URL với path params
    let url = replacePlaceholders(tool.endpoint_url, allValues);

    // Add query params
    if (tool.query_params_template) {
      const queryParams = replaceInObject(
        tool.query_params_template,
        allValues
      );
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined && value !== null && !value.includes("{{")) {
          searchParams.append(key, String(value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes("?") ? "&" : "?") + queryString;
      }
    }

    // Build headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (tool.headers_template) {
      const customHeaders = replaceInObject(tool.headers_template, allValues);
      Object.assign(headers, customHeaders);
    }

    // Build body
    let body: string | undefined;
    if (["POST", "PUT"].includes(tool.http_method) && tool.body_template) {
      const bodyObj = replaceInObject(tool.body_template, allValues);
      body = JSON.stringify(bodyObj);
    }

    logger.info("Executing custom API tool", {
      tool: tool.name,
      url,
      method: tool.http_method,
    });

    // Make request
    const response = await fetch(url, {
      method: tool.http_method,
      headers,
      body,
    });

    const data = await response.json().catch(() => response.text());

    if (!response.ok) {
      return {
        success: false,
        error: typeof data === "object" ? JSON.stringify(data) : String(data),
      };
    }

    // Apply response mapping if defined
    let mappedData: any = data;
    if (tool.response_mapping && typeof data === "object") {
      mappedData = {};
      for (const [key, path] of Object.entries(tool.response_mapping)) {
        mappedData[key] = getValueByPath(data, path);
      }
    }

    return { success: true, data: mappedData };
  } catch (error: any) {
    logger.error("Custom API tool error", {
      tool: tool.name,
      error: error.message,
    });
    return { success: false, error: error.message };
  }
}

// Get value from object by JSONPath-like string: "$.order.status"
function getValueByPath(obj: any, path: string): any {
  const parts = path.replace(/^\$\.?/, "").split(".");
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}
