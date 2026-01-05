"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { providersApi, Provider } from "@/lib/api";

export const PROVIDER_TYPES = [
  { id: "google-ai", name: "Google AI" },
  { id: "groq", name: "Groq" },
  { id: "cerebras", name: "Cerebras" },
  { id: "openrouter", name: "OpenRouter" },
];

export function useProviders() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["providers"],
    queryFn: () => providersApi.getAll(),
  });

  const providers = data?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: { provider_id: string }) => providersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Tạo provider thành công");
      setIsDialogOpen(false);
      setSelectedProviderId("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Lỗi tạo provider");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Provider> }) =>
      providersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Cập nhật thành công");
    },
    onError: () => toast.error("Lỗi cập nhật"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => providersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Xóa thành công");
    },
    onError: () => toast.error("Lỗi xóa provider"),
  });

  const handleCreate = () => {
    if (!selectedProviderId) {
      toast.error("Vui lòng chọn loại provider");
      return;
    }
    createMutation.mutate({ provider_id: selectedProviderId });
  };

  const toggleActive = (provider: Provider) => {
    updateMutation.mutate({
      id: provider.id,
      data: { is_active: !provider.is_active },
    });
  };

  const getProviderDisplayName = (providerId: string) => {
    return PROVIDER_TYPES.find((p) => p.id === providerId)?.name || providerId;
  };

  const existingProviderIds = providers.map((p) => p.provider_id);
  const availableProviders = PROVIDER_TYPES.filter(
    (p) => !existingProviderIds.includes(p.id)
  );

  return {
    providers,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    selectedProviderId,
    setSelectedProviderId,
    availableProviders,
    handleCreate,
    toggleActive,
    getProviderDisplayName,
    isSubmitting: createMutation.isPending,
    handleDelete: (id: number) => {
      if (confirm("Xác nhận xóa provider này?")) deleteMutation.mutate(id);
    },
  };
}
