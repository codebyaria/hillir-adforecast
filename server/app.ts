import crypto from "node:crypto";

import express, { type Express } from "express";

import { checkDatabaseConnection } from "./db/client.js";
import { createSessionTokenManager } from "./lib/auth.js";
import { type AuthConfig, readAuthConfig } from "./lib/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { createVerifyOrigin } from "./middleware/verify-origin.js";
import {
  type AuthRepository,
  drizzleAuthRepository,
} from "./repositories/auth.repository.js";
import {
  type CalculationRepository,
  drizzleCalculationRepository,
} from "./repositories/calculation.repository.js";
import { createAuthRouter } from "./routes/auth.routes.js";
import { createCalculationRouter } from "./routes/calculation.routes.js";
import { createHealthRouter } from "./routes/health.routes.js";
import { AuthService } from "./services/auth.service.js";
import { CalculationService } from "./services/calculation.service.js";

export interface AppDependencies {
  checkDatabase?: () => Promise<void>;
  authRepository?: AuthRepository;
  calculationRepository?: CalculationRepository;
  authConfig?: AuthConfig;
}

export function createApp(dependencies: AppDependencies = {}) {
  return configureApp(express(), dependencies);
}

export function configureApp(
  app: Express,
  dependencies: AppDependencies = {},
) {
  const authConfig = dependencies.authConfig ?? readAuthConfig();
  const authRepository = dependencies.authRepository ?? drizzleAuthRepository;
  const calculationRepository =
    dependencies.calculationRepository ?? drizzleCalculationRepository;
  const authService = new AuthService(
    authRepository,
    createSessionTokenManager(authConfig.jwtSecret),
    authConfig,
  );
  const calculationService = new CalculationService(calculationRepository);

  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));
  app.use((request, response, next) => {
    const requestId = request.header("x-request-id") ?? crypto.randomUUID();
    response.setHeader("x-request-id", requestId);
    response.locals.requestId = requestId;
    next();
  });
  app.use("/api", (_request, response, next) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Pragma", "no-cache");
    next();
  });

  app.use("/api", createVerifyOrigin(authConfig.appOrigin));
  app.use(
    "/api",
    createHealthRouter(dependencies.checkDatabase ?? checkDatabaseConnection),
  );
  app.use("/api", createAuthRouter(authService, authConfig));
  app.use(
    "/api",
    createCalculationRouter(authService, calculationService),
  );

  app.use("/api", (_request, response) => {
    response.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "Endpoint tidak ditemukan.",
      },
    });
  });

  app.use(errorHandler);

  return app;
}
