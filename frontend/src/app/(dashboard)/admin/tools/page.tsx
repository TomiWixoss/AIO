"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  Wrench,
  Send,
  Save,
  Copy,
  Check,
  X,
  FolderOpen,
  MoreVertical,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { useTools, type ToolFormData } from "@/hooks/use-tools";
import type { Tool } from "@/lib/api";

// Types
interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

interface ParameterDef {
  id: string;
  key: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: string;
}

// HTTP Method colors
const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-500/20 text-green-600 border-green-500/30",
  POST: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  PUT: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  DELETE: "bg-red-500/20 text-red-600 border-red-500/30",
};

// Helper functions
const generateId = () => Math.random().toString(36).substr(2, 9);

const parseKeyValuePairs = (json: string | object | null): KeyValuePair[] => {
  if (!json) return [{ id: generateId(), key: "", value: "", enabled: true }];
  try {
    const obj = typeof json === "string" ? JSON.parse(json) : json;
    const pairs = Object.entries(obj).map(([key, value]) => ({
      id: generateId(),
      key,
      value: String(value),
      enabled: true,
    }));
    return pairs.length > 0
      ? [...pairs, { id: generateId(), key: "", value: "", enabled: true }]
      : [{ id: generateId(), key: "", value: "", enabled: true }];
  } catch {
    return [{ id: generateId(), key: "", value: "", enabled: true }];
  }
};

const keyValuePairsToJson = (pairs: KeyValuePair[]): string => {
  const obj: Record<string, string> = {};
  pairs.forEach((p) => {
    if (p.key && p.enabled) obj[p.key] = p.value;
  });
  return Object.keys(obj).length > 0 ? JSON.stringify(obj, null, 2) : "";
};

const parseParameters = (json: string | object | null): ParameterDef[] => {
  if (!json)
    return [
      {
        id: generateId(),
        key: "",
        type: "string",
        description: "",
        required: false,
      },
    ];
  try {
    const obj = typeof json === "string" ? JSON.parse(json) : json;
    const params = Object.entries(obj).map(([key, schema]: [string, any]) => ({
      id: generateId(),
      key,
      type: schema.type || "string",
      description: schema.description || "",
      required: schema.required || false,
      defaultValue: schema.default,
    }));
    return params.length > 0
      ? [
          ...params,
          {
            id: generateId(),
            key: "",
            type: "string",
            description: "",
            required: false,
          },
        ]
      : [
          {
            id: generateId(),
            key: "",
            type: "string",
            description: "",
            required: false,
          },
        ];
  } catch {
    return [
      {
        id: generateId(),
        key: "",
        type: "string",
        description: "",
        required: false,
      },
    ];
  }
};

const parametersToJson = (params: ParameterDef[]): string => {
  const obj: Record<string, any> = {};
  params.forEach((p) => {
    if (p.key) {
      obj[p.key] = {
        type: p.type,
        description: p.description,
        required: p.required,
        ...(p.defaultValue && { default: p.defaultValue }),
      };
    }
  });
  return Object.keys(obj).length > 0 ? JSON.stringify(obj, null, 2) : "";
};

// Key-Value Editor Component
function KeyValueEditor({
  pairs,
  onChange,
  placeholder = { key: "Key", value: "Value" },
  showDescription = false,
}: {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  placeholder?: { key: string; value: string };
  showDescription?: boolean;
}) {
  const updatePair = (id: string, field: keyof KeyValuePair, value: any) => {
    const newPairs = pairs.map((p) =>
      p.id === id ? { ...p, [field]: value } : p
    );
    // Auto add new row if last row has content
    const lastPair = newPairs[newPairs.length - 1];
    if (lastPair && lastPair.key) {
      newPairs.push({ id: generateId(), key: "", value: "", enabled: true });
    }
    onChange(newPairs);
  };

  const removePair = (id: string) => {
    if (pairs.length <= 1) return;
    onChange(pairs.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-1">
      {/* Header */}
      <div
        className="grid gap-2 text-xs text-muted-foreground font-medium px-1"
        style={{
          gridTemplateColumns: showDescription
            ? "24px 1fr 1fr 1fr 24px"
            : "24px 1fr 1fr 24px",
        }}
      >
        <div></div>
        <div>{placeholder.key}</div>
        <div>{placeholder.value}</div>
        {showDescription && <div>Description</div>}
        <div></div>
      </div>
      {/* Rows */}
      {pairs.map((pair, idx) => (
        <div
          key={pair.id}
          className="group grid gap-2 items-center"
          style={{
            gridTemplateColumns: showDescription
              ? "24px 1fr 1fr 1fr 24px"
              : "24px 1fr 1fr 24px",
          }}
        >
          <input
            type="checkbox"
            checked={pair.enabled}
            onChange={(e) => updatePair(pair.id, "enabled", e.target.checked)}
            className="h-4 w-4 rounded border-muted-foreground/30"
          />
          <Input
            value={pair.key}
            onChange={(e) => updatePair(pair.id, "key", e.target.value)}
            placeholder={idx === pairs.length - 1 ? placeholder.key : ""}
            className="h-8 text-sm font-mono"
          />
          <Input
            value={pair.value}
            onChange={(e) => updatePair(pair.id, "value", e.target.value)}
            placeholder={idx === pairs.length - 1 ? placeholder.value : ""}
            className="h-8 text-sm font-mono"
          />
          {showDescription && (
            <Input
              value={pair.description || ""}
              onChange={(e) =>
                updatePair(pair.id, "description", e.target.value)
              }
              placeholder="Description"
              className="h-8 text-sm"
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100"
            onClick={() => removePair(pair.id)}
            disabled={pairs.length <= 1}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}

// Parameters Editor Component (for AI tool parameters)
function ParametersEditor({
  params,
  onChange,
}: {
  params: ParameterDef[];
  onChange: (params: ParameterDef[]) => void;
}) {
  const updateParam = (id: string, field: keyof ParameterDef, value: any) => {
    const newParams = params.map((p) =>
      p.id === id ? { ...p, [field]: value } : p
    );
    const lastParam = newParams[newParams.length - 1];
    if (lastParam && lastParam.key) {
      newParams.push({
        id: generateId(),
        key: "",
        type: "string",
        description: "",
        required: false,
      });
    }
    onChange(newParams);
  };

  const removeParam = (id: string) => {
    if (params.length <= 1) return;
    onChange(params.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-1">
      <div
        className="grid gap-2 text-xs text-muted-foreground font-medium px-1"
        style={{ gridTemplateColumns: "1fr 100px 1fr 60px 24px" }}
      >
        <div>Parameter Name</div>
        <div>Type</div>
        <div>Description</div>
        <div>Required</div>
        <div></div>
      </div>
      {params.map((param, idx) => (
        <div
          key={param.id}
          className="group grid gap-2 items-center"
          style={{ gridTemplateColumns: "1fr 100px 1fr 60px 24px" }}
        >
          <Input
            value={param.key}
            onChange={(e) => updateParam(param.id, "key", e.target.value)}
            placeholder={idx === params.length - 1 ? "param_name" : ""}
            className="h-8 text-sm font-mono"
          />
          <Select
            value={param.type}
            onValueChange={(v) => updateParam(param.id, "type", v)}
          >
            <SelectTrigger className="h-8 text-sm">
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
          <Input
            value={param.description}
            onChange={(e) =>
              updateParam(param.id, "description", e.target.value)
            }
            placeholder="Mô tả tham số"
            className="h-8 text-sm"
          />
          <div className="flex justify-center">
            <input
              type="checkbox"
              checked={param.required}
              onChange={(e) =>
                updateParam(param.id, "required", e.target.checked)
              }
              className="h-4 w-4 rounded"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100"
            onClick={() => removeParam(param.id)}
            disabled={params.length <= 1}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}

// Tool Sidebar Item
function ToolSidebarItem({
  tool,
  isSelected,
  onClick,
  onDelete,
}: {
  tool: Tool;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 px-3 py-2 cursor-pointer rounded-md transition-colors",
        isSelected ? "bg-accent" : "hover:bg-accent/50"
      )}
      onClick={onClick}
    >
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] font-bold px-1.5 py-0",
          METHOD_COLORS[tool.http_method]
        )}
      >
        {tool.http_method}
      </Badge>
      <span className="flex-1 text-sm truncate font-mono">{tool.name}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Xóa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Main Page Component
export default function ToolsPage() {
  const {
    tools,
    isLoading,
    formData,
    updateFormData,
    handleSubmit,
    isSubmitting,
    handleDelete,
    editingTool,
    openDialog,
    closeDialog,
  } = useTools();

  // Local state
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [activeTab, setActiveTab] = useState("params");
  const [queryParams, setQueryParams] = useState<KeyValuePair[]>([]);
  const [headers, setHeaders] = useState<KeyValuePair[]>([]);
  const [parameters, setParameters] = useState<ParameterDef[]>([]);
  const [bodyContent, setBodyContent] = useState("");
  const [responseMapping, setResponseMapping] = useState("");

  // Test state
  const [testParams, setTestParams] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync form data when tool selected
  useEffect(() => {
    if (selectedTool) {
      openDialog(selectedTool);
      setQueryParams(
        parseKeyValuePairs((selectedTool as any).query_params_template)
      );
      setHeaders(parseKeyValuePairs((selectedTool as any).headers_template));
      setParameters(parseParameters((selectedTool as any).parameters));
      setBodyContent(
        typeof (selectedTool as any).body_template === "object"
          ? JSON.stringify((selectedTool as any).body_template, null, 2)
          : (selectedTool as any).body_template || ""
      );
      setResponseMapping(
        typeof (selectedTool as any).response_mapping === "object"
          ? JSON.stringify((selectedTool as any).response_mapping, null, 2)
          : (selectedTool as any).response_mapping || ""
      );
      setTestParams({});
      setTestResult(null);
    }
  }, [selectedTool]);

  // Create new tool
  const handleNewTool = () => {
    setSelectedTool(null);
    openDialog();
    setQueryParams([{ id: generateId(), key: "", value: "", enabled: true }]);
    setHeaders([{ id: generateId(), key: "", value: "", enabled: true }]);
    setParameters([
      {
        id: generateId(),
        key: "",
        type: "string",
        description: "",
        required: false,
      },
    ]);
    setBodyContent("");
    setResponseMapping("");
    setTestParams({});
    setTestResult(null);
  };

  // Save tool
  const handleSave = () => {
    updateFormData({
      query_params_template: keyValuePairsToJson(queryParams),
      headers_template: keyValuePairsToJson(headers),
      parameters: parametersToJson(parameters),
      body_template: bodyContent,
      response_mapping: responseMapping,
    });
    // Need to call handleSubmit after state update
    setTimeout(() => handleSubmit(), 0);
  };

  // Test tool
  const handleTest = async () => {
    setTestLoading(true);
    setTestResult(null);

    try {
      // If tool is saved, use backend API to test
      if (editingTool?.id) {
        const { toolsApi } = await import("@/lib/api");
        const response = await toolsApi.test(editingTool.id, testParams);
        const result = response.data.data;

        setTestResult({
          type: result.success ? "success" : "error",
          status: result.status,
          statusText: result.statusText,
          data: result.data,
          headers: result.headers,
          responseTime: result.responseTime,
          request: result.request,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Preview mode for unsaved tools
        let url = formData.endpoint_url;

        // Replace path params
        Object.entries(testParams).forEach(([key, value]) => {
          url = url.replace(`{{${key}}}`, encodeURIComponent(value));
        });

        // Build query string from query params
        const enabledQueryParams = queryParams.filter(
          (p) => p.key && p.enabled
        );
        if (enabledQueryParams.length > 0) {
          const queryString = enabledQueryParams
            .map((p) => {
              let val = p.value;
              Object.entries(testParams).forEach(([k, v]) => {
                val = val.replace(`{{${k}}}`, v);
              });
              return `${encodeURIComponent(p.key)}=${encodeURIComponent(val)}`;
            })
            .join("&");
          url += (url.includes("?") ? "&" : "?") + queryString;
        }

        // Build headers
        const reqHeaders: Record<string, string> = {};
        headers
          .filter((h) => h.key && h.enabled)
          .forEach((h) => {
            let val = h.value;
            Object.entries(testParams).forEach(([k, v]) => {
              val = val.replace(`{{${k}}}`, v);
            });
            reqHeaders[h.key] = val;
          });

        // Build body
        let reqBody = bodyContent;
        if (reqBody) {
          Object.entries(testParams).forEach(([k, v]) => {
            reqBody = reqBody.replace(new RegExp(`{{${k}}}`, "g"), v);
          });
        }

        // Show preview
        const preview = {
          method: formData.http_method,
          url,
          headers: reqHeaders,
          body: reqBody ? JSON.parse(reqBody) : undefined,
          note: "⚠️ Preview mode - Lưu tool trước để test thực sự",
        };

        setTestResult({
          type: "preview",
          data: preview,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      setTestResult({
        type: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setTestLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Đã copy!");
  };

  // Get parameters for test input
  const getTestableParams = (): ParameterDef[] => {
    return parameters.filter((p) => p.key);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen">
        <Header title="Tools" description="Quản lý các công cụ API cho AI" />
        <div className="flex-1 p-6">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Tools"
        description="Quản lý các công cụ API cho AI sử dụng - Giao diện giống Postman"
      />

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup orientation="horizontal">
          {/* Sidebar - Tool List */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full flex flex-col border-r">
              <div className="p-3 border-b">
                <Button onClick={handleNewTool} className="w-full" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Tool
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {tools.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Chưa có tool nào</p>
                    </div>
                  ) : (
                    tools.map((tool) => (
                      <ToolSidebarItem
                        key={tool.id}
                        tool={tool}
                        isSelected={selectedTool?.id === tool.id}
                        onClick={() => setSelectedTool(tool)}
                        onDelete={() => {
                          if (confirm("Xác nhận xóa tool này?")) {
                            handleDelete(tool.id);
                            if (selectedTool?.id === tool.id) {
                              setSelectedTool(null);
                            }
                          }
                        }}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Main Content - Request Builder */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col">
              {editingTool !== undefined || formData.name ? (
                <>
                  {/* Tool Name & Description */}
                  <div className="p-4 border-b space-y-3">
                    <div className="flex gap-3">
                      <Input
                        value={formData.name}
                        onChange={(e) =>
                          updateFormData({ name: e.target.value })
                        }
                        placeholder="tool_name"
                        className="font-mono text-sm flex-1"
                      />
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Active</Label>
                        <Switch
                          checked={formData.is_active}
                          onCheckedChange={(v) =>
                            updateFormData({ is_active: v })
                          }
                        />
                      </div>
                    </div>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        updateFormData({ description: e.target.value })
                      }
                      placeholder="Mô tả chi tiết để AI hiểu khi nào cần dùng tool này..."
                      rows={2}
                      className="text-sm resize-none"
                    />
                  </div>

                  {/* URL Bar */}
                  <div className="p-4 border-b">
                    <div className="flex gap-2">
                      <Select
                        value={formData.http_method}
                        onValueChange={(v) =>
                          updateFormData({ http_method: v })
                        }
                      >
                        <SelectTrigger
                          className={cn(
                            "w-[100px] font-bold",
                            METHOD_COLORS[formData.http_method]
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={formData.endpoint_url}
                        onChange={(e) =>
                          updateFormData({ endpoint_url: e.target.value })
                        }
                        placeholder="https://api.example.com/endpoint/{{param}}"
                        className="flex-1 font-mono text-sm"
                      />
                      <Button onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        <span className="ml-2">Save</span>
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Dùng {"{{param}}"} để chèn tham số động vào URL
                    </p>
                  </div>

                  {/* Tabs */}
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="flex-1 flex flex-col"
                  >
                    <div className="border-b px-4">
                      <TabsList className="h-10 bg-transparent p-0 gap-4">
                        <TabsTrigger
                          value="params"
                          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
                        >
                          AI Parameters
                          {parameters.filter((p) => p.key).length > 0 && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {parameters.filter((p) => p.key).length}
                            </Badge>
                          )}
                        </TabsTrigger>
                        <TabsTrigger
                          value="query"
                          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
                        >
                          Query Params
                          {queryParams.filter((p) => p.key).length > 0 && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {queryParams.filter((p) => p.key).length}
                            </Badge>
                          )}
                        </TabsTrigger>
                        <TabsTrigger
                          value="headers"
                          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
                        >
                          Headers
                          {headers.filter((h) => h.key).length > 0 && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {headers.filter((h) => h.key).length}
                            </Badge>
                          )}
                        </TabsTrigger>
                        <TabsTrigger
                          value="body"
                          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
                        >
                          Body
                        </TabsTrigger>
                        <TabsTrigger
                          value="response"
                          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
                        >
                          Response Mapping
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <ScrollArea className="flex-1">
                      <div className="p-4">
                        <TabsContent value="params" className="m-0">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">AI Parameters</h4>
                                <p className="text-xs text-muted-foreground">
                                  Định nghĩa các tham số mà AI cần truyền khi
                                  gọi tool
                                </p>
                              </div>
                            </div>
                            <ParametersEditor
                              params={parameters}
                              onChange={setParameters}
                            />
                          </div>
                        </TabsContent>

                        <TabsContent value="query" className="m-0">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium">Query Parameters</h4>
                              <p className="text-xs text-muted-foreground">
                                Các tham số sẽ được thêm vào URL dạng ?key=value
                              </p>
                            </div>
                            <KeyValueEditor
                              pairs={queryParams}
                              onChange={setQueryParams}
                              placeholder={{
                                key: "Parameter",
                                value: "Value (dùng {{param}})",
                              }}
                            />
                          </div>
                        </TabsContent>

                        <TabsContent value="headers" className="m-0">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium">Headers</h4>
                              <p className="text-xs text-muted-foreground">
                                HTTP headers cho request
                              </p>
                            </div>
                            <KeyValueEditor
                              pairs={headers}
                              onChange={setHeaders}
                              placeholder={{ key: "Header", value: "Value" }}
                            />
                          </div>
                        </TabsContent>

                        <TabsContent value="body" className="m-0">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium">Request Body</h4>
                              <p className="text-xs text-muted-foreground">
                                Body template cho POST/PUT request (JSON)
                              </p>
                            </div>
                            <Textarea
                              value={bodyContent}
                              onChange={(e) => setBodyContent(e.target.value)}
                              placeholder={`{
  "name": "{{name}}",
  "email": "{{email}}"
}`}
                              rows={12}
                              className="font-mono text-sm"
                            />
                          </div>
                        </TabsContent>

                        <TabsContent value="response" className="m-0">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium">Response Mapping</h4>
                              <p className="text-xs text-muted-foreground">
                                Map response để AI hiểu kết quả (JSONPath
                                syntax)
                              </p>
                            </div>
                            <Textarea
                              value={responseMapping}
                              onChange={(e) =>
                                setResponseMapping(e.target.value)
                              }
                              placeholder={`{
  "status": "$.data.status",
  "message": "$.data.message"
}`}
                              rows={8}
                              className="font-mono text-sm"
                            />
                          </div>
                        </TabsContent>
                      </div>
                    </ScrollArea>
                  </Tabs>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Chọn một tool hoặc tạo mới</p>
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Response Panel - Test */}
          <ResizablePanel defaultSize={30} minSize={20}>
            <div className="h-full flex flex-col border-l">
              <div className="p-3 border-b flex items-center justify-between">
                <h3 className="font-medium text-sm">Test Tool</h3>
                <Button
                  size="sm"
                  onClick={handleTest}
                  disabled={testLoading || !formData.endpoint_url}
                >
                  {testLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {/* Test Parameters Input */}
                  {getTestableParams().length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Test Parameters
                      </Label>
                      {getTestableParams().map((param) => (
                        <div key={param.id} className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            {param.key}
                            {param.required && (
                              <span className="text-destructive ml-1">*</span>
                            )}
                            <span className="ml-2 text-muted-foreground/60">
                              ({param.type})
                            </span>
                          </Label>
                          <Input
                            value={testParams[param.key] || ""}
                            onChange={(e) =>
                              setTestParams((prev) => ({
                                ...prev,
                                [param.key]: e.target.value,
                              }))
                            }
                            placeholder={param.description || param.key}
                            className="h-8 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Response */}
                  {testResult && (
                    <div className="space-y-3">
                      {/* Status Bar */}
                      <div className="flex items-center gap-3 text-sm">
                        {testResult.status && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-mono",
                              testResult.status >= 200 &&
                                testResult.status < 300
                                ? "bg-green-500/20 text-green-600 border-green-500/30"
                                : testResult.status >= 400
                                ? "bg-red-500/20 text-red-600 border-red-500/30"
                                : "bg-yellow-500/20 text-yellow-600 border-yellow-500/30"
                            )}
                          >
                            {testResult.status} {testResult.statusText}
                          </Badge>
                        )}
                        {testResult.responseTime && (
                          <span className="text-muted-foreground">
                            {testResult.responseTime}ms
                          </span>
                        )}
                        {testResult.type === "preview" && (
                          <Badge
                            variant="outline"
                            className="bg-blue-500/20 text-blue-600 border-blue-500/30"
                          >
                            Preview
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-6"
                          onClick={() =>
                            copyToClipboard(
                              JSON.stringify(
                                testResult.data || testResult.request,
                                null,
                                2
                              )
                            )
                          }
                        >
                          {copied ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>

                      {/* Response Tabs */}
                      <Tabs defaultValue="body" className="w-full">
                        <TabsList className="h-8 w-full justify-start bg-muted/50">
                          <TabsTrigger value="body" className="text-xs h-6">
                            Body
                          </TabsTrigger>
                          {testResult.headers && (
                            <TabsTrigger
                              value="headers"
                              className="text-xs h-6"
                            >
                              Headers
                            </TabsTrigger>
                          )}
                          {testResult.request && (
                            <TabsTrigger
                              value="request"
                              className="text-xs h-6"
                            >
                              Request
                            </TabsTrigger>
                          )}
                        </TabsList>
                        <TabsContent value="body" className="mt-2">
                          <div
                            className={cn(
                              "rounded-md border p-3 max-h-[300px] overflow-auto",
                              testResult.type === "error"
                                ? "bg-destructive/10 border-destructive/30"
                                : testResult.type === "success"
                                ? "bg-green-500/5 border-green-500/20"
                                : "bg-muted/30"
                            )}
                          >
                            <pre className="text-xs font-mono whitespace-pre-wrap">
                              {testResult.error
                                ? testResult.error
                                : JSON.stringify(testResult.data, null, 2)}
                            </pre>
                          </div>
                        </TabsContent>
                        {testResult.headers && (
                          <TabsContent value="headers" className="mt-2">
                            <div className="rounded-md border p-3 bg-muted/30 max-h-[300px] overflow-auto">
                              <pre className="text-xs font-mono whitespace-pre-wrap">
                                {JSON.stringify(testResult.headers, null, 2)}
                              </pre>
                            </div>
                          </TabsContent>
                        )}
                        {testResult.request && (
                          <TabsContent value="request" className="mt-2">
                            <div className="rounded-md border p-3 bg-muted/30 max-h-[300px] overflow-auto">
                              <pre className="text-xs font-mono whitespace-pre-wrap">
                                {JSON.stringify(testResult.request, null, 2)}
                              </pre>
                            </div>
                          </TabsContent>
                        )}
                      </Tabs>

                      <p className="text-xs text-muted-foreground">
                        {new Date(testResult.timestamp).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {!testResult && getTestableParams().length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <Play className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Thêm parameters và click Send để test</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
