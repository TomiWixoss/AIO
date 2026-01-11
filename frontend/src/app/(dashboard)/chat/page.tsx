"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  Send,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { chatbotsApi, Chatbot } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: chatbotsData } = useQuery({
    queryKey: ["chatbots"],
    queryFn: () => chatbotsApi.getAll(),
  });

  const chatbots =
    chatbotsData?.data?.data?.filter((c: Chatbot) => c.is_active) || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  const handleSelectChatbot = (chatbot: Chatbot) => {
    setSelectedChatbot(chatbot);
    setMessages(
      chatbot.welcome_message
        ? [
            {
              role: "assistant",
              content: chatbot.welcome_message,
              timestamp: new Date(),
            },
          ]
        : []
    );
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !selectedChatbot) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: new Date() },
    ]);
    setIsLoading(true);
    setStreamingContent("");

    try {
      const response = await fetch(
        `${API_URL}/chatbots/${selectedChatbot.id}/test-chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage, stream: true }),
        }
      );

      if (!response.ok) {
        throw new Error("Lỗi kết nối");
      }

      const contentType = response.headers.get("content-type");

      if (contentType?.includes("text/event-stream")) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || "";
                  if (content) {
                    fullContent += content;
                    setStreamingContent(fullContent);
                  }
                } catch {
                  // Skip invalid JSON
                }
              }
            }
          }
        }

        if (fullContent) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: fullContent, timestamp: new Date() },
          ]);
        }
        setStreamingContent("");
      } else {
        // Handle non-streaming response
        const data = await response.json();
        if (data.choices?.[0]?.message?.content) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: data.choices[0].message.content,
              timestamp: new Date(),
            },
          ]);
        } else if (data.error) {
          toast.error(data.error);
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi gửi tin nhắn";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setStreamingContent("");
    }
  };

  const clearChat = () => {
    if (selectedChatbot?.welcome_message) {
      setMessages([
        {
          role: "assistant",
          content: selectedChatbot.welcome_message,
          timestamp: new Date(),
        },
      ]);
    } else {
      setMessages([]);
    }
  };

  const copyConversation = () => {
    const text = messages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Đã copy cuộc trò chuyện");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header title="Chat Demo" description="Test chatbot với các model AI" />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Action buttons */}
        <div className="flex justify-end gap-1 p-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            disabled={messages.length === 0}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyConversation}
            disabled={messages.length === 0}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {messages.length === 0 && !streamingContent && (
              <div className="text-center py-20 text-muted-foreground">
                <Bot className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">
                  {selectedChatbot
                    ? "Bắt đầu cuộc trò chuyện"
                    : "Chọn chatbot để bắt đầu"}
                </p>
                <p className="text-sm">
                  {selectedChatbot
                    ? "Nhập tin nhắn để chat với AI"
                    : "Sử dụng dropdown bên dưới để chọn chatbot"}
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3">
                      <p className="text-sm whitespace-pre-wrap">
                        {msg.content}
                      </p>
                      {msg.timestamp && (
                        <p className="text-xs text-primary-foreground/70 mt-1">
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                    {msg.timestamp && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Streaming content */}
            {streamingContent && (
              <div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {streamingContent}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && !streamingContent && (
              <div className="flex gap-1 py-2">
                <span
                  className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t p-4">
          <div className="max-w-4xl mx-auto">
            <div className="border rounded-xl bg-background shadow-sm">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  selectedChatbot?.placeholder_text ||
                  (selectedChatbot ? "Nhập tin nhắn..." : "Chọn chatbot trước")
                }
                disabled={isLoading || !selectedChatbot}
                className="border-0 resize-none focus-visible:ring-0 min-h-[60px] max-h-[200px]"
                rows={1}
              />
              <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/30">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Bot className="h-4 w-4" />
                      {selectedChatbot ? selectedChatbot.name : "Chọn Chatbot"}
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {chatbots.length === 0 ? (
                      <DropdownMenuItem disabled>
                        Không có chatbot
                      </DropdownMenuItem>
                    ) : (
                      chatbots.map((chatbot: Chatbot) => (
                        <DropdownMenuItem
                          key={chatbot.id}
                          onClick={() => handleSelectChatbot(chatbot)}
                          className="gap-2"
                        >
                          <Bot className="h-4 w-4" />
                          {chatbot.name}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim() || !selectedChatbot}
                  size="sm"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
