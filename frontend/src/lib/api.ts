import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Interceptor để thêm token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Types
export interface Admin {
  id: number;
  email: string;
  name: string;
}

export interface Provider {
  id: number;
  name: string;
  display_name: string;
  base_url: string;
  is_active: boolean;
}

export interface Model {
  id: number;
  provider_id: number;
  model_id: string;
  display_name: string;
  context_length: number | null;
  is_active: boolean;
  provider_name?: string;
}

export interface ApiKey {
  id: number;
  provider_id?: number;
  tool_id?: number;
  name: string;
  is_active: boolean;
  priority: number;
  requests_today: number;
  daily_limit: number | null;
  last_error?: string;
}

export interface Tool {
  id: number;
  name: string;
  description: string;
  endpoint_url: string;
  http_method: string;
  is_active: boolean;
}

export interface KnowledgeBase {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  item_count?: number;
}

export interface ChatSession {
  id: number;
  session_key: string;
  title: string;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface Stats {
  total_requests: number;
  total_tokens: number;
  requests_today: number;
  tokens_today: number;
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ success: boolean; data: { token: string; admin: Admin } }>(
      "/auth/login",
      { email, password }
    ),
  register: (email: string, password: string, name: string) =>
    api.post<{ success: boolean; data: { token: string; admin: Admin } }>(
      "/auth/register",
      { email, password, name }
    ),
  me: () => api.get<{ success: boolean; data: Admin }>("/auth/me"),
};

// Providers API
export const providersApi = {
  getAll: () => api.get<{ success: boolean; data: Provider[] }>("/providers"),
  getById: (id: number) =>
    api.get<{ success: boolean; data: Provider }>(`/providers/${id}`),
  create: (data: Partial<Provider>) => api.post("/providers", data),
  update: (id: number, data: Partial<Provider>) =>
    api.put(`/providers/${id}`, data),
  delete: (id: number) => api.delete(`/providers/${id}`),
};

// Models API
export const modelsApi = {
  getAll: () => api.get<{ success: boolean; data: Model[] }>("/models"),
  getByProvider: (providerId: number) =>
    api.get<{ success: boolean; data: Model[] }>(
      `/models/provider/${providerId}`
    ),
  create: (data: Partial<Model>) => api.post("/models", data),
  update: (id: number, data: Partial<Model>) => api.put(`/models/${id}`, data),
  delete: (id: number) => api.delete(`/models/${id}`),
};

// API Keys API
export const apiKeysApi = {
  getByProvider: (providerId: number) =>
    api.get<{ success: boolean; data: ApiKey[] }>(
      `/api-keys/provider/${providerId}`
    ),
  getByTool: (toolId: number) =>
    api.get<{ success: boolean; data: ApiKey[] }>(`/api-keys/tool/${toolId}`),
  createForProvider: (data: any) => api.post("/api-keys/provider", data),
  createForTool: (data: any) => api.post("/api-keys/tool", data),
  update: (id: number, data: any) => api.put(`/api-keys/${id}`, data),
  delete: (id: number) => api.delete(`/api-keys/${id}`),
};

// Tools API
export const toolsApi = {
  getAll: () => api.get<{ success: boolean; data: Tool[] }>("/tools"),
  getActive: () => api.get<{ success: boolean; data: Tool[] }>("/tools/active"),
  getById: (id: number) =>
    api.get<{ success: boolean; data: Tool }>(`/tools/${id}`),
  create: (data: Partial<Tool>) => api.post("/tools", data),
  update: (id: number, data: Partial<Tool>) => api.put(`/tools/${id}`, data),
  delete: (id: number) => api.delete(`/tools/${id}`),
};

// Knowledge Bases API
export const knowledgeApi = {
  getAll: () =>
    api.get<{ success: boolean; data: KnowledgeBase[] }>("/knowledge-bases"),
  getActive: () =>
    api.get<{ success: boolean; data: KnowledgeBase[] }>(
      "/knowledge-bases/active"
    ),
  getById: (id: number) =>
    api.get<{ success: boolean; data: KnowledgeBase }>(
      `/knowledge-bases/${id}`
    ),
  create: (data: Partial<KnowledgeBase>) => api.post("/knowledge-bases", data),
  update: (id: number, data: Partial<KnowledgeBase>) =>
    api.put(`/knowledge-bases/${id}`, data),
  delete: (id: number) => api.delete(`/knowledge-bases/${id}`),
  getItems: (id: number) => api.get(`/knowledge-bases/${id}/items`),
  addItem: (id: number, data: any) =>
    api.post(`/knowledge-bases/${id}/items`, data),
  deleteItem: (kbId: number, itemId: number) =>
    api.delete(`/knowledge-bases/${kbId}/items/${itemId}`),
};

// Chat API
export const chatApi = {
  send: (data: {
    session_key?: string;
    provider: string;
    model: string;
    message: string;
    system_prompt?: string;
    stream?: boolean;
    tool_ids?: number[];
  }) => api.post("/chat", data),
  getSessions: () =>
    api.get<{ success: boolean; data: ChatSession[] }>("/chat/sessions"),
  getSession: (key: string) =>
    api.get<{
      success: boolean;
      data: ChatSession & { messages: ChatMessage[] };
    }>(`/chat/sessions/${key}`),
  cancel: (sessionKey: string) => api.post(`/chat/cancel/${sessionKey}`),
  regenerate: (messageId: number, stream?: boolean) =>
    api.post(`/chat/regenerate/${messageId}`, { stream }),
};

// Stats API
export const statsApi = {
  get: () => api.get<{ success: boolean; data: Stats }>("/stats"),
  getToday: () => api.get<{ success: boolean; data: Stats }>("/stats/today"),
  getLogs: (limit?: number, page?: number) =>
    api.get(`/stats/logs?limit=${limit || 100}&page=${page || 1}`),
};

// Admins API
export const adminsApi = {
  getAll: () => api.get<{ success: boolean; data: Admin[] }>("/admins"),
  create: (data: { email: string; password: string; name: string }) =>
    api.post("/admins", data),
  update: (id: number, data: { name?: string; password?: string }) =>
    api.put(`/admins/${id}`, data),
  delete: (id: number) => api.delete(`/admins/${id}`),
};
