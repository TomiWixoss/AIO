"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  providersApi,
  modelsApi,
  apiKeysApi,
  Provider,
  Model,
  ApiKey,
} from "@/lib/api";

export interface ModelFormData {
  model_id: string;
  display_name: string;
  is_active: boolean;
  priority: number;
}

export interface ApiKeyFormData {
  name: string;
  credentials: string;
  daily_limit: number;
}

const initialModelForm: ModelFormData = {
  model_id: "",
  display_name: "",
  is_active: true,
  priority: 0,
};

const initialKeyForm: ApiKeyFormData = {
  name: "",
  credentials: "",
  daily_limit: 0,
};

export function useProviderDetail(providerId: number) {
  const queryClient = useQueryClient();

  // Dialog states
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
  const [isKeyDialogOpen, setIsKeyDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);

  // Form states
  const [modelForm, setModelForm] = useState<ModelFormData>(initialModelForm);
  const [keyForm, setKeyForm] = useState<ApiKeyFormData>(initialKeyForm);

  // Fetch provider detail
  const { data: providerData, isLoading: isLoadingProvider } = useQuery({
    queryKey: ["provider", providerId],
    queryFn: () => providersApi.getById(providerId),
    enabled: !!providerId,
  });

  // Fetch models for this provider
  const { data: modelsData, isLoading: isLoadingModels } = useQuery({
    queryKey: ["models", "provider", providerId],
    queryFn: async () => {
      const res = await modelsApi.getAll();
      const allModels = res.data?.data || [];
      return allModels.filter((m: Model) => m.provider_id === providerId);
    },
    enabled: !!providerId,
  });

  // Fetch API keys for this provider
  const { data: keysData, isLoading: isLoadingKeys } = useQuery({
    queryKey: ["api-keys", providerId],
    queryFn: () => apiKeysApi.getByProvider(providerId),
    enabled: !!providerId,
  });

  const provider = providerData?.data?.data as Provider | undefined;
  const models = (modelsData || []) as Model[];
  const keys = (keysData?.data?.data || []) as ApiKey[];

  // Provider mutations
  const updateProviderMutation = useMutation({
    mutationFn: (data: Partial<Provider>) =>
      providersApi.update(providerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider", providerId] });
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Cập nhật provider thành công");
    },
    onError: () => toast.error("Lỗi cập nhật provider"),
  });

  // Model mutations
  const createModelMutation = useMutation({
    mutationFn: (data: Partial<Model>) =>
      modelsApi.create({ ...data, provider_id: providerId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
      toast.success("Thêm model thành công");
      closeModelDialog();
    },
    onError: () => toast.error("Lỗi thêm model"),
  });

  const updateModelMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Model> }) =>
      modelsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
      toast.success("Cập nhật model thành công");
      closeModelDialog();
    },
    onError: () => toast.error("Lỗi cập nhật model"),
  });

  const deleteModelMutation = useMutation({
    mutationFn: (id: number) => modelsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
      toast.success("Xóa model thành công");
    },
    onError: () => toast.error("Lỗi xóa model"),
  });

  // API Key mutations
  const createKeyMutation = useMutation({
    mutationFn: (data: any) => apiKeysApi.createForProvider(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Thêm API key thành công");
      closeKeyDialog();
    },
    onError: () => toast.error("Lỗi thêm API key"),
  });

  const updateKeyMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiKeysApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("Cập nhật API key thành công");
    },
    onError: () => toast.error("Lỗi cập nhật API key"),
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (id: number) => apiKeysApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Xóa API key thành công");
    },
    onError: () => toast.error("Lỗi xóa API key"),
  });

  // Model dialog handlers
  const openModelDialog = (model?: Model) => {
    if (model) {
      setEditingModel(model);
      setModelForm({
        model_id: model.model_id,
        display_name: model.display_name,
        is_active: model.is_active,
        priority: model.priority || 0,
      });
    } else {
      setEditingModel(null);
      setModelForm(initialModelForm);
    }
    setIsModelDialogOpen(true);
  };

  const closeModelDialog = () => {
    setIsModelDialogOpen(false);
    setEditingModel(null);
    setModelForm(initialModelForm);
  };

  const submitModel = () => {
    if (editingModel) {
      updateModelMutation.mutate({ id: editingModel.id, data: modelForm });
    } else {
      createModelMutation.mutate(modelForm);
    }
  };

  // API Key dialog handlers
  const openKeyDialog = () => {
    setKeyForm(initialKeyForm);
    setIsKeyDialogOpen(true);
  };

  const closeKeyDialog = () => {
    setIsKeyDialogOpen(false);
    setKeyForm(initialKeyForm);
  };

  const submitKey = () => {
    createKeyMutation.mutate({
      provider_id: providerId,
      name: keyForm.name,
      credentials_encrypted: JSON.stringify({ api_key: keyForm.credentials }),
      daily_limit: keyForm.daily_limit,
    });
  };

  // Toggle handlers
  const toggleModelActive = (model: Model) => {
    updateModelMutation.mutate({
      id: model.id,
      data: { is_active: !model.is_active },
    });
  };

  const toggleKeyActive = (key: ApiKey) => {
    updateKeyMutation.mutate({
      id: key.id,
      data: { is_active: !key.is_active },
    });
  };

  const updateModelPriority = (model: Model, priority: number) => {
    updateModelMutation.mutate({ id: model.id, data: { priority } });
  };

  return {
    // Data
    provider,
    models,
    keys,
    isLoading: isLoadingProvider || isLoadingModels || isLoadingKeys,

    // Model dialog
    isModelDialogOpen,
    setIsModelDialogOpen,
    editingModel,
    modelForm,
    setModelForm: (updates: Partial<ModelFormData>) =>
      setModelForm((prev) => ({ ...prev, ...updates })),
    openModelDialog,
    closeModelDialog,
    submitModel,
    toggleModelActive,
    updateModelPriority,
    deleteModel: (id: number) => {
      if (confirm("Xác nhận xóa model này?")) deleteModelMutation.mutate(id);
    },
    isModelSubmitting:
      createModelMutation.isPending || updateModelMutation.isPending,

    // API Key dialog
    isKeyDialogOpen,
    setIsKeyDialogOpen,
    keyForm,
    setKeyForm: (updates: Partial<ApiKeyFormData>) =>
      setKeyForm((prev) => ({ ...prev, ...updates })),
    openKeyDialog,
    closeKeyDialog,
    submitKey,
    toggleKeyActive,
    deleteKey: (id: number) => {
      if (confirm("Xác nhận xóa API key này?")) deleteKeyMutation.mutate(id);
    },
    isKeySubmitting: createKeyMutation.isPending,

    // Provider
    updateProvider: (data: Partial<Provider>) =>
      updateProviderMutation.mutate(data),
  };
}
