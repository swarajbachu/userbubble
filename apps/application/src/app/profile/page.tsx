import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "~/auth/server";
import { getQueryClient, trpc } from "~/trpc/server";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: "Your profile",
  robots: { index: false, follow: false },
};
export default async function ProfilePage() {
  const session = await getSession();
  if (!session || session.session.sessionType === "identified") {
    redirect("/sign-in");
  }
  const profile = await getQueryClient().fetchQuery(
    trpc.account.getProfile.queryOptions({})
  );
  return <ProfileForm profile={profile} />;
}
