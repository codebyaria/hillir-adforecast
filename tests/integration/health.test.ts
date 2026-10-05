import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { createApp } from "../../server/app.js";

describe("GET /api/health", () => {
  it("mengembalikan 200 ketika database dapat dijangkau", async () => {
    const checkDatabase = vi.fn().mockResolvedValue(undefined);
    const app = createApp({ checkDatabase });

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "ok",
      services: {
        database: "ok",
      },
    });
    expect(response.headers["x-request-id"]).toBeTruthy();
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.headers.pragma).toBe("no-cache");
    expect(checkDatabase).toHaveBeenCalledOnce();
  });

  it("mengembalikan 503 tanpa membocorkan detail koneksi", async () => {
    const checkDatabase = vi
      .fn()
      .mockRejectedValue(new Error("postgresql://secret@example.test/database"));
    const app = createApp({ checkDatabase });

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      status: "degraded",
      services: {
        database: "unavailable",
      },
    });
    expect(JSON.stringify(response.body)).not.toContain("postgresql://");
  });

  it("mengembalikan format error konsisten untuk endpoint API yang tidak ada", async () => {
    const app = createApp({ checkDatabase: vi.fn() });

    const response = await request(app).get("/api/tidak-ada");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Endpoint tidak ditemukan.",
      },
    });
  });
});
