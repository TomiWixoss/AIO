import { config } from "../config/index.js";

const BASE_URL = config.databaseServiceUrl;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export async function dbGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  const json = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || "Database request failed");
  }
  return json.data as T;
}

export async function dbPost<T>(path: string, data: object): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || "Database request failed");
  }
  return json.data as T;
}

export async function dbPut<T>(path: string, data: object): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || "Database request failed");
  }
  return json.data as T;
}
