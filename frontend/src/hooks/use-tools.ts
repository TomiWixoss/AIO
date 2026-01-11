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
  headers_template: string;
  body_template: string;
  query_params_template: string;
  parameters: string;
  response_mapping: string;
  is_active: boolean;
}

const initialFormData: ToolFormData = {
  name: "",
  description: "",
  endpoint_url: "",
  http_method: "GET",
  headers_template: "",
  body_template: "",
  query_params_template: "",
  parameters: "",
  response_mapping: "",
  is_active: true,
};

export function useTools() {
  const queryClient = useQueryClient();
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [formData, setFormData] = useState<ToolFormData>(initialFormData);

  const { data, isLoading } = useQuery({
    queryKey: ["tools"],
    queryFn: () => toolsApi.getAll(),
  });

  const tools = data?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: Partial<Tool>) => toolsApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      toast.success("Tạo tool thành công");
      // Update editing tool with new ID
      if (response?.data?.data?.id) {
        setEditingTool({ ...formData, id: response.data.data.id } as any);
      }
    },
    onError: () => toast.error("Lỗi tạo tool"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Tool> }) =>
      toolsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      toast.success("Cập nhật thành công");
    },
    onError: () => toast.error("Lỗi cập nhật"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => toolsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      toast.success("Xóa thành công");
      setEditingTool(null);
      setFormData(initialFormData);
    },
    onError: () => toast.error("Lỗi xóa"),
  });

  const parseJsonField = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return JSON.stringify(value, null, 2);
  };

  const openDialog = (tool?: Tool) => {
    if (tool) {
      setEditingTool(tool);
      setFormData({
        name: tool.name,
        description: tool.description,
        endpoint_url: tool.endpoint_url,
        http_method: tool.http_method,
        headers_template: parseJsonField((tool as any).headers_template),
        body_template: parseJsonField((tool as any).body_template),
        query_params_template: parseJsonField(
          (tool as any).query_params_template
        ),
        parameters: parseJsonField((tool as any).parameters),
        response_mapping: parseJsonField((tool as any).response_mapping),
        is_active: tool.is_active,
      });
    } else {
      setEditingTool(null);
      setFormData(initialFormData);
    }
  };

  const closeDialog = () => {
    setEditingTool(null);
    setFormData(initialFormData);
  };

  const prepareSubmitData = (data: ToolFormData) => {
    const result: any = {
      name: data.name,
      description: data.description,
      endpoint_url: data.endpoint_url,
      http_method: data.http_method,
      is_active: data.is_active,
    };

    // Parse JSON fields
    const jsonFields = [
      "headers_template",
      "body_template",
      "query_params_template",
      "parameters",
      "response_mapping",
    ];
    jsonFields.forEach((field) => {
      const value = (data as any)[field];
      if (value && value.trim()) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value;
        }
      }
    });

    return result;
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.description || !formData.endpoint_url) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    const submitData = prepareSubmitData(formData);
    if (editingTool) {
      updateMutation.mutate({ id: editingTool.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
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
    editingTool,
    formData,
    updateFormData,
    openDialog,
    closeDialog,
    handleSubmit,
    toggleActive,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    handleDelete: (id: number) => {
      deleteMutation.mutate(id);
    },
  };
}
