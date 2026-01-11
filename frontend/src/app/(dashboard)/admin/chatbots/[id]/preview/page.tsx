"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Bot,
  Send,
  Loader2,
  ArrowLeft,
  Maximize2,
  Minimize2,
  X,
  Code,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { chatbotsApi, Chatbot } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ChatbotPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const chatbotId = params.id as string;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showWidget, setShowWidget] = useState(true);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: chatbotData, isLoading: isLoadingChatbot } = useQuery({
    queryKey: ["chatbot", chatbotId],
    queryFn: () => chatbotsApi.getById(parseInt(chatbotId)),
    enabled: !!chatbotId,
  });

  const chatbot = chatbotData?.data?.data as Chatbot | undefined;

  useEffect(() => {
    if (chatbot?.welcome_message) {
      setMessages([{ role: "assistant", content: chatbot.welcome_message }]);
    }
  }, [chatbot]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !chatbot) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/chatbots/${chatbot.id}/test-chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage }),
        }
      );

      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.choices[0].message.content },
        ]);
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi gửi tin nhắn";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const copyEmbedCode = () => {
    if (!chatbot) return;
    const embedCode = `<script src="${API_URL}/widget/${chatbot.slug}.js"></script>`;
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Đã copy embed code");
  };

  if (isLoadingChatbot) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!chatbot) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-muted-foreground mb-4">Không tìm thấy chatbot</p>
        <Button onClick={() => router.push("/admin/chatbots")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-background border-b p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/chatbots")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="font-semibold">{chatbot.name}</h1>
              <p className="text-sm text-muted-foreground">Preview Widget</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">/{chatbot.slug}</Badge>
            <Button variant="outline" size="sm" onClick={copyEmbedCode}>
              {copied ? (
                <Check className="h-4 w-4 mr-1" />
              ) : (
                <Code className="h-4 w-4 mr-1" />
              )}
              {copied ? "Đã copy" : "Embed Code"}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="relative min-h-[calc(100vh-73px)] p-8">
        {/* Simulated Website Content */}
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-background rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-4">Website Demo</h2>
            <p className="text-muted-foreground mb-4">
              Đây là mô phỏng website của bạn. Widget chatbot sẽ xuất hiện ở góc
              phải màn hình.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
          <div className="bg-background rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Nội dung mẫu</h3>
            <p className="text-muted-foreground">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
        </div>

        {/* Chat Widget */}
        {showWidget && (
          <div
            className={`fixed transition-all duration-300 ${
              isExpanded
                ? "inset-4 md:inset-8"
                : "bottom-6 right-6 w-[380px] h-[550px]"
            }`}
          >
            <div className="bg-background rounded-2xl shadow-2xl border flex flex-col h-full overflow-hidden">
              {/* Widget Header */}
              <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{chatbot.name}</h3>
                    <p className="text-xs opacity-80">Online</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={() => setShowWidget(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex gap-1">
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
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t shrink-0">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder={chatbot.placeholder_text || "Nhập tin nhắn..."}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Button when widget is closed */}
        {!showWidget && (
          <button
            onClick={() => setShowWidget(true)}
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Bot className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
}
