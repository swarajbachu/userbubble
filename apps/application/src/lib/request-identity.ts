/** Cross-origin SDK requests may carry explicit tokens, never ambient account cookies. */
export function transportIdentityHeaders(
  request: Request,
  applicationOrigin: string
): Headers {
  const headers = new Headers(request.headers);
  const origin = headers.get("origin");
  if (
    origin &&
    origin !== new URL(request.url).origin &&
    origin !== applicationOrigin
  ) {
    headers.delete("cookie");
  }
  return headers;
}
