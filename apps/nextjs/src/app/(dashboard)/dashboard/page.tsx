import { redirect } from "next/navigation";
import { auth } from "~/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/sign-in");
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <div className="mb-8">
        <h1 className="mb-2 font-bold text-4xl">Dashboard</h1>
        <p className="text-lg text-muted-foreground">
          Manage your organizations and feedback
        </p>
      </div>

      {/* Organizations list */}
      <div className="rounded-lg border p-8">
        <h2 className="mb-4 font-semibold text-2xl">Your Organizations</h2>
        <div className="text-muted-foreground">
          <p>
            No organizations yet. Create your first organization to get started!
          </p>
          {/* TODO: Add organization creation and list */}
        </div>
      </div>

      {/* User info */}
      <div className="mt-8 rounded-lg border p-6">
        <h2 className="mb-4 font-semibold text-xl">Account</h2>
        <div className="space-y-2">
          <p className="text-sm">
            <span className="text-muted-foreground">Name:</span>{" "}
            <span className="font-medium">{session.user.name}</span>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Email:</span>{" "}
            <span className="font-medium">{session.user.email}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
