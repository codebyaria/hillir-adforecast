import type { CookieOptions } from "express";

import { SESSION_TTL_SECONDS } from "./auth.js";

export const SESSION_COOKIE_NAME = "hillir_session";

export function sessionCookieOptions(isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS * 1_000,
  };
}

export function clearedSessionCookieOptions(
  isProduction: boolean,
): CookieOptions {
  const { maxAge: _maxAge, ...options } = sessionCookieOptions(isProduction);

  return options;
}

export function readCookie(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) {
    return undefined;
  }

  for (const item of cookieHeader.split(";")) {
    const separatorIndex = item.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = item.slice(0, separatorIndex).trim();

    if (key !== name) {
      continue;
    }

    try {
      return decodeURIComponent(item.slice(separatorIndex + 1).trim());
    } catch {
      return undefined;
    }
  }

  return undefined;
}
