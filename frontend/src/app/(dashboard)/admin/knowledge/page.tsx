"use client";

import {
  Plus,
  Trash2,
  Pencil,
  BookOpen,
  MoreVertical,
  FileText,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useKnowledgeList } from "@/hooks/use-knowledge";

export default function KnowledgePage() {
  const router = useRouter();
  const {
    kbs,
    isLoading,
    toggleActive,
    handleDelete,
    // Dialog state
    isDialogOpen,
    setIsDialogOpen,
    editingKb,
    formData,
    updateFormData,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    handleSubmit,
    isSubmitting,
  } = useKnowledgeList();

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Knowledge Base"
        description="Quản lý cơ sở tri thức cho AI"
        actions={
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo Knowledge Base
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
              Click vào nút Items để quản lý nội dung tri thức
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
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">
                  Chưa có knowledge base nào
                </p>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo knowledge base đầu tiên
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Số items</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kbs.map((kb) => (
                    <TableRow key={kb.id}>
                      <TableCell>
                        <span className="font-medium">{kb.name}</span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {kb.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          <FileText className="h-3 w-3 mr-1" />
                          {kb.items_count || kb.item_count || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={kb.is_active}
                          onCheckedChange={() => toggleActive(kb)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/admin/knowledge/${kb.id}`)
                            }
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Items
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openEditDialog(kb)}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/admin/knowledge/${kb.id}`)
                                }
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Quản lý Items
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(kb.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingKb ? "Sửa Knowledge Base" : "Tạo Knowledge Base"}
            </DialogTitle>
            <DialogDescription>
              {editingKb
                ? "Cập nhật thông tin knowledge base"
                : "Tạo cơ sở tri thức mới cho AI"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên *</Label>
              <Input
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                placeholder="VD: Tài liệu sản phẩm"
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  updateFormData({ description: e.target.value })
                }
                placeholder="Mô tả về knowledge base này..."
                rows={3}
              />
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
              {editingKb ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
