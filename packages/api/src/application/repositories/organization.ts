import { Context, type Effect, type Schema } from "effect";
import type {
  OnboardingInput,
  OrganizationCreateInput,
  OrganizationUpdateInput,
} from "../../contracts/inputs";
import type {
  Invitation,
  Invitations,
  Organization,
  Organizations,
} from "../../contracts/outputs";
import type { ApplicationError } from "../errors";

type Result<A> = Effect.Effect<A, ApplicationError>;
type OrganizationData = Schema.Schema.Type<typeof Organization>;
type InvitationData = Schema.Schema.Type<typeof Invitation>;
type OrganizationPatch = Omit<
  Schema.Schema.Type<typeof OrganizationUpdateInput>,
  "organizationId"
> &
  Pick<Partial<OrganizationData>, "onboarding" | "metadata">;
export class OrganizationRepository extends Context.Service<
  OrganizationRepository,
  {
    delete: (id: string) => Result<void>;
    list: (userId: string) => Result<Schema.Schema.Type<typeof Organizations>>;
    bySlug: (slug: string) => Result<OrganizationData | undefined>;
    find: (id: string) => Result<OrganizationData | undefined>;
    slugAvailable: (slug: string) => Result<boolean>;
    create: (
      input: Schema.Schema.Type<typeof OrganizationCreateInput>,
      userId: string
    ) => Result<OrganizationData>;
    patchOnboarding: (
      id: string,
      steps: Schema.Schema.Type<typeof OnboardingInput>["steps"]
    ) => Result<OrganizationData | undefined>;
    update: (
      id: string,
      patch: OrganizationPatch,
      expectedSettingsRevision?: number
    ) => Result<OrganizationData | undefined>;
    invitations: (
      organizationId: string
    ) => Result<Schema.Schema.Type<typeof Invitations>>;
    pendingInvitation: (
      email: string,
      organizationId: string
    ) => Result<InvitationData | undefined>;
    invitation: (id: string) => Result<InvitationData | undefined>;
    createInvitation: (
      input: Pick<
        InvitationData,
        | "organizationId"
        | "inviterId"
        | "email"
        | "role"
        | "status"
        | "expiresAt"
      >
    ) => Result<InvitationData | undefined>;
    cancelInvitation: (
      id: string,
      organizationId: string
    ) => Result<InvitationData | undefined>;
  }
>()("userbubble/OrganizationRepository") {}
