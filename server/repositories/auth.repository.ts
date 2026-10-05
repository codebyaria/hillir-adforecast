import { eq } from "drizzle-orm";

import { getDatabase } from "../db/client.js";
import { users } from "../db/schema.js";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface NewStoredUser {
  name: string;
  email: string;
  passwordHash: string;
}

export interface AuthRepository {
  createUser(input: NewStoredUser): Promise<StoredUser>;
  findUserByEmail(email: string): Promise<StoredUser | undefined>;
  findUserById(id: string): Promise<StoredUser | undefined>;
}

const userSelection = {
  id: users.id,
  name: users.name,
  email: users.email,
  passwordHash: users.passwordHash,
  createdAt: users.createdAt,
};

export const drizzleAuthRepository: AuthRepository = {
  async createUser(input) {
    const [user] = await getDatabase()
      .insert(users)
      .values(input)
      .returning(userSelection);

    if (!user) {
      throw new Error("User gagal dibuat.");
    }

    return user;
  },

  async findUserByEmail(email) {
    const [user] = await getDatabase()
      .select(userSelection)
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user;
  },

  async findUserById(id) {
    const [user] = await getDatabase()
      .select(userSelection)
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user;
  },
};
