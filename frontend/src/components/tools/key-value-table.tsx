"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface KeyValueRow {
  id: string;
  key: string;
  value: string;
  description: string;
  enabled: boolean;
}

const genId = () => Math.random().toString(36).slice(2, 11);

export const emptyKV = (): KeyValueRow => ({
  id: genId(),
  key: "",
  value: "",
  description: "",
  enabled: true,
});

export const parseKV = (data: any): KeyValueRow[] => {
  if (!data) return [emptyKV()];
  try {
    const obj = typeof data === "string" ? JSON.parse(data) : data;
    const rows = Object.entries(obj).map(([key, value]) => ({
      id: genId(),
      key,
      value: String(value),
      description: "",
      enabled: true,
    }));
    return rows.length ? [...rows, emptyKV()] : [emptyKV()];
  } catch {
    return [emptyKV()];
  }
};

export const kvToJson = (
  rows: KeyValueRow[]
): Record<string, string> | null => {
  const obj: Record<string, string> = {};
  rows.filter((r) => r.key && r.enabled).forEach((r) => (obj[r.key] = r.value));
  return Object.keys(obj).length ? obj : null;
};

interface Props {
  rows: KeyValueRow[];
  onChange: (rows: KeyValueRow[]) => void;
  placeholders?: { key: string; value: string };
}

export function KeyValueTable({
  rows,
  onChange,
  placeholders = { key: "Key", value: "Value" },
}: Props) {
  const update = (id: string, field: keyof KeyValueRow, val: any) => {
    const newRows = rows.map((r) => (r.id === id ? { ...r, [field]: val } : r));
    if (newRows[newRows.length - 1]?.key) newRows.push(emptyKV());
    onChange(newRows);
  };

  const remove = (id: string) => {
    if (rows.length > 1) onChange(rows.filter((r) => r.id !== id));
  };

  return (
    <div className="border rounded-md">
      <div className="grid grid-cols-[40px_1fr_1fr_1fr_40px] bg-muted/50 text-xs font-medium text-muted-foreground border-b">
        <div className="p-2"></div>
        <div className="p-2 border-l">KEY</div>
        <div className="p-2 border-l">VALUE</div>
        <div className="p-2 border-l">DESCRIPTION</div>
        <div className="p-2 border-l"></div>
      </div>
      {rows.map((row, idx) => (
        <div
          key={row.id}
          className="grid grid-cols-[40px_1fr_1fr_1fr_40px] border-b last:border-b-0 group"
        >
          <div className="p-2 flex items-center justify-center">
            <input
              type="checkbox"
              checked={row.enabled}
              onChange={(e) => update(row.id, "enabled", e.target.checked)}
              className="h-4 w-4"
            />
          </div>
          <div className="border-l">
            <Input
              value={row.key}
              onChange={(e) => update(row.id, "key", e.target.value)}
              placeholder={idx === rows.length - 1 ? placeholders.key : ""}
              className="border-0 rounded-none h-9 text-sm focus-visible:ring-0"
            />
          </div>
          <div className="border-l">
            <Input
              value={row.value}
              onChange={(e) => update(row.id, "value", e.target.value)}
              placeholder={idx === rows.length - 1 ? placeholders.value : ""}
              className="border-0 rounded-none h-9 text-sm focus-visible:ring-0"
            />
          </div>
          <div className="border-l">
            <Input
              value={row.description}
              onChange={(e) => update(row.id, "description", e.target.value)}
              placeholder="Description"
              className="border-0 rounded-none h-9 text-sm focus-visible:ring-0"
            />
          </div>
          <div className="border-l flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={() => remove(row.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
