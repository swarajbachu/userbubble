import { changelogOperations } from "../application/changelog";
import { mutation, query } from "../operation-adapter";

export const changelogRouter = {
  getAll: query(changelogOperations.getAll),
  getById: query(changelogOperations.getById),
  create: mutation(changelogOperations.create),
  update: mutation(changelogOperations.update),
  publish: mutation(changelogOperations.publish),
  delete: mutation(changelogOperations.delete),
  linkFeedback: mutation(changelogOperations.linkFeedback),
  unlinkFeedback: mutation(changelogOperations.unlinkFeedback),
};
