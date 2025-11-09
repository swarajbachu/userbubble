import { desc, eq } from "@critichut/db";
import { CreatePostSchema, Post } from "@critichut/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { protectedProcedure, publicProcedure } from "../trpc";

export const postRouter = {
  all: publicProcedure.query(({ ctx }) =>
    ctx.db.query.Post.findMany({
      orderBy: desc(Post.id),
      limit: 10,
    })
  ),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) =>
      ctx.db.query.Post.findFirst({
        where: eq(Post.id, input.id),
      })
    ),

  create: protectedProcedure
    .input(CreatePostSchema)
    .mutation(({ ctx, input }) => ctx.db.insert(Post).values(input)),

  delete: protectedProcedure
    .input(z.string())
    .mutation(({ ctx, input }) =>
      ctx.db.delete(Post).where(eq(Post.id, input))
    ),
} satisfies TRPCRouterRecord;
