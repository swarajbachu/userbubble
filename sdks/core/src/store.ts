import type { StateListener, UserbubbleState } from "./types";

const INITIAL_STATE: UserbubbleState = {
  isInitialized: false,
  isIdentified: false,
  user: null,
  organizationSlug: null,
  externalId: null,
  authToken: null,
};

export function createStore(initial?: Partial<UserbubbleState>) {
  let state: UserbubbleState = { ...INITIAL_STATE, ...initial };
  const listeners = new Set<StateListener>();

  return {
    getSnapshot(): UserbubbleState {
      return state;
    },

    setState(partial: Partial<UserbubbleState>): void {
      state = { ...state, ...partial };
      for (const listener of listeners) {
        listener();
      }
    },

    subscribe(listener: StateListener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    reset(): void {
      state = { ...INITIAL_STATE };
      for (const listener of listeners) {
        listener();
      }
    },
  };
}
