"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Save, Loader2, Copy, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toolsApi } from "@/lib/api";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-600 hover:bg-green-700",
  POST: "bg-yellow-600 hover:bg-yellow-700",
  PUT: "bg-blue-600 hover:bg-blue-700",
  DELETE: "bg-red-600 hover:bg-red-700",
  PATCH: "bg-purple-600 hover:bg-purple-700",
};

// Types
interface KeyValueRow {
  id: string;
  key: string;
  value: string;
  description: string;
  enabled: boolean;
}

interface ParamRow {
  id: string;
  key: string;
  type: string;
  description: string;
  required: boolean;
}

// Helpers
const genId = () => Math.random().toString(36).slice(2, 11);
const emptyKV = (): KeyValueRow => ({
  id: genId(),
  key: "",
  value: "",
  description: "",
  enabled: true,
});
const emptyParam = (): ParamRow => ({
  id: genId(),
  key: "",
  type: "string",
  description: "",
  required: false,
});

const parseKV = (data: any): KeyValueRow[] => {
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

const kvToJson = (rows: KeyValueRow[]): Record<string, string> | null => {
  const obj: Record<string, string> = {};
  rows.filter((r) => r.key && r.enabled).forEach((r) => (obj[r.key] = r.value));
  return Object.keys(obj).length ? obj : null;
};

const parseParams = (data: any): ParamRow[] => {
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

const paramsToJson = (rows: ParamRow[]): Record<string, any> | null => {
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

// Key-Value Table Component
function KeyValueTable({
  rows,
  onChange,
  placeholders = { key: "Key", value: "Value" },
}: {
  rows: KeyValueRow[];
  onChange: (rows: KeyValueRow[]) => void;
  placeholders?: { key: string; value: string };
}) {
  const update = (id: string, field: keyof KeyValueRow, val: any) => {
    const newRows = rows.map((r) => (r.id === id ? { ...r, [field]: val } : r));
    if (newRows[newRows.length - 1]?.key) newRows.push(emptyKV());
    onChange(newRows);
  };
  const remove = (id: string) =>
    rows.length > 1 && onChange(rows.filter((r) => r.id !== id));

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

// Parameters Table
function ParamsTable({
  rows,
  onChange,
}: {
  rows: ParamRow[];
  onChange: (rows: ParamRow[]) => void;
}) {
  const update = (id: string, field: keyof ParamRow, val: any) => {
    const newRows = rows.map((r) => (r.id === id ? { ...r, [field]: val } : r));
    if (newRows[newRows.length - 1]?.key) newRows.push(emptyParam());
    onChange(newRows);
  };
  const remove = (id: string) =>
    rows.length > 1 && onChange(rows.filter((r) => r.id !== id));

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

// Main Page
export default function ToolEditorPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === "new";
  const toolId = isNew ? null : Number(params.id);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [aiParams, setAiParams] = useState<ParamRow[]>([emptyParam()]);
  const [queryParams, setQueryParams] = useState<KeyValueRow[]>([emptyKV()]);
  const [headers, setHeaders] = useState<KeyValueRow[]>([emptyKV()]);
  const [body, setBody] = useState("");
  const [responseMapping, setResponseMapping] = useState("");

  const [testParams, setTestParams] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (toolId) {
      toolsApi
        .getById(toolId)
        .then((res) => {
          const t = res.data.data;
          setName(t.name);
          setDescription(t.description);
          setMethod(t.http_method);
          setUrl(t.endpoint_url);
          setIsActive(t.is_active);
          setAiParams(parseParams(t.parameters));
          setQueryParams(parseKV(t.query_params_template));
          setHeaders(parseKV(t.headers_template));
          setBody(
            t.body_template ? JSON.stringify(t.body_template, null, 2) : ""
          );
          setResponseMapping(
            t.response_mapping
              ? JSON.stringify(t.response_mapping, null, 2)
              : ""
          );
          setLoading(false);
        })
        .catch(() => {
          toast.error("Không tìm thấy tool");
          router.push("/admin/tools");
        });
    }
  }, [toolId, router]);

  const handleSave = async () => {
    if (!name || !description || !url) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    setSaving(true);
    try {
      const data: any = {
        name,
        description,
        endpoint_url: url,
        http_method: method,
        is_active: isActive,
        parameters: paramsToJson(aiParams),
        query_params_template: kvToJson(queryParams),
        headers_template: kvToJson(headers),
        body_template: body ? JSON.parse(body) : null,
        response_mapping: responseMapping ? JSON.parse(responseMapping) : null,
      };
      if (toolId) {
        await toolsApi.update(toolId, data);
        toast.success("Đã lưu!");
      } else {
        const res = await toolsApi.create(data);
        toast.success("Đã tạo tool!");
        router.push(`/admin/tools/${res.data.data.id}`);
      }
    } catch (e: any) {
      toast.error(e.message || "Lỗi lưu tool");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!toolId) {
      toast.error("Lưu tool trước khi test");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await toolsApi.test(toolId, testParams);
      setTestResult(res.data.data);
    } catch (e: any) {
      setTestResult({ error: e.message });
    } finally {
      setTesting(false);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(JSON.stringify(testResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const testableParams = aiParams.filter((p) => p.key);

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <div className="h-14 border-b flex items-center px-4">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="h-14 border-b flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/tools")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tool name"
            className="w-48 font-mono"
          />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Active</span>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-4 space-y-4">
          {/* Description */}
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả chi tiết để AI hiểu khi nào cần dùng tool này..."
            className="resize-none"
            rows={2}
          />

          {/* URL Bar */}
          <div className="flex gap-2">
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger
                className={cn(
                  "w-[120px] font-bold text-white",
                  METHOD_COLORS[method]
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/endpoint/{{param}}"
              className="flex-1 font-mono"
            />
            <Button
              onClick={handleTest}
              disabled={testing || !toolId}
              className="px-6"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>

          {/* Request Tabs */}
          <Tabs defaultValue="params">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="params">
                Params{" "}
                {testableParams.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {testableParams.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="query">
                Query{" "}
                {queryParams.filter((p) => p.key).length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {queryParams.filter((p) => p.key).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="headers">
                Headers{" "}
                {headers.filter((h) => h.key).length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {headers.filter((h) => h.key).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="body">Body</TabsTrigger>
              <TabsTrigger value="mapping">Response Mapping</TabsTrigger>
            </TabsList>

            <TabsContent value="params" className="mt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Định nghĩa các tham số mà AI cần truyền khi gọi tool. Dùng{" "}
                {"{{param}}"} trong URL/Body.
              </p>
              <ParamsTable rows={aiParams} onChange={setAiParams} />
            </TabsContent>
            <TabsContent value="query" className="mt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Query parameters sẽ được thêm vào URL dạng ?key=value
              </p>
              <KeyValueTable
                rows={queryParams}
                onChange={setQueryParams}
                placeholders={{ key: "Parameter", value: "Value" }}
              />
            </TabsContent>
            <TabsContent value="headers" className="mt-4">
              <p className="text-sm text-muted-foreground mb-3">
                HTTP Headers cho request
              </p>
              <KeyValueTable
                rows={headers}
                onChange={setHeaders}
                placeholders={{ key: "Header", value: "Value" }}
              />
            </TabsContent>
            <TabsContent value="body" className="mt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Request body cho POST/PUT (JSON format)
              </p>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  '{\n  "name": "{{name}}",\n  "email": "{{email}}"\n}'
                }
                className="font-mono text-sm min-h-[200px]"
              />
            </TabsContent>
            <TabsContent value="mapping" className="mt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Map response để AI hiểu kết quả (JSONPath syntax)
              </p>
              <Textarea
                value={responseMapping}
                onChange={(e) => setResponseMapping(e.target.value)}
                placeholder={'{\n  "status": "$.data.status"\n}'}
                className="font-mono text-sm min-h-[150px]"
              />
            </TabsContent>
          </Tabs>

          {/* Response Section */}
          <div className="border rounded-lg">
            <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
              <div className="flex items-center gap-3">
                <span className="font-medium">Response</span>
                {testResult?.status && (
                  <Badge
                    variant="outline"
                    className={cn(
                      testResult.status >= 200 && testResult.status < 300
                        ? "bg-green-500/20 text-green-600"
                        : "bg-red-500/20 text-red-600"
                    )}
                  >
                    {testResult.status} {testResult.statusText}
                  </Badge>
                )}
                {testResult?.responseTime && (
                  <span className="text-xs text-muted-foreground">
                    {testResult.responseTime}ms
                  </span>
                )}
              </div>
              {testResult && (
                <Button variant="ghost" size="sm" onClick={copyResult}>
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            {/* Test Params */}
            {testableParams.length > 0 && !testResult && (
              <div className="p-4 border-b bg-muted/10">
                <p className="text-sm font-medium mb-3">Test Parameters</p>
                <div className="grid grid-cols-2 gap-3">
                  {testableParams.map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-28 truncate">
                        {p.key}
                        {p.required && <span className="text-red-500">*</span>}
                      </span>
                      <Input
                        value={testParams[p.key] || ""}
                        onChange={(e) =>
                          setTestParams((prev) => ({
                            ...prev,
                            [p.key]: e.target.value,
                          }))
                        }
                        placeholder={p.description || p.key}
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Response Body */}
            <div className="p-4 min-h-[200px]">
              {testing ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : testResult ? (
                testResult.error ? (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md">
                    <pre className="text-sm text-red-600 whitespace-pre-wrap">
                      {testResult.error}
                    </pre>
                  </div>
                ) : (
                  <Tabs defaultValue="body">
                    <TabsList className="h-8">
                      <TabsTrigger value="body" className="text-xs h-6">
                        Body
                      </TabsTrigger>
                      <TabsTrigger value="headers" className="text-xs h-6">
                        Headers
                      </TabsTrigger>
                      <TabsTrigger value="request" className="text-xs h-6">
                        Request
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="body" className="mt-2">
                      <pre className="p-3 bg-muted/50 rounded-md text-xs font-mono whitespace-pre-wrap max-h-[400px] overflow-auto">
                        {JSON.stringify(testResult.data, null, 2)}
                      </pre>
                    </TabsContent>
                    <TabsContent value="headers" className="mt-2">
                      <pre className="p-3 bg-muted/50 rounded-md text-xs font-mono whitespace-pre-wrap">
                        {JSON.stringify(testResult.headers, null, 2)}
                      </pre>
                    </TabsContent>
                    <TabsContent value="request" className="mt-2">
                      <pre className="p-3 bg-muted/50 rounded-md text-xs font-mono whitespace-pre-wrap">
                        {JSON.stringify(testResult.request, null, 2)}
                      </pre>
                    </TabsContent>
                  </Tabs>
                )
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Send className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Click Send để test API</p>
                  {!toolId && (
                    <p className="text-xs mt-1">Lưu tool trước khi test</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
