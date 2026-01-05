import express from "express";
import { config } from "./config/index.js";
import { logger } from "./utils/logger.js";
import { chatRouter } from "./routes/chat.js";
import { modelsRouter } from "./routes/models.js";
import { healthRouter } from "./routes/health.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { rateLimitMiddleware } from "./middleware/rateLimit.js";
import { authMiddleware } from "./middleware/auth.js";
import { ProviderFactory } from "./providers/factory.js";

const app = express();

// Middleware
app.use(express.json());
app.use(requestLogger);

// Public routes
app.use("/health", healthRouter);

// Protected routes with auth and rate limiting
app.use("/v1", authMiddleware, rateLimitMiddleware);
app.use("/v1/chat", chatRouter);
app.use("/v1/models", modelsRouter);

// Error handler
app.use(errorHandler);

app.listen(config.port, () => {
  const availableProviders = ProviderFactory.getAllProviders();
  logger.info(`🚀 LLM Gateway running on port ${config.port}`);
  logger.info(
    `🔐 Authentication: ${config.auth.enabled ? "enabled" : "disabled"}`
  );
  logger.info(
    `📚 Available providers (${
      availableProviders.length
    }): ${availableProviders.join(", ")}`
  );
});

export default app;
