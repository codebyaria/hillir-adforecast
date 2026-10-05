import bcrypt from "bcryptjs";

import type {
  LoginInput,
  PublicUser,
  RegisterInput,
} from "../../shared/auth.js";
import type { AuthConfig } from "../lib/env.js";
import { HttpError } from "../lib/http-error.js";
import type { SessionTokenManager } from "../lib/auth.js";
import type {
  AuthRepository,
  StoredUser,
} from "../repositories/auth.repository.js";

const INVALID_LOGIN_PASSWORD_HASH =
  "$2b$12$YgpJu.uNy7kaYw7iWRzA1elvxtW4EfpQXDlpC01mpxDzs.m1LZSEi";

function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

function isUniqueConstraintViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly tokenManager: SessionTokenManager,
    private readonly config: Pick<AuthConfig, "passwordHashRounds">,
  ) {}

  async register(input: RegisterInput): Promise<PublicUser> {
    const existingUser = await this.repository.findUserByEmail(input.email);

    if (existingUser) {
      throw new HttpError(
        409,
        "EMAIL_ALREADY_EXISTS",
        "Email sudah terdaftar.",
      );
    }

    const passwordHash = await bcrypt.hash(
      input.password,
      this.config.passwordHashRounds,
    );

    try {
      const user = await this.repository.createUser({
        name: input.name,
        email: input.email,
        passwordHash,
      });

      return toPublicUser(user);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new HttpError(
          409,
          "EMAIL_ALREADY_EXISTS",
          "Email sudah terdaftar.",
        );
      }

      throw error;
    }
  }

  async login(input: LoginInput) {
    const user = await this.repository.findUserByEmail(input.email);
    const passwordHash = user?.passwordHash ?? INVALID_LOGIN_PASSWORD_HASH;
    const passwordIsValid = await bcrypt.compare(input.password, passwordHash);

    if (!user || !passwordIsValid) {
      throw new HttpError(
        401,
        "INVALID_CREDENTIALS",
        "Email atau password tidak valid.",
      );
    }

    return {
      user: toPublicUser(user),
      token: await this.tokenManager.sign(user.id),
    };
  }

  async getUserFromSession(token: string | undefined) {
    const user = await this.findUserFromSession(token);
    if (!user) {
      throw new HttpError(401, "UNAUTHORIZED", "Sesi tidak valid.");
    }
    return user;
  }

  async findUserFromSession(token: string | undefined) {
    if (!token) return null;
    const userId = await this.tokenManager.verify(token);
    if (!userId) return null;
    const user = await this.repository.findUserById(userId);
    return user ? toPublicUser(user) : null;
  }
}
