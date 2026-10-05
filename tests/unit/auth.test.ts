import { describe, expect, it } from "vitest";

import {
  createSessionTokenManager,
  SESSION_TTL_SECONDS,
} from "../../server/lib/auth.js";
import {
  clearedSessionCookieOptions,
  sessionCookieOptions,
} from "../../server/lib/cookies.js";

describe("auth primitives", () => {
  it("menandatangani dan memverifikasi subject JWT", async () => {
    const tokenManager = createSessionTokenManager(
      "unit-test-secret-with-at-least-32-characters",
    );

    const token = await tokenManager.sign("user-id-123");

    expect(await tokenManager.verify(token)).toBe("user-id-123");
    expect(await tokenManager.verify(`${token}rusak`)).toBeNull();
  });

  it("menggunakan cookie production yang aman selama tujuh hari", () => {
    expect(sessionCookieOptions(true)).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS * 1_000,
    });
    expect(clearedSessionCookieOptions(true)).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });
  });
});
