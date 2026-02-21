import { createContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { UserbubbleSDK } from "../core/sdk";
import type { UserbubbleState, UserbubbleWebConfig } from "../core/types";

export type UserbubbleContextValue = UserbubbleState & {
  sdk: UserbubbleSDK;
};

export const UserbubbleContext = createContext<UserbubbleContextValue | null>(
  null
);

export type UserbubbleProviderProps = {
  config: UserbubbleWebConfig;
  children: React.ReactNode;
};

export function UserbubbleProvider({
  config,
  children,
}: UserbubbleProviderProps) {
  const sdk = useMemo(() => UserbubbleSDK.getInstance(), []);

  useEffect(() => {
    sdk.init(config);
    return () => {
      sdk.destroy();
    };
  }, [sdk, config]);

  const state = useSyncExternalStore(
    (cb) => sdk.subscribe(cb),
    () => sdk.getState(),
    () => sdk.getState()
  );

  const value = useMemo<UserbubbleContextValue>(
    () => ({ ...state, sdk }),
    [state, sdk]
  );

  return (
    <UserbubbleContext.Provider value={value}>
      {children}
    </UserbubbleContext.Provider>
  );
}
