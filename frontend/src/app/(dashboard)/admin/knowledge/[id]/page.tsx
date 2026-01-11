"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  FileText,
  Loader2,
  Save,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { knowledgeApi, KnowledgeBase } from "@/lib/api";
import { cn } from "@/lib/utils";

interface KnowledgeItem {
  id: number;
  content: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

interface SearchResult {
  id: number;
  content: string;
  metadata: Record<string, any> | null;
  similarity: number;
}

export default function KnowledgeItemsPage() {
  const params = useParams();
  const router = useRouter();
  const kbId = Number(params.id);

  const [kb, setKb] = useState<KnowledgeBase | null>(null);
  const [loading, setLoading] = useState(true);

  // Items state
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Add item state
  const [newItemContent, setNewItemContent] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Expand state for viewing full content
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Load knowledge base info
  useEffect(() => {
    if (kbId) {
      knowledgeApi
        .getById(kbId)
        .then((res) => {
          setKb(res.data.data);
          setLoading(false);
        })
        .catch(() => {
          toast.error("Không tìm thấy knowledge base");
          router.push("/admin/knowledge");
        });
    }
  }, [kbId, router]);

  // Load items
  useEffect(() => {
    if (kbId) {
      loadItems();
    }
  }, [kbId]);

  const loadItems = async () => {
    if (!kbId) return;
    setLoadingItems(true);
    try {
      const res = await knowledgeApi.getItems(kbId);
      setItems(res.data.data || []);
    } catch (e) {
      toast.error("Lỗi tải items");
    } finally {
      setLoadingItems(false);
    }
  };

  const handleAddItem = async () => {
    if (!kbId || !newItemContent.trim()) {
      toast.error("Vui lòng nhập nội dung");
      return;
    }
    setAddingItem(true);
    try {
      await knowledgeApi.addItem(kbId, { content: newItemContent });
      toast.success("Đã thêm item!");
      setNewItemContent("");
      loadItems();
    } catch (e: any) {
      toast.error(e.message || "Lỗi thêm item");
    } finally {
      setAddingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!kbId || !confirm("Xác nhận xóa item này?")) return;
    try {
      await knowledgeApi.deleteItem(kbId, itemId);
      toast.success("Đã xóa item");
      loadItems();
    } catch (e: any) {
      toast.error(e.message || "Lỗi xóa item");
    }
  };

  const handleSearch = async () => {
    if (!kbId || !searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await knowledgeApi.search(kbId, searchQuery);
      setSearchResults(res.data.data || []);
    } catch (e: any) {
      toast.error(e.message || "Lỗi tìm kiếm");
    } finally {
      setSearching(false);
    }
  };

  const copyContent = (content: string, id: number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatSimilarity = (similarity: number | undefined) => {
    if (similarity === undefined || similarity === null || isNaN(similarity)) {
      return "N/A";
    }
    return `${(similarity * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <div className="h-14 border-b flex items-center px-4">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="h-14 border-b flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/knowledge")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-semibold">{kb?.name}</h1>
            <p className="text-xs text-muted-foreground">{kb?.description}</p>
          </div>
        </div>
        <Badge variant="secondary">
          <FileText className="h-3 w-3 mr-1" />
          {items.length} items
        </Badge>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          {/* Tabs for Items and Search */}
          <Tabs defaultValue="items">
            <TabsList>
              <TabsTrigger value="items">
                Items
                {items.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {items.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="add">Thêm Item</TabsTrigger>
              <TabsTrigger value="search">Test Search</TabsTrigger>
            </TabsList>

            {/* Items List Tab */}
            <TabsContent value="items" className="mt-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Knowledge Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingItems ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Chưa có item nào</p>
                      <p className="text-sm">
                        Chuyển sang tab "Thêm Item" để thêm nội dung
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="border rounded-lg p-3 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div
                                className={cn(
                                  "text-sm whitespace-pre-wrap",
                                  expandedItem !== item.id && "line-clamp-3"
                                )}
                              >
                                {item.content}
                              </div>
                              {item.content.length > 200 && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 text-xs"
                                  onClick={() =>
                                    setExpandedItem(
                                      expandedItem === item.id ? null : item.id
                                    )
                                  }
                                >
                                  {expandedItem === item.id
                                    ? "Thu gọn"
                                    : "Xem thêm"}
                                </Button>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  copyContent(item.content, item.id)
                                }
                              >
                                {copiedId === item.id ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            {new Date(item.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Add Item Tab */}
            <TabsContent value="add" className="mt-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Thêm Knowledge Item
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nội dung</Label>
                    <Textarea
                      value={newItemContent}
                      onChange={(e) => setNewItemContent(e.target.value)}
                      placeholder="Nhập nội dung tri thức..."
                      className="font-mono text-sm min-h-[200px] max-h-[400px] resize-y"
                    />
                    <p className="text-xs text-muted-foreground">
                      {newItemContent.length} ký tự
                    </p>
                  </div>
                  <Button
                    onClick={handleAddItem}
                    disabled={addingItem || !newItemContent.trim()}
                    className="w-full"
                  >
                    {addingItem ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Thêm Item
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Search Tab */}
            <TabsContent value="search" className="mt-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Test Semantic Search
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Nhập câu hỏi để test tìm kiếm semantic..."
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <Button
                      onClick={handleSearch}
                      disabled={searching || !searchQuery.trim()}
                    >
                      {searching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Tìm thấy {searchResults.length} kết quả:
                      </p>
                      {searchResults.map((result, idx) => (
                        <div
                          key={idx}
                          className="p-3 border rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge
                              variant={
                                (result.similarity || 0) > 0.8
                                  ? "default"
                                  : (result.similarity || 0) > 0.5
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              Similarity: {formatSimilarity(result.similarity)}
                            </Badge>
                          </div>
                          <p className="text-sm whitespace-pre-wrap line-clamp-5">
                            {result.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {!searching && searchQuery && searchResults.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Không tìm thấy kết quả phù hợp
                    </p>
                  )}

                  {!searchQuery && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nhập câu hỏi và nhấn Enter hoặc nút Search để test
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
