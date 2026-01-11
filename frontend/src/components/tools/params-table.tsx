"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ParamRow {
  id: string;
  key: string;
  type: string;
  description: string;
  required: boolean;
}

const genId = () => Math.random().toString(36).slice(2, 11);

export const emptyParam = (): ParamRow => ({
  id: genId(),
  key: "",
  type: "string",
  description: "",
  required: false,
});

export const parseParams = (data: any): ParamRow[] => {
  if (!data) return [emptyParam()];
  try {
    const obj = typeof data === "string" ? JSON.parse(data) : data;
    const rows = Object.entries(obj).map(([key, schema]: [string, any]) => ({
      id: genId(),
      key,
      type: schema.type || "string",
      description: schema.description || "",
      required: !!schema.required,
    }));
    return rows.length ? [...rows, emptyParam()] : [emptyParam()];
  } catch {
    return [emptyParam()];
  }
};

export const paramsToJson = (rows: ParamRow[]): Record<string, any> | null => {
  const obj: Record<string, any> = {};
  rows
    .filter((r) => r.key)
    .forEach((r) => {
      obj[r.key] = {
        type: r.type,
        description: r.description,
        required: r.required,
      };
    });
  return Object.keys(obj).length ? obj : null;
};

interface Props {
  rows: ParamRow[];
  onChange: (rows: ParamRow[]) => void;
}

export function ParamsTable({ rows, onChange }: Props) {
  const update = (id: string, field: keyof ParamRow, val: any) => {
    const newRows = rows.map((r) => (r.id === id ? { ...r, [field]: val } : r));
    if (newRows[newRows.length - 1]?.key) newRows.push(emptyParam());
    onChange(newRows);
  };

  const remove = (id: string) => {
    if (rows.length > 1) onChange(rows.filter((r) => r.id !== id));
  };

  return (
    <div className="border rounded-md">
      <div className="grid grid-cols-[1fr_100px_1fr_80px_40px] bg-muted/50 text-xs font-medium text-muted-foreground border-b">
        <div className="p-2">PARAMETER NAME</div>
        <div className="p-2 border-l">TYPE</div>
        <div className="p-2 border-l">DESCRIPTION</div>
        <div className="p-2 border-l text-center">REQUIRED</div>
        <div className="p-2 border-l"></div>
      </div>
      {rows.map((row, idx) => (
        <div
          key={row.id}
          className="grid grid-cols-[1fr_100px_1fr_80px_40px] border-b last:border-b-0 group"
        >
          <div>
            <Input
              value={row.key}
              onChange={(e) => update(row.id, "key", e.target.value)}
              placeholder={idx === rows.length - 1 ? "param_name" : ""}
              className="border-0 rounded-none h-9 text-sm font-mono focus-visible:ring-0"
            />
          </div>
          <div className="border-l">
            <Select
              value={row.type}
              onValueChange={(v) => update(row.id, "type", v)}
            >
              <SelectTrigger className="border-0 rounded-none h-9 text-sm focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">string</SelectItem>
                <SelectItem value="number">number</SelectItem>
                <SelectItem value="boolean">boolean</SelectItem>
                <SelectItem value="array">array</SelectItem>
                <SelectItem value="object">object</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="border-l">
            <Input
              value={row.description}
              onChange={(e) => update(row.id, "description", e.target.value)}
              placeholder="Mô tả"
              className="border-0 rounded-none h-9 text-sm focus-visible:ring-0"
            />
          </div>
          <div className="border-l flex items-center justify-center">
            <input
              type="checkbox"
              checked={row.required}
              onChange={(e) => update(row.id, "required", e.target.checked)}
              className="h-4 w-4"
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
