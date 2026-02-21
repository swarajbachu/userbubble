import "dotenv/config";
import express from "express";
import { executeJob } from "./agent.js";

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 8080;
const WEBHOOK_SECRET = process.env.MODAL_WEBHOOK_SECRET;

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Webhook endpoint for triggering PR generation
app.post("/generate-pr", async (req, res) => {
  // Verify auth
  const authHeader = req.headers.authorization;
  if (!WEBHOOK_SECRET || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { jobId } = req.body as { jobId?: string };
  if (!jobId) {
    res.status(400).json({ error: "jobId is required" });
    return;
  }

  // Return immediately, process async
  res.json({ status: "accepted", jobId });

  // Execute job in background
  executeJob(jobId).catch((error) => {
    console.error(`Job ${jobId} failed:`, error);
  });
});

app.listen(PORT, () => {
  console.log(`Worker server listening on port ${PORT}`);
});
