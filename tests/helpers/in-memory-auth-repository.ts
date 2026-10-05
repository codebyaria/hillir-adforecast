import crypto from "node:crypto";

import type {
  AuthRepository,
  NewStoredUser,
  StoredUser,
} from "../../server/repositories/auth.repository.js";

export class InMemoryAuthRepository implements AuthRepository {
  private readonly users: StoredUser[] = [];

  async createUser(input: NewStoredUser) {
    const user: StoredUser = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    this.users.push(user);
    return user;
  }

  async findUserByEmail(email: string) {
    return this.users.find((user) => user.email === email);
  }

  async findUserById(id: string) {
    return this.users.find((user) => user.id === id);
  }
}
