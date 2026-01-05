import { Router, Request, Response, NextFunction } from "express";
import { ProviderFactory } from "../providers/factory.js";
import { ChatCompletionRequest, Message } from "../types/index.js";
import { logger } from "../utils/logger.js";
import { validateBody } from "../middleware/validation.js";
import { ChatCompletionRequestSchema } from "../config/validation.js";
import { withRetry } from "../utils/retry.js";
import {
  loadToolConfigs,
  generateToolSystemPrompt,
  parseToolCalls,
  executeTool,
  formatToolResult,
  ToolConfig,
} from "../services/tool-executor.js";

export const chatRouter = Router();

const MAX_TOOL_ITERATIONS = 5;

chatRouter.post(
  "/completions",
  validateBody(ChatCompletionRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as ChatCompletionRequest;
      const { tool_ids = [] } = body;

      logger.info("Chat completion request", {
        provider: body.provider,
        model: body.model,
        stream: body.stream,
        tools: tool_ids,
      });

      // Load tool configs nếu có
      const toolConfigs = await loadToolConfigs(tool_ids);

      // Clone messages
      let messages = [...body.messages];

      // Inject tool system prompt
      if (toolConfigs.length > 0) {
        const toolPrompt = generateToolSystemPrompt(toolConfigs);
        const systemIdx = messages.findIndex((m) => m.role === "system");
        if (systemIdx >= 0) {
          messages[systemIdx] = {
            ...messages[systemIdx],
            content: messages[systemIdx].content + "\n\n" + toolPrompt,
          };
        } else {
          messages.unshift({ role: "system", content: toolPrompt.trim() });
        }
      }

      if (body.stream) {
        // Stream mode - không hỗ trợ tool loop, chỉ stream 1 lần
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        await withRetry(() =>
          ProviderFactory.streamChatCompletion({ ...body, messages }, res)
        );
      } else {
        // Non-stream với tool execution loop
        await handleNonStreamWithTools(body, messages, toolConfigs, res);
      }
    } catch (error) {
      next(error);
    }
  }
);

async function handleNonStreamWithTools(
  body: ChatCompletionRequest,
  messages: Message[],
  toolConfigs: ToolConfig[],
  res: Response
) {
  let currentMessages = [...messages];
  let iterations = 0;

  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations++;

    const { response } = await withRetry(() =>
      ProviderFactory.chatCompletion({ ...body, messages: currentMessages })
    );

    const assistantContent = response.choices[0]?.message?.content || "";

    // Check tool calls
    if (toolConfigs.length > 0) {
      const toolCalls = parseToolCalls(assistantContent);

      if (toolCalls && toolCalls.length > 0) {
        logger.info("Tool calls detected", { count: toolCalls.length });

        // Thêm assistant message
        currentMessages.push({ role: "assistant", content: assistantContent });

        // Execute tools
        const results: string[] = [];
        for (const call of toolCalls) {
          logger.info("Executing tool", {
            name: call.name,
            params: call.params,
          });
          const result = await executeTool(call.name, call.params, toolConfigs);
          results.push(formatToolResult(call.name, result));
        }

        // Thêm tool results như user message
        currentMessages.push({
          role: "user",
          content: results.join("\n\n"),
        });

        continue;
      }
    }

    // Không có tool call, trả về response
    res.json(response);
    return;
  }

  // Max iterations reached
  logger.warn("Max tool iterations reached");
  const { response } = await withRetry(() =>
    ProviderFactory.chatCompletion({ ...body, messages: currentMessages })
  );
  res.json(response);
}
