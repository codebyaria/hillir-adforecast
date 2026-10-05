import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createApp } from "../../server/app.js";
import type { AuthConfig } from "../../server/lib/env.js";
import { InMemoryAuthRepository } from "../helpers/in-memory-auth-repository.js";

const TEST_ORIGIN = "http://localhost:5173";
const TEST_PASSWORD = "password-kuat";

const testAuthConfig: AuthConfig = {
  jwtSecret: "integration-test-secret-with-at-least-32-characters",
  appOrigin: TEST_ORIGIN,
  isProduction: false,
  passwordHashRounds: 4,
};

describe("Auth API", () => {
  let repository: InMemoryAuthRepository;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    repository = new InMemoryAuthRepository();
    app = createApp({
      checkDatabase: vi.fn().mockResolvedValue(undefined),
      authRepository: repository,
      authConfig: testAuthConfig,
    });
  });

  async function register(email = "Aria@Example.com") {
    return request(app)
      .post("/api/auth/register")
      .set("Origin", TEST_ORIGIN)
      .send({
        name: "  Aria Nurhadi  ",
        email,
        password: TEST_PASSWORD,
      });
  }

  it("register berhasil, menormalisasi input, dan tidak menyimpan password mentah", async () => {
    const response = await register();

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      name: "Aria Nurhadi",
      email: "aria@example.com",
    });
    expect(response.body.user).not.toHaveProperty("password");
    expect(response.body.user).not.toHaveProperty("passwordHash");

    const storedUser = await repository.findUserByEmail("aria@example.com");
    expect(storedUser?.passwordHash).not.toBe(TEST_PASSWORD);
    expect(await bcrypt.compare(TEST_PASSWORD, storedUser!.passwordHash)).toBe(
      true,
    );
    expect(bcrypt.getRounds(storedUser!.passwordHash)).toBe(4);
  });

  it("menolak email duplikat tanpa membedakan kapitalisasi", async () => {
    expect((await register()).status).toBe(201);

    const response = await register("aria@example.com");

    expect(response.status).toBe(409);
    expect(response.body.error).toMatchObject({
      code: "EMAIL_ALREADY_EXISTS",
      message: "Email sudah terdaftar.",
    });
  });

  it("menolak password yang melewati batas 72 byte bcrypt", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .set("Origin", TEST_ORIGIN)
      .send({
        name: "Aria",
        email: "aria@example.com",
        password: "🔐".repeat(19),
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({
      code: "VALIDATION_ERROR",
      fields: {
        password: "Password maksimal 72 byte UTF-8.",
      },
    });
  });

  it("mengembalikan error 400 yang konsisten untuk JSON rusak", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .set("Origin", TEST_ORIGIN)
      .set("Content-Type", "application/json")
      .send('{"name":"Aria"');

    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({
      code: "INVALID_JSON",
      message: "Format JSON tidak valid.",
    });
  });

  it("menolak payload di atas 32 KB dengan error publik", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .set("Origin", TEST_ORIGIN)
      .set("Content-Type", "application/json")
      .send({
        name: "A".repeat(33_000),
        email: "aria@example.com",
        password: TEST_PASSWORD,
      });

    expect(response.status).toBe(413);
    expect(response.body.error).toMatchObject({
      code: "PAYLOAD_TOO_LARGE",
      message: "Ukuran request terlalu besar.",
    });
    expect(response.body.error.requestId).toBeTruthy();
  });

  it("login valid membuat HttpOnly cookie dan /auth/me memulihkan user", async () => {
    await register();
    const agent = request.agent(app);

    const loginResponse = await agent
      .post("/api/auth/login")
      .set("Origin", TEST_ORIGIN)
      .send({ email: "ARIA@example.com", password: TEST_PASSWORD });

    expect(loginResponse.status).toBe(200);
    const setCookie = String(loginResponse.headers["set-cookie"] ?? "");
    expect(setCookie).toContain("hillir_session=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
    expect(setCookie).not.toContain("Secure");

    const meResponse = await agent.get("/api/auth/me");

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user).toMatchObject({
      name: "Aria Nurhadi",
      email: "aria@example.com",
    });

    const sessionResponse = await agent.get("/api/auth/session");
    expect(sessionResponse.status).toBe(200);
    expect(sessionResponse.body.user).toMatchObject({
      name: "Aria Nurhadi",
      email: "aria@example.com",
    });
  });

  it("session check tanpa cookie mengembalikan user null tanpa error 401", async () => {
    const response = await request(app).get("/api/auth/session");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ user: null });
  });

  it("login salah dan email tidak terdaftar memberi response generik yang sama", async () => {
    await register();

    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .set("Origin", TEST_ORIGIN)
      .send({ email: "aria@example.com", password: "password-salah" });
    const missingEmail = await request(app)
      .post("/api/auth/login")
      .set("Origin", TEST_ORIGIN)
      .send({ email: "tidakada@example.com", password: "password-salah" });

    expect(wrongPassword.status).toBe(401);
    expect(missingEmail.status).toBe(401);
    expect(wrongPassword.body.error.code).toBe("INVALID_CREDENTIALS");
    expect(missingEmail.body.error.code).toBe("INVALID_CREDENTIALS");
    expect(wrongPassword.body.error.message).toBe(
      missingEmail.body.error.message,
    );
  });

  it("logout idempotent menghapus cookie dan membuat sesi tidak dapat dipakai", async () => {
    await register();
    const agent = request.agent(app);

    await agent
      .post("/api/auth/login")
      .set("Origin", TEST_ORIGIN)
      .send({ email: "aria@example.com", password: TEST_PASSWORD });

    const logoutResponse = await agent
      .post("/api/auth/logout")
      .set("Origin", TEST_ORIGIN);

    expect(logoutResponse.status).toBe(204);
    expect(String(logoutResponse.headers["set-cookie"] ?? "")).toContain(
      "hillir_session=;",
    );
    expect((await agent.get("/api/auth/me")).status).toBe(401);

    const secondLogout = await agent
      .post("/api/auth/logout")
      .set("Origin", TEST_ORIGIN);
    expect(secondLogout.status).toBe(204);
  });

  it("menolak state-changing request dari origin lain", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .set("Origin", "https://attacker.example")
      .set("Sec-Fetch-Site", "cross-site")
      .send({
        name: "Aria",
        email: "aria@example.com",
        password: TEST_PASSWORD,
      });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("ORIGIN_NOT_ALLOWED");
    expect(await repository.findUserByEmail("aria@example.com")).toBeUndefined();
  });

  it("menolak cookie JWT yang dimodifikasi", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", "hillir_session=token-yang-tidak-valid");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });
});
