"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Wrench,
  Play,
  Code,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTools } from "@/hooks";

// Tool templates
const TOOL_TEMPLATES = [
  {
    id: "weather",
    name: "Thời tiết",
    icon: "🌤️",
    config: {
      name: "get_weather",
      description: "Lấy thông tin thời tiết theo địa điểm",
      http_method: "GET",
      endpoint_url: "https://api.openweathermap.org/data/2.5/weather",
      parameters: JSON.stringify(
        {
          q: { type: "string", description: "Tên thành phố", required: true },
          units: {
            type: "string",
            description: "Đơn vị (metric/imperial)",
            default: "metric",
          },
        },
        null,
        2
      ),
      query_params_template: JSON.stringify(
        { q: "{{q}}", units: "{{units}}", appid: "{{api_key}}" },
        null,
        2
      ),
    },
  },
  {
    id: "order",
    name: "Tra cứu đơn hàng",
    icon: "📦",
    config: {
      name: "check_order",
      description: "Kiểm tra trạng thái đơn hàng theo mã đơn",
      http_method: "GET",
      endpoint_url: "https://api.example.com/orders/{{order_id}}",
      parameters: JSON.stringify(
        {
          order_id: {
            type: "string",
            description: "Mã đơn hàng",
            required: true,
          },
        },
        null,
        2
      ),
    },
  },
  {
    id: "product",
    name: "Tìm sản phẩm",
    icon: "🛍️",
    config: {
      name: "search_products",
      description: "Tìm kiếm sản phẩm theo từ khóa",
      http_method: "GET",
      endpoint_url: "https://api.example.com/products/search",
      parameters: JSON.stringify(
        {
          keyword: {
            type: "string",
            description: "Từ khóa tìm kiếm",
            required: true,
          },
          category: { type: "string", description: "Danh mục sản phẩm" },
          limit: {
            type: "number",
            description: "Số lượng kết quả",
            default: 10,
          },
        },
        null,
        2
      ),
      query_params_template: JSON.stringify(
        { q: "{{keyword}}", cat: "{{category}}", limit: "{{limit}}" },
        null,
        2
      ),
    },
  },
  {
    id: "booking",
    name: "Đặt lịch hẹn",
    icon: "📅",
    config: {
      name: "book_appointment",
      description: "Đặt lịch hẹn với khách hàng",
      http_method: "POST",
      endpoint_url: "https://api.example.com/appointments",
      parameters: JSON.stringify(
        {
          customer_name: {
            type: "string",
            description: "Tên khách hàng",
            required: true,
          },
          phone: {
            type: "string",
            description: "Số điện thoại",
            required: true,
          },
          date: {
            type: "string",
            description: "Ngày hẹn (YYYY-MM-DD)",
            required: true,
          },
          time: {
            type: "string",
            description: "Giờ hẹn (HH:mm)",
            required: true,
          },
          service: { type: "string", description: "Dịch vụ" },
        },
        null,
        2
      ),
      body_template: JSON.stringify(
        {
          name: "{{customer_name}}",
          phone: "{{phone}}",
          datetime: "{{date}}T{{time}}:00",
          service: "{{service}}",
        },
        null,
        2
      ),
    },
  },
];

export default function ToolsPage() {
  const {
    tools,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    editingTool,
    formData,
    updateFormData,
    openDialog,
    closeDialog,
    handleSubmit,
    toggleActive,
    isSubmitting,
    handleDelete,
  } = useTools();

  const [showTemplates, setShowTemplates] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testTool, setTestTool] = useState<any>(null);
  const [testParams, setTestParams] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const applyTemplate = (templateId: string) => {
    const template = TOOL_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      updateFormData(template.config);
      setShowTemplates(false);
    }
  };

  const openCreateDialog = () => {
    setShowTemplates(true);
    openDialog();
  };

  const openTestDialog = (tool: any) => {
    setTestTool(tool);
    setTestParams({});
    setTestResult(null);
    setTestDialogOpen(true);
  };

  const runTest = async () => {
    if (!testTool) return;
    setTestLoading(true);
    setTestResult(null);

    try {
      // Build URL with params
      let url = testTool.endpoint_url;
      Object.entries(testParams).forEach(([key, value]) => {
        url = url.replace(`{{${key}}}`, encodeURIComponent(value));
      });

      // For demo, just show what would be called
      const result = {
        method: testTool.http_method,
        url,
        params: testParams,
        note: "Đây là preview. Trong thực tế, AI sẽ gọi API này khi cần.",
      };
      setTestResult(JSON.stringify(result, null, 2));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi test tool";
      setTestResult(`Error: ${errorMessage}`);
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

  const parseParameters = (
    params: string | object | null
  ): Record<string, any> => {
    if (!params) return {};
    if (typeof params === "string") {
      try {
        return JSON.parse(params);
      } catch {
        return {};
      }
    }
    return params;
  };

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Tools"
        description="Quản lý các công cụ API cho AI sử dụng trong chatbot"
        actions={
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm Tool
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Danh sách Tools
            </CardTitle>
            <CardDescription>
              Các công cụ API mà AI có thể gọi để lấy dữ liệu hoặc thực hiện
              hành động
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : tools.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">Chưa có tool nào</p>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo tool đầu tiên
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tools.map((tool) => (
                    <TableRow key={tool.id}>
                      <TableCell>
                        <code className="font-medium bg-muted px-1.5 py-0.5 rounded text-sm">
                          {tool.name}
                        </code>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="truncate text-sm text-muted-foreground">
                          {tool.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tool.http_method === "GET" ? "secondary" : "default"
                          }
                          className="font-mono"
                        >
                          {tool.http_method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-muted-foreground max-w-[200px] truncate block">
                          {tool.endpoint_url}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={tool.is_active}
                          onCheckedChange={() => toggleActive(tool)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openTestDialog(tool)}
                            title="Test tool"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setShowTemplates(false);
                              openDialog(tool);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(tool.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog tạo/sửa tool */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTool ? "Sửa Tool" : "Thêm Tool mới"}
            </DialogTitle>
            <DialogDescription>
              Cấu hình công cụ API cho AI sử dụng
            </DialogDescription>
          </DialogHeader>

          {/* Template Selection */}
          {!editingTool && showTemplates && (
            <div className="space-y-3">
              <Label>Chọn template hoặc tạo từ đầu</Label>
              <div className="grid grid-cols-2 gap-3">
                {TOOL_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template.id)}
                    className="p-3 border rounded-lg text-left hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{template.icon}</span>
                      <span className="font-medium text-sm">
                        {template.name}
                      </span>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => setShowTemplates(false)}
                  className="p-3 border rounded-lg text-left hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚙️</span>
                    <span className="font-medium text-sm">Tùy chỉnh</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Main Form */}
          {(!showTemplates || editingTool) && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Cơ bản</TabsTrigger>
                <TabsTrigger value="params">Parameters</TabsTrigger>
                <TabsTrigger value="advanced">Nâng cao</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tên tool *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => updateFormData({ name: e.target.value })}
                      placeholder="get_weather"
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tên dùng để AI gọi tool (snake_case)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>HTTP Method</Label>
                    <Select
                      value={formData.http_method}
                      onValueChange={(v) => updateFormData({ http_method: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mô tả *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      updateFormData({ description: e.target.value })
                    }
                    placeholder="Mô tả chi tiết để AI hiểu khi nào cần dùng tool này"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Endpoint URL *</Label>
                  <Input
                    value={formData.endpoint_url}
                    onChange={(e) =>
                      updateFormData({ endpoint_url: e.target.value })
                    }
                    placeholder="https://api.example.com/endpoint/{{param}}"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Dùng {"{{param}}"} để chèn tham số vào URL
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="params" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Parameters Schema (JSON)</Label>
                  <Textarea
                    value={formData.parameters || ""}
                    onChange={(e) =>
                      updateFormData({ parameters: e.target.value })
                    }
                    placeholder={`{
  "param_name": {
    "type": "string",
    "description": "Mô tả tham số",
    "required": true
  }
}`}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Định nghĩa các tham số mà AI cần truyền khi gọi tool
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Query Params Template (JSON)</Label>
                  <Textarea
                    value={formData.query_params_template || ""}
                    onChange={(e) =>
                      updateFormData({ query_params_template: e.target.value })
                    }
                    placeholder={`{"q": "{{keyword}}", "limit": "{{limit}}"}`}
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Headers Template (JSON)</Label>
                  <Textarea
                    value={formData.headers_template || ""}
                    onChange={(e) =>
                      updateFormData({ headers_template: e.target.value })
                    }
                    placeholder={`{"Authorization": "Bearer {{api_key}}", "Content-Type": "application/json"}`}
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Body Template (JSON) - cho POST/PUT</Label>
                  <Textarea
                    value={formData.body_template || ""}
                    onChange={(e) =>
                      updateFormData({ body_template: e.target.value })
                    }
                    placeholder={`{"name": "{{name}}", "email": "{{email}}"}`}
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Response Mapping (JSON)</Label>
                  <Textarea
                    value={formData.response_mapping || ""}
                    onChange={(e) =>
                      updateFormData({ response_mapping: e.target.value })
                    }
                    placeholder={`{"status": "$.data.status", "message": "$.data.message"}`}
                    rows={3}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Map response để AI hiểu kết quả (JSONPath syntax)
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            {showTemplates && !editingTool ? (
              <Button variant="outline" onClick={() => setShowTemplates(false)}>
                Tạo từ đầu
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={closeDialog}>
                  Hủy
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingTool ? "Cập nhật" : "Tạo mới"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog test tool */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Test Tool: {testTool?.name}
            </DialogTitle>
            <DialogDescription>
              Nhập các tham số để xem preview API call
            </DialogDescription>
          </DialogHeader>

          {testTool && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{testTool.description}</p>
                <code className="text-xs text-muted-foreground">
                  {testTool.http_method} {testTool.endpoint_url}
                </code>
              </div>

              {/* Parameters input */}
              <div className="space-y-3">
                <Label>Parameters</Label>
                {Object.entries(parseParameters(testTool.parameters)).map(
                  ([key, schema]: [string, any]) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs">
                        {key}{" "}
                        {schema.required && (
                          <span className="text-destructive">*</span>
                        )}
                      </Label>
                      <Input
                        value={testParams[key] || ""}
                        onChange={(e) =>
                          setTestParams((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        placeholder={schema.description || key}
                        className="text-sm"
                      />
                    </div>
                  )
                )}
              </div>

              <Button
                onClick={runTest}
                disabled={testLoading}
                className="w-full"
              >
                {testLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Preview API Call
              </Button>

              {testResult && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(testResult)}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <ScrollArea className="h-48 w-full rounded-md border bg-muted/30">
                    <pre className="p-3 text-xs">
                      <code>{testResult}</code>
                    </pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
