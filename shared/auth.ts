import { z } from "zod";

export const PASSWORD_MAX_BYTES = 72;

function hasSupportedPasswordLength(value: string) {
  return new TextEncoder().encode(value).byteLength <= PASSWORD_MAX_BYTES;
}

const emailSchema = z
  .string()
  .trim()
  .max(320, "Email maksimal 320 karakter.")
  .email("Format email tidak valid.")
  .transform((value) => value.toLowerCase());

export const registerInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nama minimal 2 karakter.")
      .max(100, "Nama maksimal 100 karakter."),
    email: emailSchema,
    password: z
      .string()
      .min(8, "Password minimal 8 karakter.")
      .refine(hasSupportedPasswordLength, {
        message: "Password maksimal 72 byte UTF-8.",
      }),
  })
  .strict();

export const loginInputSchema = z
  .object({
    email: emailSchema,
    password: z
      .string()
      .min(1, "Password wajib diisi.")
      .refine(hasSupportedPasswordLength, {
        message: "Password maksimal 72 byte UTF-8.",
      }),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}
