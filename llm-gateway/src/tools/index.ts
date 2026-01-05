import { BaseTool, AVAILABLE_TOOLS } from "./base.js";
import { GoogleSearchTool } from "./google-search.js";

export * from "./base.js";
export * from "./google-search.js";

// Factory tạo tool instance từ tool_id
export function createTool(toolId: string): BaseTool | null {
  switch (toolId) {
    case "google_search":
      return new GoogleSearchTool();
    default:
      return null;
  }
}

// Lấy danh sách tool có sẵn trong code
export function getAvailableTools() {
  return Object.entries(AVAILABLE_TOOLS).map(([id, name]) => ({
    tool_id: id,
    display_name: name,
  }));
}
