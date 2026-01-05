import { GoogleGenAI } from "@google/genai";
import { config } from "../config/index.js";
import { getGeminiApiKey, resetKeyCache } from "./key-manager.js";

// Lazy init client
let ai: GoogleGenAI | null = null;

async function getClient(): Promise<GoogleGenAI> {
  if (!ai) {
    const apiKey = await getGeminiApiKey();
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

// Reset client (khi key thay đổi)
export function resetClient() {
  ai = null;
  resetKeyCache();
}

// Normalize embedding vector (cần cho dimensions < 3072)
function normalizeEmbedding(values: number[]): number[] {
  const magnitude = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0));
  if (magnitude === 0) return values;
  return values.map((v) => v / magnitude);
}

// Task types theo docs
type TaskType =
  | "RETRIEVAL_DOCUMENT"
  | "RETRIEVAL_QUERY"
  | "SEMANTIC_SIMILARITY"
  | "CLASSIFICATION"
  | "CLUSTERING"
  | "QUESTION_ANSWERING"
  | "FACT_VERIFICATION";

// Generate embedding cho 1 text
export async function generateEmbedding(
  text: string,
  taskType: TaskType = "RETRIEVAL_DOCUMENT"
): Promise<number[]> {
  const client = await getClient();
  const response = await client.models.embedContent({
    model: config.embeddingModel,
    contents: text,
    config: {
      taskType,
      outputDimensionality: config.embeddingDimensions,
    },
  });

  const values = response.embeddings?.[0]?.values;
  if (!values) {
    throw new Error("No embedding returned");
  }

  // Normalize nếu dimensions < 3072
  if (config.embeddingDimensions < 3072) {
    return normalizeEmbedding(values);
  }
  return values;
}

// Generate embeddings cho nhiều texts (batch)
export async function generateEmbeddings(
  texts: string[],
  taskType: TaskType = "RETRIEVAL_DOCUMENT"
): Promise<number[][]> {
  const client = await getClient();
  const response = await client.models.embedContent({
    model: config.embeddingModel,
    contents: texts,
    config: {
      taskType,
      outputDimensionality: config.embeddingDimensions,
    },
  });

  if (!response.embeddings || response.embeddings.length === 0) {
    throw new Error("No embeddings returned");
  }

  // Normalize nếu dimensions < 3072
  if (config.embeddingDimensions < 3072) {
    return response.embeddings.map((e) => normalizeEmbedding(e.values!));
  }
  return response.embeddings.map((e) => e.values!);
}

// Generate query embedding (dùng RETRIEVAL_QUERY)
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  return generateEmbedding(query, "RETRIEVAL_QUERY");
}

// Generate embedding cho Q&A (dùng QUESTION_ANSWERING)
export async function generateQuestionEmbedding(
  question: string
): Promise<number[]> {
  return generateEmbedding(question, "QUESTION_ANSWERING");
}
