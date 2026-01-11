"use client";

import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Bot,
  ArrowUp,
  ArrowDown,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useModels } from "@/hooks";

export default function ModelsPage() {
  const {
    models,
    providers,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    editingModel,
    formData,
    updateFormData,
    openDialog,
    closeDialog,
    handleSubmit,
    toggleActive,
    updatePriority,
    getProviderName,
    isSubmitting,
    handleDelete,
  } = useModels();

  // Sort models by provider priority then model priority
  const sortedModels = [...models].sort((a, b) => {
    const provPriorityA = a.provider_priority || 0;
    const provPriorityB = b.provider_priority || 0;
    if (provPriorityB !== provPriorityA) return provPriorityB - provPriorityA;
    return (b.priority || 0) - (a.priority || 0);
  });

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Models"
        description="Quản lý các model AI - Sắp xếp theo ưu tiên cho chế độ Auto"
        actions={
          <Button onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm Model
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Danh sách Models
            </CardTitle>
            <CardDescription>
              Các model AI đã cấu hình. Ưu tiên cao hơn sẽ được chọn trước trong
              chế độ Auto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model ID</TableHead>
                    <TableHead>Tên hiển thị</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Context</TableHead>
                    <TableHead className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>Ưu tiên</TooltipTrigger>
                          <TooltipContent>
                            <p>Số cao hơn = ưu tiên cao hơn trong Auto mode</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedModels.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell className="font-mono text-sm">
                        {model.model_id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {model.display_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {model.provider_name ||
                            getProviderName(model.provider_id)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {model.context_length?.toLocaleString() || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              updatePriority(model, (model.priority || 0) + 10)
                            }
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-mono text-sm">
                            {model.priority || 0}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              updatePriority(
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
                          onCheckedChange={() => toggleActive(model)}
                        />
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDialog(model)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(model.id)}
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
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingModel ? "Sửa Model" : "Thêm Model"}
            </DialogTitle>
            <DialogDescription>Nhập thông tin model AI</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={formData.provider_id.toString()}
                onValueChange={(v) =>
                  updateFormData({ provider_id: parseInt(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.provider_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Model ID</Label>
              <Input
                value={formData.model_id}
                onChange={(e) => updateFormData({ model_id: e.target.value })}
                placeholder="gemini-2.0-flash"
              />
            </div>
            <div className="space-y-2">
              <Label>Tên hiển thị</Label>
              <Input
                value={formData.display_name}
                onChange={(e) =>
                  updateFormData({ display_name: e.target.value })
                }
                placeholder="Gemini 2.0 Flash"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Context Length</Label>
                <Input
                  type="number"
                  value={formData.context_length}
                  onChange={(e) =>
                    updateFormData({
                      context_length: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="128000"
                />
              </div>
              <div className="space-y-2">
                <Label>Ưu tiên (Auto mode)</Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    updateFormData({
                      priority: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingModel ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
