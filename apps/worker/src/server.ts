import "dotenv/config";
import express from "express";
import { executeJob } from "./agent.js";
import { executeRepoAnalysis } from "./analyze-repo.js";

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

  console.log(`[worker] Received job ${jobId}`);
  res.json({ status: "accepted", jobId });

  executeJob(jobId)
    .then(() => console.log(`[worker] Job ${jobId} completed`))
    .catch((error) => {
      console.error(`[worker] Job ${jobId} failed:`, error);
    });
});

// Webhook endpoint for repo analysis
app.post("/analyze-repo", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!WEBHOOK_SECRET || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { organizationId } = req.body as { organizationId?: string };
  if (!organizationId) {
    res.status(400).json({ error: "organizationId is required" });
    return;
  }

  console.log(`[worker] Received repo analysis for org ${organizationId}`);
  res.json({ status: "accepted", organizationId });

  executeRepoAnalysis(organizationId)
    .then(() =>
      console.log(`[worker] Repo analysis completed for org ${organizationId}`)
    )
    .catch((error) => {
      console.error(
        `[worker] Repo analysis failed for org ${organizationId}:`,
        error
      );
    });
});

app.listen(PORT, () => {
  console.log(`Worker server listening on port ${PORT}`);
});
