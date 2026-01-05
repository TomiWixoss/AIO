import { AppError } from "./errors.js";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export function createDbClient(baseUrl: string) {
  async function dbGet<T>(path: string): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`);
    const json = (await res.json()) as ApiResponse<T>;

    if (!res.ok || !json.success) {
      throw new AppError(
        res.status,
        json.error?.code || "DB_ERROR",
        json.error?.message || "Database request failed"
      );
    }
    return json.data as T;
  }

  async function dbPost<T>(path: string, data: object): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = (await res.json()) as ApiResponse<T>;

    if (!res.ok || !json.success) {
      throw new AppError(
        res.status,
        json.error?.code || "DB_ERROR",
        json.error?.message || "Database request failed"
      );
    }
    return json.data as T;
  }

  async function dbPut<T>(path: string, data: object): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = (await res.json()) as ApiResponse<T>;

    if (!res.ok || !json.success) {
      throw new AppError(
        res.status,
        json.error?.code || "DB_ERROR",
        json.error?.message || "Database request failed"
      );
    }
    return json.data as T;
  }

  async function dbDelete<T>(path: string): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, { method: "DELETE" });
    const json = (await res.json()) as ApiResponse<T>;

    if (!res.ok || !json.success) {
      throw new AppError(
        res.status,
        json.error?.code || "DB_ERROR",
        json.error?.message || "Database request failed"
      );
    }
    return json.data as T;
  }

  return { dbGet, dbPost, dbPut, dbDelete };
}

export type DbClient = ReturnType<typeof createDbClient>;
