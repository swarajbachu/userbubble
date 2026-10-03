import { openApiDocument } from "@userbubble/api/management";
export function GET(request: Request) {
  return Response.json(openApiDocument(new URL(request.url).origin));
}
