import { BaseTool, ToolDefinition, ToolResult } from "./base.js";

export interface GoogleSearchCredentials {
  api_key: string;
  cse_id: string;
}

export class GoogleSearchTool extends BaseTool {
  readonly id = "google_search";
  readonly displayName = "Google Search";
  readonly description = "Tìm kiếm thông tin trên Google";

  private readonly baseUrl = "https://www.googleapis.com/customsearch/v1";

  getDefinition(): ToolDefinition {
    return {
      name: this.id,
      description: this.description,
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Từ khóa tìm kiếm",
          },
          num: {
            type: "number",
            description: "Số kết quả trả về (1-10)",
            default: 5,
          },
        },
        required: ["query"],
      },
    };
  }

  // credentials = { api_key, cse_id }
  async execute(
    params: Record<string, any>,
    credentials: GoogleSearchCredentials
  ): Promise<ToolResult> {
    try {
      const { query, num = 5 } = params;
      const { api_key, cse_id } = credentials;

      if (!cse_id) {
        return { success: false, error: "Google CSE ID not provided" };
      }

      const url = new URL(this.baseUrl);
      url.searchParams.set("key", api_key);
      url.searchParams.set("cx", cse_id);
      url.searchParams.set("q", query);
      url.searchParams.set("num", Math.min(num, 10).toString());

      const response = await fetch(url.toString());
      const data: any = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || "Google Search API error",
        };
      }

      const results = (data.items || []).map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
      }));

      return { success: true, data: results };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
