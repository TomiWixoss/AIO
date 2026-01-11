"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { chatbotsApi, Chatbot } from "@/lib/api";

export type { Chatbot } from "@/lib/api";

export interface ChatbotFormData {
  name: string;
  slug: string;
  description: string;
  provider_id: number | null;
  model_id: number | null;
  auto_mode: boolean;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  tool_ids: number[];
  knowledge_base_ids: number[];
  welcome_message: string;
  placeholder_text: string;
  is_public: boolean;
  allowed_origins: string[];
  is_active: boolean;
}

const initialFormData: ChatbotFormData = {
  name: "",
  slug: "",
  description: "",
  provider_id: null,
  model_id: null,
  auto_mode: true,
  system_prompt: "",
  temperature: 0.7,
  max_tokens: 2048,
  tool_ids: [],
  knowledge_base_ids: [],
  welcome_message: "",
  placeholder_text: "Nhập tin nhắn...",
  is_public: false,
  allowed_origins: [],
  is_active: true,
};

export function useChatbots() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChatbot, setEditingChatbot] = useState<Chatbot | null>(null);
  const [formData, setFormData] = useState<ChatbotFormData>(initialFormData);
  const [exportCode, setExportCode] = useState<Record<string, any> | null>(
    null
  );
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const { data: chatbotsData, isLoading } = useQuery({
    queryKey: ["chatbots"],
    queryFn: () => chatbotsApi.getAll(),
  });

  const chatbots = chatbotsData?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: Partial<Chatbot>) => chatbotsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbots"] });
      toast.success("Tạo chatbot thành công");
      closeDialog();
    },
    onError: () => toast.error("Lỗi tạo chatbot"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Chatbot> }) =>
      chatbotsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbots"] });
      toast.success("Cập nhật thành công");
      closeDialog();
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

  const regenerateKeyMutation = useMutation({
    mutationFn: (id: number) => chatbotsApi.regenerateKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbots"] });
      toast.success("Đã tạo API key mới");
    },
    onError: () => toast.error("Lỗi tạo API key"),
  });

  const openDialog = (chatbot?: Chatbot) => {
    if (chatbot) {
      setEditingChatbot(chatbot);
      setFormData({
        name: chatbot.name,
        slug: chatbot.slug,
        description: chatbot.description || "",
        provider_id: chatbot.provider_id,
        model_id: chatbot.model_id,
        auto_mode: chatbot.auto_mode,
        system_prompt: chatbot.system_prompt || "",
        temperature: chatbot.temperature,
        max_tokens: chatbot.max_tokens,
        tool_ids: chatbot.tool_ids || [],
        knowledge_base_ids: chatbot.knowledge_base_ids || [],
        welcome_message: chatbot.welcome_message || "",
        placeholder_text: chatbot.placeholder_text || "Nhập tin nhắn...",
        is_public: chatbot.is_public,
        allowed_origins: chatbot.allowed_origins || [],
        is_active: chatbot.is_active,
      });
    } else {
      setEditingChatbot(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingChatbot(null);
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error("Vui lòng nhập tên và slug cho chatbot");
      return;
    }

    if (editingChatbot) {
      updateMutation.mutate({ id: editingChatbot.id, data: formData });
    } else {
      createMutation.mutate(formData as any);
    }
  };

  const toggleActive = (chatbot: Chatbot) => {
    updateMutation.mutate({
      id: chatbot.id,
      data: { is_active: !chatbot.is_active },
    });
  };

  const updateFormData = (updates: Partial<ChatbotFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const openExportDialog = async (chatbot: Chatbot) => {
    try {
      const response = await chatbotsApi.exportCode(chatbot.id);
      setExportCode(response.data.data);
      setIsExportDialogOpen(true);
    } catch (error) {
      toast.error("Lỗi xuất code");
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  return {
    chatbots,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    editingChatbot,
    formData,
    updateFormData,
    openDialog,
    closeDialog,
    handleSubmit,
    toggleActive,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    handleDelete: (id: number) => {
      if (confirm("Xác nhận xóa chatbot này?")) deleteMutation.mutate(id);
    },
    regenerateKey: (id: number) => {
      if (confirm("Tạo API key mới? Key cũ sẽ không còn hoạt động.")) {
        regenerateKeyMutation.mutate(id);
      }
    },
    exportCode,
    isExportDialogOpen,
    setIsExportDialogOpen,
    openExportDialog,
    generateSlug,
  };
}
