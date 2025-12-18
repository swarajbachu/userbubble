import { ErrorDisplay } from "./error-display";

export function Forbidden() {
  return <ErrorDisplay type="403" />;
}
