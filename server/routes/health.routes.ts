import { Router } from "express";

export function createHealthRouter(checkDatabase: () => Promise<void>) {
  const router = Router();

  router.get("/health", async (_request, response) => {
    const startedAt = performance.now();

    try {
      await checkDatabase();

      response.status(200).json({
        status: "ok",
        services: {
          database: "ok",
        },
        responseTimeMs: Math.round(performance.now() - startedAt),
      });
    } catch (error) {
      const requestId = String(response.locals.requestId ?? "unknown");
      const errorName = error instanceof Error ? error.name : "UnknownError";

      console.error("Database health check failed", { requestId, errorName });

      response.status(503).json({
        status: "degraded",
        services: {
          database: "unavailable",
        },
        requestId,
      });
    }
  });

  return router;
}
