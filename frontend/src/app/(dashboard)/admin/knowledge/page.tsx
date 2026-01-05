"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  BookOpen,
  FileText,
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
import { Skeleton } from "@/components/ui/skeleton";
import { knowledgeApi, KnowledgeBase } from "@/lib/api";

export default function KnowledgePage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKb, setEditingKb] = useState<KnowledgeBase | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["knowledge-bases"],
    queryFn: () => knowledgeApi.getAll(),
  });

  const kbs = data?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: Partial<KnowledgeBase>) => knowledgeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-bases"] });
      toast.success("Tạo knowledge base thành công");
      closeDialog();
    },
    onError: () => toast.error("Lỗi tạo knowledge base"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<KnowledgeBase> }) =>
      knowledgeApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-bases"] });
      toast.success("Cập nhật thành công");
      closeDialog();
    },
    onError: () => toast.error("Lỗi cập nhật"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => knowledgeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-bases"] });
      toast.success("Xóa thành công");
    },
    onError: () => toast.error("Lỗi xóa"),
  });

  const openDialog = (kb?: KnowledgeBase) => {
    if (kb) {
      setEditingKb(kb);
      setFormData({
        name: kb.name,
        description: kb.description,
        is_active: kb.is_active,
      });
    } else {
      setEditingKb(null);
      setFormData({ name: "", description: "", is_active: true });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingKb(null);
  };

  const handleSubmit = () => {
    if (editingKb) {
      updateMutation.mutate({ id: editingKb.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleActive = (kb: KnowledgeBase) => {
    updateMutation.mutate({ id: kb.id, data: { is_active: !kb.is_active } });
  };

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Knowledge Base"
        description="Quản lý cơ sở tri thức cho AI"
        actions={
          <Button onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-1" />
            Thêm Knowledge Base
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Danh sách Knowledge Bases
            </CardTitle>
            <CardDescription>
              Các cơ sở tri thức để AI tìm kiếm thông tin
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : kbs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Chưa có knowledge base nào
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Số items</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kbs.map((kb) => (
                    <TableRow key={kb.id}>
                      <TableCell className="font-medium">{kb.name}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {kb.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          <FileText className="h-3 w-3 mr-1" />
                          {kb.item_count || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={kb.is_active}
                          onCheckedChange={() => toggleActive(kb)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDialog(kb)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Xác nhận xóa?"))
                              deleteMutation.mutate(kb.id);
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingKb ? "Sửa Knowledge Base" : "Thêm Knowledge Base"}
            </DialogTitle>
            <DialogDescription>
              Cấu hình cơ sở tri thức cho AI
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Tài liệu sản phẩm"
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Chứa các tài liệu hướng dẫn sử dụng sản phẩm"
              />
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
              {editingKb ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
