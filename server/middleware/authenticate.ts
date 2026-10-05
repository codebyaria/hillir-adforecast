import type { RequestHandler } from "express";

import type { AuthService } from "../services/auth.service.js";
import { readCookie, SESSION_COOKIE_NAME } from "../lib/cookies.js";

export function createAuthenticate(authService: AuthService): RequestHandler {
  return async (request, response, next) => {
    try {
      const token = readCookie(request.headers.cookie, SESSION_COOKIE_NAME);
      response.locals.authenticatedUser =
        await authService.getUserFromSession(token);
      next();
    } catch (error) {
      next(error);
    }
  };
}
