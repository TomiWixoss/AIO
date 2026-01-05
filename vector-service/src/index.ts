import express from "express";
import { config } from "./config/index.js";
import { collectionRoutes } from "./routes/collections.js";
import { documentRoutes } from "./routes/documents.js";
import { errorHandler } from "shared/error-handler";

const app = express();

app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/collections", collectionRoutes);
app.use("/documents", documentRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "vector-service" });
});

// Error handler
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`🔍 Vector Service running on port ${config.port}`);
  console.log(`📊 Embedding model: ${config.embeddingModel}`);
  console.log(`📐 Dimensions: ${config.embeddingDimensions}`);
});
