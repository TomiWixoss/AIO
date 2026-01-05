"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toolsApi, Tool } from "@/lib/api";

export interface ToolFormData {
  name: string;
  description: string;
  endpoint_url: string;
  http_method: string;
  is_active: boolean;
}

const initialFormData: ToolFormData = {
  name: "",
  description: "",
  endpoint_url: "",
  http_method: "GET",
  is_active: true,
};

export function useTools() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [formData, setFormData] = useState<ToolFormData>(initialFormData);

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
      setFormData(initialFormData);
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

  const updateFormData = (updates: Partial<ToolFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  return {
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
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    handleDelete: (id: number) => {
      if (confirm("Xác nhận xóa?")) deleteMutation.mutate(id);
    },
  };
}
