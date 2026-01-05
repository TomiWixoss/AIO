import { config } from "../config/index.js";

const BASE_URL = config.services.database;

export async function dbGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    const error = (await res
      .json()
      .catch(() => ({ error: res.statusText }))) as { error?: string };
    throw new Error(error.error || "Database request failed");
  }
  return res.json() as Promise<T>;
}

export async function dbPost<T>(path: string, data: object): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = (await res
      .json()
      .catch(() => ({ error: res.statusText }))) as { error?: string };
    throw new Error(error.error || "Database request failed");
  }
  return res.json() as Promise<T>;
}

export async function dbPut<T>(path: string, data: object): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = (await res
      .json()
      .catch(() => ({ error: res.statusText }))) as { error?: string };
    throw new Error(error.error || "Database request failed");
  }
  return res.json() as Promise<T>;
}

export async function dbDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { method: "DELETE" });
  if (!res.ok) {
    const error = (await res
      .json()
      .catch(() => ({ error: res.statusText }))) as { error?: string };
    throw new Error(error.error || "Database request failed");
  }
  return res.json() as Promise<T>;
}
