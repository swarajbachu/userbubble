import { settingsOperations } from "../application/settings";
import { mutation, query } from "../operation-adapter";

export const settingsRouter = {
  getMyRole: query(settingsOperations.getMyRole),
  updateSettings: mutation(settingsOperations.updateSettings),
  listMembers: query(settingsOperations.listMembers),
  updateMemberRole: mutation(settingsOperations.updateMemberRole),
  removeMember: mutation(settingsOperations.removeMember),
  deleteOrganization: mutation(settingsOperations.deleteOrganization),
};
