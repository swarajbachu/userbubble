import { apiKeyOperations } from "../application/api-key";
import { mutation, query } from "../operation-adapter";

export const apiKeyRouter = {
  list: query(apiKeyOperations.list),
  create: mutation(apiKeyOperations.create),
  update: mutation(apiKeyOperations.update),
  toggleActive: mutation(apiKeyOperations.toggleActive),
  delete: mutation(apiKeyOperations.delete),
};
