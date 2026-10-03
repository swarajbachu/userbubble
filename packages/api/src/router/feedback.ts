import { feedbackOperations } from "../application/feedback";
import { mutation, query } from "../operation-adapter";

export const feedbackRouter = {
  search: query(feedbackOperations.search),
  getAll: query(feedbackOperations.getAll),
  getById: query(feedbackOperations.getById),
  create: mutation(feedbackOperations.create),
  update: mutation(feedbackOperations.update),
  delete: mutation(feedbackOperations.delete),
  vote: mutation(feedbackOperations.vote),
  updateStatus: mutation(feedbackOperations.updateStatus),
  getComments: query(feedbackOperations.getComments),
  createComment: mutation(feedbackOperations.createComment),
  deleteComment: mutation(feedbackOperations.deleteComment),
};
