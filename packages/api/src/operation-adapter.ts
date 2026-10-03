import { TRPCError } from "@trpc/server";
import { ApplicationError } from "./application/errors";
import type { Operation } from "./application/procedure";
import { executeOperation } from "./application/runtime";
import { publicProcedure } from "./trpc";

const adapt = async <I, O>(
  operation: Operation<I, O>,
  ctx: Parameters<typeof executeOperation<I, O>>[1],
  input: unknown
) => {
  try {
    return await executeOperation(operation, ctx, input);
  } catch (error) {
    if (error instanceof ApplicationError) {
      throw new TRPCError({ code: error.code, message: error.message });
    }
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  }
};
export const query = <I, O>(operation: Operation<I, O>) =>
  publicProcedure
    .input(operation.input)
    .query(({ ctx, input }) => adapt(operation, ctx, input));
export const mutation = <I, O>(operation: Operation<I, O>) =>
  publicProcedure
    .input(operation.input)
    .mutation(({ ctx, input }) => adapt(operation, ctx, input));
