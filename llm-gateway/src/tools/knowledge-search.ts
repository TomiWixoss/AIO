import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

export interface KnowledgeSearchParams {
  query: string;
  knowledge_base_id?: number;
  limit?: number;
}

export interface SearchResult {
  id: number;
  content: string;
  metadata: Record<string, any> | null;
  similarity: number;
}

export interface KnowledgeSearchResult {
  success: boolean;
  data?: SearchResult[];
  error?: string;
}

// Response types
interface ApiResponse {
  data?: any;
  error?: { message?: string };
}

// Get all active knowledge bases
async function getActiveKnowledgeBases(): Promise<
  Array<{ id: number; name: string }>
> {
  try {
    const res = await fetch(
      `${config.databaseServiceUrl}/knowledge-bases/active`
    );
    if (!res.ok) return [];
    const json = (await res.json()) as ApiResponse;
    return json.data || [];
  } catch {
    return [];
  }
}

// Search in a knowledge base via database-service
async function searchInKnowledgeBase(
  kbId: number,
  query: string,
  limit: number
): Promise<SearchResult[]> {
  const res = await fetch(
    `${config.databaseServiceUrl}/knowledge-bases/${kbId}/search`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit }),
    }
  );

  if (!res.ok) {
    const error = (await res.json().catch(() => ({}))) as ApiResponse;
    throw new Error(error.error?.message || "Search failed");
  }

  const json = (await res.json()) as ApiResponse;
  return json.data || [];
}

// Main search function
export async function searchKnowledge(
  params: KnowledgeSearchParams
): Promise<KnowledgeSearchResult> {
  const { query, knowledge_base_id, limit = 5 } = params;

  if (!query) {
    return { success: false, error: "query is required" };
  }

  try {
    let results: SearchResult[] = [];

    if (knowledge_base_id) {
      // Search specific knowledge base
      results = await searchInKnowledgeBase(knowledge_base_id, query, limit);
    } else {
      // Search all active knowledge bases
      const knowledgeBases = await getActiveKnowledgeBases();
      if (knowledgeBases.length === 0) {
        return { success: true, data: [] };
      }

      // Search each and merge results
      const allResults: SearchResult[] = [];
      for (const kb of knowledgeBases) {
        try {
          const kbResults = await searchInKnowledgeBase(kb.id, query, limit);
          allResults.push(...kbResults);
        } catch (e) {
          logger.warn(`Failed to search knowledge base ${kb.name}`, {
            error: e,
          });
        }
      }

      // Sort by similarity and take top results
      results = allResults
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    }

    logger.info("Knowledge search completed", {
      query: query.substring(0, 50),
      resultsCount: results.length,
    });

    return { success: true, data: results };
  } catch (error: any) {
    logger.error("Knowledge search error", { error: error.message });
    return { success: false, error: error.message };
  }
}

// Tool definition for AI
export const knowledgeSearchToolDefinition = {
  name: "search_knowledge",
  description:
    "Tìm kiếm thông tin trong cơ sở kiến thức (knowledge base). Sử dụng tool này khi cần tra cứu thông tin về sản phẩm, dịch vụ, chính sách, FAQ, hoặc bất kỳ dữ liệu nào đã được lưu trữ.",
  parameters: {
    query: {
      type: "string",
      description: "Câu hỏi hoặc từ khóa cần tìm kiếm",
      required: true,
    },
    knowledge_base_id: {
      type: "number",
      description:
        "ID của knowledge base cụ thể (không bắt buộc, mặc định tìm tất cả)",
      required: false,
    },
    limit: {
      type: "number",
      description: "Số lượng kết quả tối đa (mặc định 5)",
      required: false,
    },
  },
};
