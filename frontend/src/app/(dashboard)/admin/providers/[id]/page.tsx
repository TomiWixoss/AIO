"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Bot,
  Key,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Settings2,
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProviderDetail } from "@/hooks/use-provider-detail";

const PROVIDER_NAMES: Record<string, string> = {
  "google-ai": "Google AI",
  groq: "Groq",
  cerebras: "Cerebras",
  openrouter: "OpenRouter",
};

export default function ProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const providerId = parseInt(id);
  const router = useRouter();

  const {
    provider,
    models,
    keys,
    isLoading,
    // Model
    isModelDialogOpen,
    setIsModelDialogOpen,
    editingModel,
    modelForm,
    setModelForm,
    openModelDialog,
    closeModelDialog,
    submitModel,
    toggleModelActive,
    updateModelPriority,
    deleteModel,
    isModelSubmitting,
    // Key
    isKeyDialogOpen,
    setIsKeyDialogOpen,
    keyForm,
    setKeyForm,
    openKeyDialog,
    closeKeyDialog,
    submitKey,
    toggleKeyActive,
    deleteKey,
    isKeySubmitting,
  } = useProviderDetail(providerId);

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen">
        <Header title="Loading..." />
        <div className="flex-1 p-6">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex flex-col h-screen">
        <Header title="Provider không tồn tại" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Provider này không tồn tại hoặc đã bị xóa
            </p>
            <Button onClick={() => router.push("/admin/providers")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const providerName =
    PROVIDER_NAMES[provider.provider_id] || provider.provider_id;

  return (
    <div className="flex flex-col h-screen">
      <Header
        title={providerName}
        description={`Quản lý API Keys và Models cho ${providerName}`}
        actions={
          <Button
            variant="outline"
            onClick={() => router.push("/admin/providers")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        {/* Provider Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Thông tin Provider
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Provider ID</p>
                <Badge variant="outline" className="mt-1">
                  {provider.provider_id}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trạng thái</p>
                <Badge
                  variant={provider.is_active ? "default" : "secondary"}
                  className="mt-1"
                >
                  {provider.is_active ? "Hoạt động" : "Tắt"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">API Keys</p>
                <p className="font-semibold mt-1">{keys.length} keys</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Models</p>
                <p className="font-semibold mt-1">{models.length} models</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for API Keys and Models */}
        <Tabs defaultValue="keys" className="space-y-4">
          <TabsList>
            <TabsTrigger value="keys" className="gap-2">
              <Key className="h-4 w-4" />
              API Keys ({keys.length})
            </TabsTrigger>
            <TabsTrigger value="models" className="gap-2">
              <Bot className="h-4 w-4" />
              Models ({models.length})
            </TabsTrigger>
          </TabsList>

          {/* API Keys Tab */}
          <TabsContent value="keys">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Quản lý API keys cho {providerName}
                  </CardDescription>
                </div>
                <Button onClick={openKeyDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm Key
                </Button>
              </CardHeader>
              <CardContent>
                {keys.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Chưa có API key nào</p>
                    <p className="text-sm">
                      Thêm API key để sử dụng provider này
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên</TableHead>
                        <TableHead>Ưu tiên</TableHead>
                        <TableHead>Sử dụng hôm nay</TableHead>
                        <TableHead>Giới hạn</TableHead>
                        <TableHead>Lỗi</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {keys.map((key) => (
                        <TableRow key={key.id}>
                          <TableCell className="font-medium">
                            {key.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{key.priority}</Badge>
                          </TableCell>
                          <TableCell>{key.requests_today || 0}</TableCell>
                          <TableCell>{key.daily_limit || "∞"}</TableCell>
                          <TableCell>
                            {key.last_error && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{key.last_error}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={key.is_active}
                              onCheckedChange={() => toggleKeyActive(key)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteKey(key.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Models</CardTitle>
                  <CardDescription>
                    Quản lý models cho {providerName}
                  </CardDescription>
                </div>
                <Button onClick={() => openModelDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm Model
                </Button>
              </CardHeader>
              <CardContent>
                {models.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Chưa có model nào</p>
                    <p className="text-sm">
                      Thêm model để sử dụng với provider này
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Model ID</TableHead>
                        <TableHead>Tên hiển thị</TableHead>
                        <TableHead className="text-center">Ưu tiên</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {models
                        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
                        .map((model) => (
                          <TableRow key={model.id}>
                            <TableCell>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {model.model_id}
                              </code>
                            </TableCell>
                            <TableCell className="font-medium">
                              {model.display_name}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    updateModelPriority(
                                      model,
                                      (model.priority || 0) + 10
                                    )
                                  }
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <span className="w-6 text-center font-mono text-xs">
                                  {model.priority || 0}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    updateModelPriority(
                                      model,
                                      Math.max(0, (model.priority || 0) - 10)
                                    )
                                  }
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={model.is_active}
                                onCheckedChange={() => toggleModelActive(model)}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openModelDialog(model)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => deleteModel(model.id)}
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Model Dialog */}
      <Dialog open={isModelDialogOpen} onOpenChange={setIsModelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingModel ? "Sửa Model" : "Thêm Model"}
            </DialogTitle>
            <DialogDescription>
              {editingModel
                ? "Cập nhật thông tin model"
                : `Thêm model mới cho ${providerName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Model ID</Label>
              <Input
                value={modelForm.model_id}
                onChange={(e) => setModelForm({ model_id: e.target.value })}
                placeholder="gemini-2.0-flash"
              />
            </div>
            <div className="space-y-2">
              <Label>Tên hiển thị</Label>
              <Input
                value={modelForm.display_name}
                onChange={(e) => setModelForm({ display_name: e.target.value })}
                placeholder="Gemini 2.0 Flash"
              />
            </div>
            <div className="space-y-2">
              <Label>Ưu tiên (Auto mode)</Label>
              <Input
                type="number"
                value={modelForm.priority}
                onChange={(e) =>
                  setModelForm({ priority: parseInt(e.target.value) || 0 })
                }
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Số cao hơn = ưu tiên cao hơn trong Auto mode
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModelDialog}>
              Hủy
            </Button>
            <Button onClick={submitModel} disabled={isModelSubmitting}>
              {isModelSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingModel ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add API Key Dialog */}
      <Dialog open={isKeyDialogOpen} onOpenChange={setIsKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm API Key</DialogTitle>
            <DialogDescription>
              Thêm API key mới cho {providerName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên</Label>
              <Input
                value={keyForm.name}
                onChange={(e) => setKeyForm({ name: e.target.value })}
                placeholder="Key chính"
              />
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={keyForm.credentials}
                onChange={(e) => setKeyForm({ credentials: e.target.value })}
                placeholder="sk-..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Độ ưu tiên</Label>
                <Input
                  type="number"
                  value={keyForm.priority}
                  onChange={(e) =>
                    setKeyForm({ priority: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Giới hạn/ngày (0 = ∞)</Label>
                <Input
                  type="number"
                  value={keyForm.daily_limit}
                  onChange={(e) =>
                    setKeyForm({ daily_limit: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeKeyDialog}>
              Hủy
            </Button>
            <Button onClick={submitKey} disabled={isKeySubmitting}>
              {isKeySubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Thêm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
