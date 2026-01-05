"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiKeysApi, providersApi, ApiKey } from "@/lib/api";

export const PROVIDER_NAMES: Record<string, string> = {
  "google-ai": "Google AI",
  groq: "Groq",
  cerebras: "Cerebras",
  openrouter: "OpenRouter",
};

export interface ApiKeyFormData {
  provider_id: number;
  name: string;
  credentials: string;
  priority: number;
  daily_limit: number;
}

const initialFormData: ApiKeyFormData = {
  provider_id: 0,
  name: "",
  credentials: "",
  priority: 1,
  daily_limit: 0,
};

export function useApiKeys() {
  const queryClient = useQueryClient();
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ApiKeyFormData>(initialFormData);

  const { data: providersData } = useQuery({
    queryKey: ["providers"],
    queryFn: () => providersApi.getAll(),
  });

  const providers = providersData?.data?.data || [];

  const { data: keysData, isLoading } = useQuery({
    queryKey: ["api-keys", selectedProviderId],
    queryFn: () =>
      selectedProviderId ? apiKeysApi.getByProvider(selectedProviderId) : null,
    enabled: !!selectedProviderId,
  });

  const keys = keysData?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => apiKeysApi.createForProvider(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("Thêm API key thành công");
      setIsDialogOpen(false);
    },
    onError: () => toast.error("Lỗi thêm API key"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiKeysApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("Cập nhật thành công");
    },
    onError: () => toast.error("Lỗi cập nhật"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiKeysApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("Xóa thành công");
    },
    onError: () => toast.error("Lỗi xóa"),
  });

  const openDialog = () => {
    setFormData({
      ...initialFormData,
      provider_id: selectedProviderId || providers[0]?.id || 0,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    createMutation.mutate({
      ...formData,
      credentials_encrypted: JSON.stringify({ api_key: formData.credentials }),
    });
  };

  const toggleActive = (key: ApiKey) => {
    updateMutation.mutate({ id: key.id, data: { is_active: !key.is_active } });
  };

  const updateFormData = (updates: Partial<ApiKeyFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  return {
    providers,
    keys,
    isLoading,
    selectedProviderId,
    setSelectedProviderId,
    isDialogOpen,
    setIsDialogOpen,
    formData,
    updateFormData,
    openDialog,
    handleSubmit,
    toggleActive,
    isSubmitting: createMutation.isPending,
    handleDelete: (id: number) => {
      if (confirm("Xác nhận xóa?")) deleteMutation.mutate(id);
    },
  };
}
