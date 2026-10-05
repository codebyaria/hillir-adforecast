import { SignJWT, jwtVerify } from "jose";

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface SessionTokenManager {
  sign(userId: string): Promise<string>;
  verify(token: string): Promise<string | null>;
}

export function createSessionTokenManager(secret: string): SessionTokenManager {
  const signingKey = new TextEncoder().encode(secret);

  return {
    async sign(userId) {
      return new SignJWT({})
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setSubject(userId)
        .setIssuedAt()
        .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
        .sign(signingKey);
    },

    async verify(token) {
      try {
        const { payload } = await jwtVerify(token, signingKey, {
          algorithms: ["HS256"],
        });

        return typeof payload.sub === "string" ? payload.sub : null;
      } catch {
        return null;
      }
    },
  };
}
