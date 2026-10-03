import { Effect } from "effect";
import {
  EmptyInput,
  OrganizationInput,
  PublicIndexInput,
} from "../contracts/inputs";
import { publicProcedure } from "./procedure";
import { PublicIndexRepository } from "./repositories/public-index";

export const publicIndexOperations = {
  organizations: publicProcedure
    .effectInput(EmptyInput)
    .query(() =>
      Effect.flatMap(PublicIndexRepository, (repository) =>
        repository.organizations()
      )
    ),
  counts: publicProcedure
    .effectInput(OrganizationInput)
    .query(({ input }) =>
      Effect.flatMap(PublicIndexRepository, (repository) =>
        repository.counts(input.organizationId)
      )
    ),
  items: publicProcedure
    .effectInput(PublicIndexInput)
    .query(({ input }) =>
      Effect.flatMap(PublicIndexRepository, (repository) =>
        repository.items(input.organizationId, input.kind, input.page)
      )
    ),
};
