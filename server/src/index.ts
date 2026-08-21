import express from "express";
import cors from "cors";
import { env } from "./lib/env.js";
import { authRouter } from "./routes/auth.js";
import { cpdRouter } from "./routes/cpd.js";
import { coursesRouter } from "./routes/courses.js";
import { recordRouter } from "./routes/record.js";
import { adminRouter } from "./routes/admin.js";
import { providerRouter } from "./routes/provider.js";

const app = express();

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "capacityspot-api" });
});

app.use("/api/auth", authRouter);
app.use("/api/cpd", cpdRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/record", recordRouter);
app.use("/api/admin", adminRouter);
app.use("/api/provider", providerRouter);

// Fallback JSON 404 for unknown API routes.
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`CapacitySpot API listening on http://localhost:${env.port}`);
});
