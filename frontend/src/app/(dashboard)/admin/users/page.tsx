"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Users } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { adminsApi, Admin } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { admin: currentAdmin } = useAuthStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admins"],
    queryFn: () => adminsApi.getAll(),
  });

  const admins = data?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: { email: string; password: string; name: string }) =>
      adminsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Tạo quản trị viên thành công");
      closeDialog();
    },
    onError: () => toast.error("Lỗi tạo quản trị viên"),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { name?: string; password?: string };
    }) => adminsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Cập nhật thành công");
      closeDialog();
    },
    onError: () => toast.error("Lỗi cập nhật"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Xóa thành công");
    },
    onError: () => toast.error("Lỗi xóa"),
  });

  const openDialog = (admin?: Admin) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({ name: admin.name, email: admin.email, password: "" });
    } else {
      setEditingAdmin(null);
      setFormData({ name: "", email: "", password: "" });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingAdmin(null);
  };

  const handleSubmit = () => {
    if (editingAdmin) {
      const updateData: { name?: string; password?: string } = {
        name: formData.name,
      };
      if (formData.password) updateData.password = formData.password;
      updateMutation.mutate({ id: editingAdmin.id, data: updateData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Quản trị viên"
        description="Quản lý tài khoản quản trị"
        actions={
          <Button onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-1" />
            Thêm Admin
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Danh sách Quản trị viên
            </CardTitle>
            <CardDescription>
              Các tài khoản có quyền quản trị hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {admin.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{admin.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDialog(admin)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={admin.id === currentAdmin?.id}
                          onClick={() => {
                            if (confirm("Xác nhận xóa?"))
                              deleteMutation.mutate(admin.id);
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
              {editingAdmin ? "Sửa Quản trị viên" : "Thêm Quản trị viên"}
            </DialogTitle>
            <DialogDescription>
              Nhập thông tin tài khoản quản trị
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Họ tên</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nguyễn Văn A"
              />
            </div>
            {!editingAdmin && (
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="admin@example.com"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>
                {editingAdmin
                  ? "Mật khẩu mới (để trống nếu không đổi)"
                  : "Mật khẩu"}
              </Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="••••••••"
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
              {editingAdmin ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
