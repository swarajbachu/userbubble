import { Suspense } from "react";

export default function AuthLayout(props: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      {props.children}
    </Suspense>
  );
}
