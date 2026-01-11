"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { chatbotsApi, Chatbot } from "@/lib/api";

export type { Chatbot } from "@/lib/api";

export function useChatbots() {
  const queryClient = useQueryClient();

  const { data: chatbotsData, isLoading } = useQuery({
    queryKey: ["chatbots"],
    queryFn: () => chatbotsApi.getAll(),
  });

  const chatbots = chatbotsData?.data?.data || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Chatbot> }) =>
      chatbotsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbots"] });
    },
    onError: () => toast.error("Lỗi cập nhật"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => chatbotsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbots"] });
      toast.success("Xóa thành công");
    },
    onError: () => toast.error("Lỗi xóa chatbot"),
  });

  const toggleActive = (chatbot: Chatbot) => {
    updateMutation.mutate({
      id: chatbot.id,
      data: { is_active: !chatbot.is_active },
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Xác nhận xóa chatbot này?")) {
      deleteMutation.mutate(id);
    }
  };

  return {
    chatbots,
    isLoading,
    toggleActive,
    handleDelete,
  };
}
