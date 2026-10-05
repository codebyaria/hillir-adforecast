import { Router } from "express";

import {
  loginInputSchema,
  registerInputSchema,
} from "../../shared/auth.js";
import type { AuthConfig } from "../lib/env.js";
import {
  clearedSessionCookieOptions,
  readCookie,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "../lib/cookies.js";
import { createAuthenticate } from "../middleware/authenticate.js";
import type { AuthService } from "../services/auth.service.js";

export function createAuthRouter(
  authService: AuthService,
  config: Pick<AuthConfig, "isProduction">,
) {
  const router = Router();
  const authenticate = createAuthenticate(authService);

  router.post("/auth/register", async (request, response) => {
    const input = registerInputSchema.parse(request.body);
    const user = await authService.register(input);

    response.status(201).json({ user });
  });

  router.post("/auth/login", async (request, response) => {
    const input = loginInputSchema.parse(request.body);
    const { user, token } = await authService.login(input);

    response.cookie(
      SESSION_COOKIE_NAME,
      token,
      sessionCookieOptions(config.isProduction),
    );
    response.status(200).json({ user });
  });

  router.post("/auth/logout", (_request, response) => {
    response.clearCookie(
      SESSION_COOKIE_NAME,
      clearedSessionCookieOptions(config.isProduction),
    );
    response.status(204).send();
  });

  router.get("/auth/me", authenticate, (_request, response) => {
    response.status(200).json({
      user: response.locals.authenticatedUser,
    });
  });

  router.get("/auth/session", async (request, response) => {
    const token = readCookie(request.headers.cookie, SESSION_COOKIE_NAME);
    const user = await authService.findUserFromSession(token);
    response.status(200).json({ user });
  });

  return router;
}
