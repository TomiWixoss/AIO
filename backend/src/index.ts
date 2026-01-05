import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import { authRoutes } from "./routes/auth.js";
import { adminRoutes } from "./routes/admins.js";
import { providerRoutes } from "./routes/providers.js";
import { providerKeyRoutes } from "./routes/provider-keys.js";
import { modelRoutes } from "./routes/models.js";
import { chatRoutes } from "./routes/chat.js";
import { statsRoutes } from "./routes/stats.js";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/admins", adminRoutes);
app.use("/providers", providerRoutes);
app.use("/provider-keys", providerKeyRoutes);
app.use("/models", modelRoutes);
app.use("/chat", chatRoutes);
app.use("/stats", statsRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: config.services.database,
      gateway: config.services.gateway,
    },
  });
});

app.listen(config.port, () => {
  console.log(`🚀 Backend running on port ${config.port}`);
  console.log(`📡 Database Service: ${config.services.database}`);
  console.log(`🤖 LLM Gateway: ${config.services.gateway}`);
});

export default app;
