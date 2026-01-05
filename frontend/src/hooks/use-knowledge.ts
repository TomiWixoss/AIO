"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { knowledgeApi, KnowledgeBase } from "@/lib/api";

export interface KnowledgeFormData {
  name: string;
  description: string;
  is_active: boolean;
}

const initialFormData: KnowledgeFormData = {
  name: "",
  description: "",
  is_active: true,
};

export function useKnowledge() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKb, setEditingKb] = useState<KnowledgeBase | null>(null);
  const [formData, setFormData] = useState<KnowledgeFormData>(initialFormData);

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
      setFormData(initialFormData);
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

  const updateFormData = (updates: Partial<KnowledgeFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  return {
    kbs,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    editingKb,
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
