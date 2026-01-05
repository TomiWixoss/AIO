"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Wrench } from "lucide-react";
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
import { toolsApi, Tool } from "@/lib/api";

export default function ToolsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    endpoint_url: "",
    http_method: "GET",
    is_active: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["tools"],
    queryFn: () => toolsApi.getAll(),
  });

  const tools = data?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: Partial<Tool>) => toolsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      toast.success("Tạo tool thành công");
      closeDialog();
    },
    onError: () => toast.error("Lỗi tạo tool"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Tool> }) =>
      toolsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      toast.success("Cập nhật thành công");
      closeDialog();
    },
    onError: () => toast.error("Lỗi cập nhật"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => toolsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      toast.success("Xóa thành công");
    },
    onError: () => toast.error("Lỗi xóa"),
  });

  const openDialog = (tool?: Tool) => {
    if (tool) {
      setEditingTool(tool);
      setFormData({
        name: tool.name,
        description: tool.description,
        endpoint_url: tool.endpoint_url,
        http_method: tool.http_method,
        is_active: tool.is_active,
      });
    } else {
      setEditingTool(null);
      setFormData({
        name: "",
        description: "",
        endpoint_url: "",
        http_method: "GET",
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingTool(null);
  };

  const handleSubmit = () => {
    if (editingTool) {
      updateMutation.mutate({ id: editingTool.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleActive = (tool: Tool) => {
    updateMutation.mutate({
      id: tool.id,
      data: { is_active: !tool.is_active },
    });
  };

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Tools"
        description="Quản lý các công cụ API cho AI"
        actions={
          <Button onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-1" />
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
              Các công cụ API mà AI có thể sử dụng
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
              <p className="text-muted-foreground text-center py-8">
                Chưa có tool nào
              </p>
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
                      <TableCell className="font-medium">{tool.name}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {tool.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tool.http_method}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-xs truncate">
                        {tool.endpoint_url}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={tool.is_active}
                          onCheckedChange={() => toggleActive(tool)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDialog(tool)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Xác nhận xóa?"))
                              deleteMutation.mutate(tool.id);
                          }}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTool ? "Sửa Tool" : "Thêm Tool"}</DialogTitle>
            <DialogDescription>
              Cấu hình công cụ API cho AI sử dụng
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên tool</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="get_weather"
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Lấy thông tin thời tiết theo địa điểm"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>HTTP Method</Label>
                <Select
                  value={formData.http_method}
                  onValueChange={(v) =>
                    setFormData({ ...formData, http_method: v })
                  }
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
              <div className="col-span-2 space-y-2">
                <Label>Endpoint URL</Label>
                <Input
                  value={formData.endpoint_url}
                  onChange={(e) =>
                    setFormData({ ...formData, endpoint_url: e.target.value })
                  }
                  placeholder="https://api.example.com/weather"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingTool ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
