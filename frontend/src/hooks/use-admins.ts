"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminsApi, Admin } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

export interface AdminFormData {
  name: string;
  email: string;
  password: string;
}

const initialFormData: AdminFormData = {
  name: "",
  email: "",
  password: "",
};

export function useAdmins() {
  const queryClient = useQueryClient();
  const { admin: currentAdmin } = useAuthStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState<AdminFormData>(initialFormData);

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
      setFormData(initialFormData);
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

  const updateFormData = (updates: Partial<AdminFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const canDelete = (adminId: number) => adminId !== currentAdmin?.id;

  return {
    admins,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    editingAdmin,
    formData,
    updateFormData,
    openDialog,
    closeDialog,
    handleSubmit,
    canDelete,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    handleDelete: (id: number) => {
      if (confirm("Xác nhận xóa?")) deleteMutation.mutate(id);
    },
  };
}
