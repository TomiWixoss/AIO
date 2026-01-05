"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Send,
  Loader2,
  Plus,
  StopCircle,
  Bot,
  User,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { modelsApi, chatApi, ChatMessage, ChatSession } from "@/lib/api";
import { useChatStore } from "@/stores/chat";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    currentSession,
    setCurrentSession,
    isStreaming,
    setIsStreaming,
    streamContent,
    setStreamContent,
    appendStreamContent,
    clearStreamContent,
    selectedProvider,
    selectedModel,
    setSelectedProvider,
    setSelectedModel,
    addMessage,
  } = useChatStore();

  const { data: modelsData, isLoading: modelsLoading } = useQuery({
    queryKey: ["models"],
    queryFn: () => modelsApi.getAll(),
  });

  const models = modelsData?.data?.data || [];
  const providers = [
    ...new Set(models.map((m) => m.provider_name).filter(Boolean)),
  ];
  const filteredModels = models.filter(
    (m) => m.provider_name === selectedProvider && m.is_active
  );

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentSession?.messages, streamContent]);

  // Load session
  const loadSession = async (key: string) => {
    try {
      const res = await chatApi.getSession(key);
      setCurrentSession(res.data.data);
      setSessionKey(key);
    } catch {
      toast.error("Không thể tải phiên chat");
    }
  };

  // New chat
  const newChat = () => {
    setCurrentSession(null);
    setSessionKey(null);
    clearStreamContent();
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    setIsStreaming(true);
    clearStreamContent();

    // Add user message to UI
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };

    if (currentSession) {
      addMessage(tempUserMsg);
    } else {
      setCurrentSession({
        id: 0,
        session_key: "",
        title: userMessage.slice(0, 50),
        created_at: new Date().toISOString(),
        messages: [tempUserMsg],
      });
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_key: sessionKey,
            provider: selectedProvider,
            model: selectedModel,
            message: userMessage,
            stream: true,
          }),
        }
      );

      if (!response.ok) throw new Error("Lỗi kết nối");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("Không thể đọc response");

      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);

              // Get session_key from first chunk
              if (parsed.session_key && !sessionKey) {
                setSessionKey(parsed.session_key);
              }

              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                appendStreamContent(content);
              }
            } catch {}
          }
        }
      }

      // Add assistant message
      if (fullContent) {
        const assistantMsg: ChatMessage = {
          id: Date.now() + 1,
          role: "assistant",
          content: fullContent,
          created_at: new Date().toISOString(),
        };
        addMessage(assistantMsg);
      }
    } catch (error: any) {
      toast.error(error.message || "Lỗi gửi tin nhắn");
    } finally {
      setIsStreaming(false);
      clearStreamContent();
    }
  };

  // Cancel stream
  const cancelStream = async () => {
    if (sessionKey) {
      try {
        await chatApi.cancel(sessionKey);
        toast.info("Đã hủy yêu cầu");
      } catch {}
    }
    setIsStreaming(false);
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Chat"
        description="Trò chuyện với AI"
        actions={
          <Button variant="outline" size="sm" onClick={newChat}>
            <Plus className="h-4 w-4 mr-1" />
            Chat mới
          </Button>
        }
      />

      <div className="flex-1 flex flex-col overflow-hidden p-4">
        {/* Model selector */}
        <div className="flex gap-2 mb-4">
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((p) => (
                <SelectItem key={p} value={p!}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              {filteredModels.map((m) => (
                <SelectItem key={m.id} value={m.model_id}>
                  {m.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4 pb-4">
            {!currentSession?.messages?.length && !streamContent && (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Sparkles className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">Bắt đầu cuộc trò chuyện</p>
                <p className="text-sm">Nhập tin nhắn để chat với AI</p>
              </div>
            )}

            {currentSession?.messages?.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <Card
                  className={cn(
                    "max-w-[80%] p-3",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {format(new Date(msg.created_at), "HH:mm", { locale: vi })}
                  </p>
                </Card>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Streaming content */}
            {streamContent && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <Card className="max-w-[80%] p-3 bg-muted">
                  <p className="whitespace-pre-wrap">{streamContent}</p>
                  <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                </Card>
              </div>
            )}

            {isStreaming && !streamContent && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <Card className="p-3 bg-muted">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                  </div>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-2 mt-4">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter để xuống dòng)"
            className="min-h-[60px] max-h-[200px] resize-none"
            disabled={isStreaming}
          />
          {isStreaming ? (
            <Button
              variant="destructive"
              size="icon"
              className="h-[60px] w-[60px]"
              onClick={cancelStream}
            >
              <StopCircle className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              size="icon"
              className="h-[60px] w-[60px]"
              onClick={sendMessage}
              disabled={!input.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
