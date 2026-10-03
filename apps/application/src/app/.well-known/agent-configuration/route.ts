import { auth } from "~/auth/server";
export async function GET() {
  return Response.json(await auth.api.getAgentConfiguration());
}
