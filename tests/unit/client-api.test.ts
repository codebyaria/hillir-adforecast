import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createCalculation,
  getCalculationHistory,
  getCurrentUser,
  login,
  logout,
} from "../../src/lib/api";

describe("frontend API client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("membaca response sesi kosong tanpa menghasilkan network error", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(getCurrentUser()).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/session",
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });

  it("mempertahankan kontrak error API untuk feedback form", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: "INVALID_CREDENTIALS", message: "Email atau password salah.", requestId: "request-1" } }), { status: 401, headers: { "Content-Type": "application/json" } })));
    const request = login({ email: "aria@example.com", password: "password-kuat" });
    await expect(request).rejects.toMatchObject({ status: 401, code: "INVALID_CREDENTIALS", requestId: "request-1" });
  });

  it("mengirim cookie same-origin dan menangani response 204", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(logout()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", expect.objectContaining({ method: "POST", credentials: "same-origin" }));
  });

  it("menghasilkan pesan aman saat jaringan gagal", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("private detail")));
    await expect(getCurrentUser()).rejects.toEqual(
      expect.objectContaining({ code: "NETWORK_ERROR", status: 0 }),
    );
  });

  it("mengirim hanya input calculator ke endpoint penyimpanan", async () => {
    const calculation = { id: "calculation-1", revenue: "25000000.00" };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ calculation }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const input = {
      productPrice: 500_000,
      adSpend: 5_000_000,
      costPerResult: 100_000,
      averageOrderValue: 500_000,
    };

    await expect(createCalculation(input)).resolves.toEqual(calculation);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/calculations",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
  });

  it("membentuk query pagination history secara eksplisit", async () => {
    const payload = {
      data: [],
      pagination: { page: 2, limit: 6, total: 0, totalPages: 0 },
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCalculationHistory(2, 6)).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/calculations?page=2&limit=6",
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });
});
