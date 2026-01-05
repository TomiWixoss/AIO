import express from "express";
import dotenv from "dotenv";
import { logger } from "./utils/logger.js";
import { chatRouter } from "./routes/chat.js";
import { modelsRouter } from "./routes/models.js";
import { healthRouter } from "./routes/health.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(requestLogger);

// Routes
app.use("/health", healthRouter);
app.use("/v1/chat", chatRouter);
app.use("/v1/models", modelsRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`🚀 LLM Gateway running on port ${PORT}`);
  logger.info(
    `📚 Supported providers: OpenRouter, Google AI Studio, NVIDIA NIM, Mistral, Codestral, HuggingFace, Groq, Cerebras, Cohere, GitHub Models, Cloudflare Workers AI, Vertex AI`
  );
});

export default app;
