import { z } from "zod";
import { invitationStatuses, roles } from "./organization.sql";

export const roleValidator = z.enum(roles);
export const invitationStatusValidator = z.enum(invitationStatuses);
