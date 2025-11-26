import { nanoid } from "nanoid";
import { z } from "zod";

export const UniqueIdsSchema = z.enum([
  "user",
  "org",
  "member",
  "invite",
  "post",
  "vote",
  "comment",
]);

export type UniqueIdsType = z.infer<typeof UniqueIdsSchema>;

export function createUniqueIds(id: UniqueIdsType): string {
  return `${id}_${nanoid(11)}`;
}
