import type { RequestHandler } from "express";

import { HttpError } from "../lib/http-error.js";

const READ_ONLY_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function requestOriginFromHeaders(
  protocolHeader: string | undefined,
  host: string | undefined,
) {
  if (!host) {
    return undefined;
  }

  const protocol = protocolHeader?.split(",")[0]?.trim() || "http";

  try {
    return new URL(`${protocol}://${host}`).origin;
  } catch {
    return undefined;
  }
}

export function createVerifyOrigin(appOrigin: string): RequestHandler {
  const configuredOrigin = new URL(appOrigin).origin;

  return (request, _response, next) => {
    if (READ_ONLY_METHODS.has(request.method)) {
      next();
      return;
    }

    const originHeader = request.header("origin");
    const fetchSite = request.header("sec-fetch-site");

    if (!originHeader && fetchSite !== "cross-site") {
      next();
      return;
    }

    const currentRequestOrigin = requestOriginFromHeaders(
      request.header("x-forwarded-proto"),
      request.header("host"),
    );

    let requestOrigin: string | undefined;

    try {
      requestOrigin = originHeader
        ? new URL(originHeader).origin
        : undefined;
    } catch {
      requestOrigin = undefined;
    }

    if (
      fetchSite !== "cross-site" &&
      requestOrigin &&
      (requestOrigin === configuredOrigin ||
        requestOrigin === currentRequestOrigin)
    ) {
      next();
      return;
    }

    next(
      new HttpError(
        403,
        "ORIGIN_NOT_ALLOWED",
        "Origin request tidak diizinkan.",
      ),
    );
  };
}
