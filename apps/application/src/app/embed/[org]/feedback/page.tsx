import { getPublicOrganization } from "~/lib/get-organization";
import { EmbedFeedbackForm } from "./_components/embed-feedback-form";

type EmbedFeedbackPageProps = {
  params: Promise<{ org: string }>;
};

export default async function EmbedFeedbackPage({
  params,
}: EmbedFeedbackPageProps) {
  const { org } = await params;
  const organization = await getPublicOrganization(org);

  return <EmbedFeedbackForm organizationId={organization.id} />;
}
