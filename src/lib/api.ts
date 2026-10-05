import type { LoginInput, PublicUser, RegisterInput } from "../../shared/auth";
import type {
  CalculationInput,
  FormulaVersion,
  ProfitabilityStatus,
} from "../../shared/types";

interface HealthResponse {
  status: "ok";
  services: { database: "ok" };
  responseTimeMs: number;
}

interface ErrorPayload {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string>;
    requestId?: string;
  };
}

interface UserResponse {
  user: PublicUser;
}

interface SessionResponse {
  user: PublicUser | null;
}

export interface CalculationRecord {
  id: string;
  productPrice: string;
  adSpend: string;
  costPerResult: string;
  averageOrderValue: string;
  resultCount: string;
  revenue: string;
  profitAfterAds: string;
  roiPercentage: string;
  targetCpr: string;
  revenuePerResult: string;
  marginPerResult: string;
  status: ProfitabilityStatus;
  formulaVersion: FormulaVersion;
  createdAt: string;
}

export interface CalculationHistoryResponse {
  data: CalculationRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function readError(response: Response) {
  let payload: ErrorPayload = {};
  try {
    payload = (await response.json()) as ErrorPayload;
  } catch {
    // Response non-JSON tetap diubah menjadi error publik yang konsisten.
  }

  return new ApiError(
    response.status,
    payload.error?.code ?? "REQUEST_FAILED",
    payload.error?.message ?? "Permintaan tidak dapat diproses.",
    payload.error?.fields,
    payload.error?.requestId,
  );
}

async function apiRequest<T>(path: string, init: RequestInit = {}) {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Tidak dapat terhubung ke server. Periksa koneksi Anda lalu coba lagi.",
    );
  }

  if (!response.ok) throw await readError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function getHealth(signal?: AbortSignal) {
  return apiRequest<HealthResponse>("/api/health", { signal });
}

export async function getCurrentUser(signal?: AbortSignal) {
  const response = await apiRequest<SessionResponse>("/api/auth/session", {
    signal,
  });
  return response.user;
}

export async function login(input: LoginInput) {
  const response = await apiRequest<UserResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.user;
}

export async function register(input: RegisterInput) {
  const response = await apiRequest<UserResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.user;
}

export function logout() {
  return apiRequest<void>("/api/auth/logout", { method: "POST" });
}

export async function createCalculation(input: CalculationInput) {
  const response = await apiRequest<{ calculation: CalculationRecord }>(
    "/api/calculations",
    { method: "POST", body: JSON.stringify(input) },
  );
  return response.calculation;
}

export function getCalculationHistory(
  page: number,
  limit = 10,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return apiRequest<CalculationHistoryResponse>(
    `/api/calculations?${query.toString()}`,
    { signal },
  );
}
