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
  provider_id: string; // Đây là tên provider (google-ai, groq, etc.)
  name?: string; // Alias cho provider_id
  display_name?: string;
  base_url?: string;
  is_active: boolean;
  priority?: number;
  active_keys_count?: number;
  models_count?: number;
}

export interface Model {
  id: number;
  provider_id: number;
  model_id: string;
  display_name: string;
  is_active: boolean;
  is_fallback?: boolean;
  priority?: number;
  provider_name?: string;
  provider_priority?: number;
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
  headers_template?: object | string;
  body_template?: object | string;
  query_params_template?: object | string;
  parameters?: object | string;
  response_mapping?: object | string;
  is_active: boolean;
}



export interface Chatbot {
  id: number;
  name: string;
  slug: string;
  description: string;
  provider_id: number | null;
  model_id: number | null;
  provider_name: string | null;
  model_name: string | null;
  model_display_name: string | null;
  auto_mode: boolean;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  tool_ids: number[] | null;
  welcome_message: string;
  placeholder_text: string;
  is_public: boolean;
  api_key: string;
  allowed_origins: string[] | null;
  is_active: boolean;
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
  total_requests?: number;
  total_tokens?: number | { prompt: number; completion: number };
  requests_today?: number;
  tokens_today?: number;
  requests?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  by_provider?: Array<{ name: string; requests: number; tokens: number }>;
  by_status?: Array<{ status: string; count: number }>;
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
  test: (id: number, params: Record<string, any>) =>
    api.post<{ success: boolean; data: any }>(`/tools/${id}/test`, { params }),
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

// Chatbots API
export const chatbotsApi = {
  getAll: () => api.get<{ success: boolean; data: Chatbot[] }>("/chatbots"),
  getById: (id: number) =>
    api.get<{ success: boolean; data: Chatbot }>(`/chatbots/${id}`),
  create: (data: Partial<Chatbot>) => api.post("/chatbots", data),
  update: (id: number, data: Partial<Chatbot>) =>
    api.put(`/chatbots/${id}`, data),
  delete: (id: number) => api.delete(`/chatbots/${id}`),
  regenerateKey: (id: number) => api.post(`/chatbots/${id}/regenerate-key`, {}),
  exportCode: (id: number) =>
    api.get<{ success: boolean; data: Record<string, any> }>(
      `/chatbots/${id}/export-code`
    ),
};
