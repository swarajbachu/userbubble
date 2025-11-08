import { eq } from "drizzle-orm";
import { db } from "../client";
import { type NewSession, type NewUser, session, user } from "./user.sql";

/**
 * User Queries
 */

export const userQueries = {
  /**
   * Find user by ID
   */
  findById: async (id: string) =>
    db.query.user.findFirst({
      where: eq(user.id, id),
    }),

  /**
   * Find user by email
   */
  findByEmail: async (email: string) =>
    db.query.user.findFirst({
      where: eq(user.email, email),
    }),

  /**
   * Create user
   */
  create: async (data: NewUser) => {
    const [created] = await db.insert(user).values(data).returning();
    return created;
  },

  /**
   * Update user
   */
  update: async (id: string, data: Partial<NewUser>) => {
    const [updated] = await db
      .update(user)
      .set(data)
      .where(eq(user.id, id))
      .returning();
    return updated;
  },

  /**
   * Delete user
   */
  delete: async (id: string) => {
    await db.delete(user).where(eq(user.id, id));
  },
};

/**
 * Session Queries
 */

export const sessionQueries = {
  /**
   * Find session by token
   */
  findByToken: async (token: string) =>
    db.query.session.findFirst({
      where: eq(session.token, token),
      with: {
        user: true,
      },
    }),

  /**
   * Find session by ID
   */
  findById: async (id: string) =>
    db.query.session.findFirst({
      where: eq(session.id, id),
    }),

  /**
   * Create session
   */
  create: async (data: NewSession) => {
    const [created] = await db.insert(session).values(data).returning();
    return created;
  },

  /**
   * Delete session
   */
  delete: async (id: string) => {
    await db.delete(session).where(eq(session.id, id));
  },

  /**
   * Delete expired sessions
   */
  deleteExpired: async () => {
    await db.delete(session).where(eq(session.expiresAt, new Date()));
  },
};
