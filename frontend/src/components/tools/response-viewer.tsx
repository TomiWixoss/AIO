"use client";

import { useState } from "react";
import { Copy, Check, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ParamRow } from "./params-table";

interface TestResult {
  success?: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  data?: any;
  responseTime?: number;
  request?: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
  };
  error?: string;
}

interface Props {
  testableParams: ParamRow[];
  testParams: Record<string, string>;
  setTestParams: (params: Record<string, string>) => void;
  testResult: TestResult | null;
  testing: boolean;
  onTest: () => void;
  canTest: boolean;
}

export function ResponseViewer({
  testableParams,
  testParams,
  setTestParams,
  testResult,
  testing,
  onTest,
  canTest,
}: Props) {
  const [copied, setCopied] = useState(false);

  const copyResult = () => {
    navigator.clipboard.writeText(JSON.stringify(testResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
        <div className="flex items-center gap-3">
          <span className="font-medium">Response</span>
          {testResult?.status && (
            <Badge
              variant="outline"
              className={cn(
                testResult.status >= 200 && testResult.status < 300
                  ? "bg-green-500/20 text-green-600 border-green-500/50"
                  : "bg-red-500/20 text-red-600 border-red-500/50"
              )}
            >
              {testResult.status} {testResult.statusText}
            </Badge>
          )}
          {testResult?.responseTime && (
            <span className="text-xs text-muted-foreground">
              {testResult.responseTime}ms
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {testResult && (
            <Button variant="ghost" size="sm" onClick={copyResult}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Test Params Input */}
      {testableParams.length > 0 && (
        <div className="p-4 border-b bg-muted/10">
          <p className="text-sm font-medium mb-3">Test Parameters</p>
          <div className="grid grid-cols-2 gap-3">
            {testableParams.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-28 truncate">
                  {p.key}
                  {p.required && <span className="text-red-500">*</span>}
                </span>
                <Input
                  value={testParams[p.key] || ""}
                  onChange={(e) =>
                    setTestParams({ ...testParams, [p.key]: e.target.value })
                  }
                  placeholder={p.description || p.key}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
          <Button
            onClick={onTest}
            disabled={testing || !canTest}
            className="mt-3"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Test API
          </Button>
        </div>
      )}

      {/* Response Body */}
      <div className="p-4 min-h-[200px]">
        {testing ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : testResult ? (
          testResult.error ? (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md">
              <p className="text-sm font-medium text-red-600 mb-1">Error</p>
              <pre className="text-sm text-red-600 whitespace-pre-wrap">
                {testResult.error}
              </pre>
            </div>
          ) : (
            <Tabs defaultValue="body" className="w-full">
              <TabsList>
                <TabsTrigger value="body">Body</TabsTrigger>
                <TabsTrigger value="headers">Headers</TabsTrigger>
                <TabsTrigger value="request">Request</TabsTrigger>
              </TabsList>
              <TabsContent value="body" className="mt-3">
                <pre className="p-3 bg-muted/50 rounded-md text-xs font-mono whitespace-pre-wrap max-h-[400px] overflow-auto">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </TabsContent>
              <TabsContent value="headers" className="mt-3">
                <pre className="p-3 bg-muted/50 rounded-md text-xs font-mono whitespace-pre-wrap">
                  {JSON.stringify(testResult.headers, null, 2)}
                </pre>
              </TabsContent>
              <TabsContent value="request" className="mt-3">
                <pre className="p-3 bg-muted/50 rounded-md text-xs font-mono whitespace-pre-wrap">
                  {JSON.stringify(testResult.request, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          )
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Send className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {testableParams.length > 0
                ? "Điền parameters và click Test API"
                : "Click Send để test API"}
            </p>
            {!canTest && (
              <p className="text-xs mt-1">Lưu tool trước khi test</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
