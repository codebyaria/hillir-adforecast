import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createApp } from "../../server/app.js";
import type { AuthConfig } from "../../server/lib/env.js";
import { InMemoryAuthRepository } from "../helpers/in-memory-auth-repository.js";
import { InMemoryCalculationRepository } from "../helpers/in-memory-calculation-repository.js";

const TEST_ORIGIN = "http://localhost:5173";
const TEST_PASSWORD = "password-kuat";

const testAuthConfig: AuthConfig = {
  jwtSecret: "calculation-test-secret-with-at-least-32-characters",
  appOrigin: TEST_ORIGIN,
  isProduction: false,
  passwordHashRounds: 4,
};

const referenceInput = {
  productPrice: 500_000,
  adSpend: 5_000_000,
  costPerResult: 100_000,
  averageOrderValue: 500_000,
};

describe("Calculation API", () => {
  let authRepository: InMemoryAuthRepository;
  let calculationRepository: InMemoryCalculationRepository;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    authRepository = new InMemoryAuthRepository();
    calculationRepository = new InMemoryCalculationRepository();
    app = createApp({
      checkDatabase: vi.fn().mockResolvedValue(undefined),
      authRepository,
      calculationRepository,
      authConfig: testAuthConfig,
    });
  });

  async function createAuthenticatedAgent(email: string) {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .set("Origin", TEST_ORIGIN)
      .send({ name: "Test User", email, password: TEST_PASSWORD });
    expect(registerResponse.status).toBe(201);

    const agent = request.agent(app);
    const loginResponse = await agent
      .post("/api/auth/login")
      .set("Origin", TEST_ORIGIN)
      .send({ email, password: TEST_PASSWORD });
    expect(loginResponse.status).toBe(200);

    return {
      agent,
      user: registerResponse.body.user as { id: string; email: string },
    };
  }

  it("menolak create dan history tanpa sesi", async () => {
    const createResponse = await request(app)
      .post("/api/calculations")
      .set("Origin", TEST_ORIGIN)
      .send(referenceInput);
    const historyResponse = await request(app).get("/api/calculations");

    expect(createResponse.status).toBe(401);
    expect(historyResponse.status).toBe(401);
  });

  it("mengabaikan userId dan output client lalu menghitung ulang di server", async () => {
    const { agent, user } = await createAuthenticatedAgent("aria@example.com");

    const response = await agent
      .post("/api/calculations")
      .set("Origin", TEST_ORIGIN)
      .send({
        ...referenceInput,
        userId: "id-user-lain",
        revenue: "999999999999.00",
        profitAfterAds: "999999999999.00",
        roiPercentage: "999999.0000",
        status: "profitable",
      });

    expect(response.status).toBe(201);
    expect(response.body.calculation).toMatchObject({
      productPrice: "500000.00",
      adSpend: "5000000.00",
      costPerResult: "100000.00",
      averageOrderValue: "500000.00",
      resultCount: "50.000000",
      revenue: "25000000.00",
      profitAfterAds: "20000000.00",
      roiPercentage: "400.0000",
      targetCpr: "150000.00",
      revenuePerResult: "500000.00",
      marginPerResult: "400000.00",
      status: "profitable",
      formulaVersion: "v1",
    });
    expect(response.body.calculation).not.toHaveProperty("userId");
    expect(calculationRepository.records).toHaveLength(1);
    expect(calculationRepository.records[0]?.userId).toBe(user.id);
    expect(calculationRepository.records[0]?.revenue).toBe("25000000.00");
  });

  it("memvalidasi input calculator dan query pagination", async () => {
    const { agent } = await createAuthenticatedAgent("aria@example.com");

    const invalidInput = await agent
      .post("/api/calculations")
      .set("Origin", TEST_ORIGIN)
      .send({ ...referenceInput, adSpend: 0 });
    const invalidPagination = await agent.get(
      "/api/calculations?page=0&limit=51",
    );

    expect(invalidInput.status).toBe(400);
    expect(invalidInput.body.error.code).toBe("VALIDATION_ERROR");
    expect(invalidPagination.status).toBe(400);
    expect(invalidPagination.body.error.code).toBe("VALIDATION_ERROR");
    expect(calculationRepository.records).toHaveLength(0);
  });

  it("mengisolasi history berdasarkan user dari JWT", async () => {
    const userA = await createAuthenticatedAgent("user-a@example.com");
    const userB = await createAuthenticatedAgent("user-b@example.com");

    await userA.agent
      .post("/api/calculations")
      .set("Origin", TEST_ORIGIN)
      .send(referenceInput);
    await userA.agent
      .post("/api/calculations")
      .set("Origin", TEST_ORIGIN)
      .send({ ...referenceInput, productPrice: 600_000 });
    await userB.agent
      .post("/api/calculations")
      .set("Origin", TEST_ORIGIN)
      .send({ ...referenceInput, productPrice: 700_000 });

    const historyA = await userA.agent.get("/api/calculations");
    const historyB = await userB.agent.get("/api/calculations");

    expect(historyA.status).toBe(200);
    expect(historyA.body.pagination.total).toBe(2);
    expect(historyA.body.data).toHaveLength(2);
    expect(historyA.body.data[0].productPrice).toBe("600000.00");
    expect(historyB.status).toBe(200);
    expect(historyB.body.pagination.total).toBe(1);
    expect(historyB.body.data).toHaveLength(1);
    expect(historyB.body.data[0].productPrice).toBe("700000.00");
    expect(historyA.body.data).not.toContainEqual(historyB.body.data[0]);
  });

  it("mengembalikan pagination terbaru lebih dahulu", async () => {
    const { agent } = await createAuthenticatedAgent("aria@example.com");

    for (let index = 0; index < 12; index += 1) {
      const response = await agent
        .post("/api/calculations")
        .set("Origin", TEST_ORIGIN)
        .send({ ...referenceInput, productPrice: 1_000 + index });
      expect(response.status).toBe(201);
    }

    const response = await agent.get("/api/calculations?page=2&limit=5");

    expect(response.status).toBe(200);
    expect(response.body.pagination).toEqual({
      page: 2,
      limit: 5,
      total: 12,
      totalPages: 3,
    });
    expect(response.body.data).toHaveLength(5);
    expect(response.body.data[0].productPrice).toBe("1006.00");
    expect(response.body.data[4].productPrice).toBe("1002.00");
  });

  it("mengembalikan metadata kosong yang konsisten", async () => {
    const { agent } = await createAuthenticatedAgent("aria@example.com");

    const response = await agent.get(
      "/api/calculations?path=calculations&__path=calculations",
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    });
  });
});
