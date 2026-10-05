import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { HttpError } from "../lib/http-error.js";

function zodFields(error: ZodError) {
  return Object.fromEntries(
    error.issues.map((issue) => [issue.path.join(".") || "request", issue.message]),
  );
}

function isInvalidJsonError(error: unknown) {
  return (
    error instanceof SyntaxError &&
    "status" in error &&
    error.status === 400 &&
    "type" in error &&
    error.type === "entity.parse.failed"
  );
}

function isPayloadTooLargeError(error: unknown) {
  return (
    error instanceof Error &&
    "status" in error &&
    error.status === 413 &&
    "type" in error &&
    error.type === "entity.too.large"
  );
}

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  const requestId = String(response.locals.requestId ?? "unknown");

  if (isInvalidJsonError(error)) {
    response.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "Format JSON tidak valid.",
        requestId,
      },
    });
    return;
  }

  if (isPayloadTooLargeError(error)) {
    response.status(413).json({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Ukuran request terlalu besar.",
        requestId,
      },
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Data yang dikirim tidak valid.",
        fields: zodFields(error),
        requestId,
      },
    });
    return;
  }

  if (error instanceof HttpError) {
    response.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
        requestId,
      },
    });
    return;
  }

  const errorName = error instanceof Error ? error.name : "UnknownError";

  console.error("Unhandled API error", { requestId, errorName });

  response.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Terjadi kesalahan internal.",
      requestId,
    },
  });
};
