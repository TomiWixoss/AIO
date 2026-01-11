"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
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
import {
  KeyValueTable,
  KeyValueRow,
  emptyKV,
  parseKV,
  kvToJson,
  ParamsTable,
  ParamRow,
  emptyParam,
  parseParams,
  paramsToJson,
  ResponseViewer,
} from "@/components/tools";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-600 hover:bg-green-700",
  POST: "bg-yellow-600 hover:bg-yellow-700",
  PUT: "bg-blue-600 hover:bg-blue-700",
  DELETE: "bg-red-600 hover:bg-red-700",
  PATCH: "bg-purple-600 hover:bg-purple-700",
};

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

  const [testParams, setTestParams] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  // Load tool
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
    if (!toolId) return;
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
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả chi tiết để AI hiểu khi nào cần dùng tool này..."
              rows={2}
            />
          </div>

          {/* URL Bar */}
          <div>
            <label className="text-sm font-medium mb-2 block">Endpoint</label>
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
                  {["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/endpoint/{{param}}"
                className="flex-1 font-mono"
              />
            </div>
          </div>

          {/* Request Config Tabs */}
          <Tabs defaultValue="params">
            <TabsList>
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
            </TabsList>

            <TabsContent value="params" className="mt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Định nghĩa các tham số mà AI cần truyền. Dùng {"{{param}}"}{" "}
                trong URL/Body.
              </p>
              <ParamsTable rows={aiParams} onChange={setAiParams} />
            </TabsContent>
            <TabsContent value="query" className="mt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Query parameters (?key=value)
              </p>
              <KeyValueTable rows={queryParams} onChange={setQueryParams} />
            </TabsContent>
            <TabsContent value="headers" className="mt-4">
              <p className="text-sm text-muted-foreground mb-3">HTTP Headers</p>
              <KeyValueTable rows={headers} onChange={setHeaders} />
            </TabsContent>
            <TabsContent value="body" className="mt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Request body (JSON)
              </p>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={'{\n  "name": "{{name}}"\n}'}
                className="font-mono text-sm min-h-[200px]"
              />
            </TabsContent>
          </Tabs>

          {/* Response */}
          <ResponseViewer
            testableParams={testableParams}
            testParams={testParams}
            setTestParams={setTestParams}
            testResult={testResult}
            testing={testing}
            onTest={handleTest}
            canTest={!!toolId}
          />
        </div>
      </div>
    </div>
  );
}
