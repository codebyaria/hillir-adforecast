import { z } from "zod";

const authEnvironmentSchema = z.object({
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET minimal 32 karakter agar aman digunakan."),
  APP_ORIGIN: z.string().url("APP_ORIGIN harus berupa URL yang valid."),
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
});

export interface AuthConfig {
  jwtSecret: string;
  appOrigin: string;
  isProduction: boolean;
  passwordHashRounds: number;
}

export function readAuthConfig(): AuthConfig {
  const environment = authEnvironmentSchema.parse(process.env);

  return {
    jwtSecret: environment.JWT_SECRET,
    appOrigin: new URL(environment.APP_ORIGIN).origin,
    isProduction:
      environment.NODE_ENV === "production" ||
      environment.VERCEL_ENV === "production",
    passwordHashRounds: 12,
  };
}
