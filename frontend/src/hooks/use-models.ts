"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { modelsApi, providersApi, Model } from "@/lib/api";

export interface ModelFormData {
  provider_id: number;
  model_id: string;
  display_name: string;
  is_active: boolean;
  priority: number;
}

const initialFormData: ModelFormData = {
  provider_id: 0,
  model_id: "",
  display_name: "",
  is_active: true,
  priority: 0,
};

export function useModels() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [formData, setFormData] = useState<ModelFormData>(initialFormData);

  const { data: modelsData, isLoading } = useQuery({
    queryKey: ["models"],
    queryFn: () => modelsApi.getAll(),
  });

  const { data: providersData } = useQuery({
    queryKey: ["providers"],
    queryFn: () => providersApi.getAll(),
  });

  const models = modelsData?.data?.data || [];
  const providers = providersData?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: Partial<Model>) => modelsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
      toast.success("Tạo model thành công");
      closeDialog();
    },
    onError: () => toast.error("Lỗi tạo model"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Model> }) =>
      modelsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
      toast.success("Cập nhật thành công");
      closeDialog();
    },
    onError: () => toast.error("Lỗi cập nhật"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => modelsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
      toast.success("Xóa thành công");
    },
    onError: () => toast.error("Lỗi xóa model"),
  });

  const openDialog = (model?: Model) => {
    if (model) {
      setEditingModel(model);
      setFormData({
        provider_id: model.provider_id,
        model_id: model.model_id,
        display_name: model.display_name,
        is_active: model.is_active,
        priority: model.priority || 0,
      });
    } else {
      setEditingModel(null);
      setFormData({
        ...initialFormData,
        provider_id: providers[0]?.id || 0,
      });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingModel(null);
  };

  const handleSubmit = () => {
    if (editingModel) {
      updateMutation.mutate({ id: editingModel.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleActive = (model: Model) => {
    updateMutation.mutate({
      id: model.id,
      data: { is_active: !model.is_active },
    });
  };

  const updatePriority = (model: Model, priority: number) => {
    updateMutation.mutate({
      id: model.id,
      data: { priority },
    });
  };

  const getProviderName = (providerId: number) => {
    const provider = providers.find((p) => p.id === providerId);
    return provider?.provider_id || "N/A";
  };

  const updateFormData = (updates: Partial<ModelFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  return {
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
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    handleDelete: (id: number) => {
      if (confirm("Xác nhận xóa?")) deleteMutation.mutate(id);
    },
  };
}
