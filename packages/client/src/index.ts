import type {
  OperationId,
  OperationInput,
  OperationOutput,
  OperationTypes,
} from "./operations.js";

export type {
  OperationId,
  OperationInput,
  OperationOutput,
  OperationTypes,
} from "./operations.js";
export type AgentOperationInput<K extends OperationId> = OperationInput<K> & {
  organizationId: string;
  idempotencyKey?: OperationTypes[K]["supportsIdempotency"] extends true
    ? string
    : never;
};

import {
  AgentAuthClient,
  type AgentAuthClientOptions,
  type CapabilityRequestItem,
} from "@auth/agent";

export type { AgentAuthClientOptions } from "@auth/agent";
export {
  AgentAuthClient,
  getAgentAuthTools,
  KVStorage,
  MemoryStorage,
} from "@auth/agent";

export type OperationDescription = {
  id: string;
  description: string;
  requiredPermissions: string[];
  access: string;
  readOnly: boolean;
  supportsIdempotency: boolean;
  destructive: boolean;
  inputSchema: Record<string, unknown>;
  agentInputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown> | null;
  responseSchema: Record<string, unknown> | null;
};
const RETRY_SECONDS = /^\d+(?:\.\d+)?$/;
export class UserBubbleTransportError extends Error {
  readonly code: "rate_limited" | "transient_failure";
  readonly status: number;
  readonly retryAfterSeconds: number | undefined;
  constructor(response: Response) {
    super(
      response.status === 429
        ? "Request rate limit exceeded"
        : "Service temporarily unavailable"
    );
    this.name = "UserBubbleTransportError";
    this.code = response.status === 429 ? "rate_limited" : "transient_failure";
    this.status = response.status;
    const header =
      response.headers.get("retry-after") ??
      response.headers.get("x-retry-after");
    let seconds = Number.NaN;
    if (header !== null) {
      seconds = RETRY_SECONDS.test(header)
        ? Number(header)
        : (Date.parse(header) - Date.now()) / 1000;
    }
    this.retryAfterSeconds = Number.isFinite(seconds)
      ? Math.max(0, Math.ceil(seconds))
      : undefined;
  }
}
export class UserBubbleClient {
  readonly agent: AgentAuthClient;
  readonly baseUrl: string;
  private readonly fetch: typeof globalThis.fetch;
  constructor(baseUrl: string, options: AgentAuthClientOptions = {}) {
    const url = new URL(baseUrl);
    if (
      url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname)
      )
    ) {
      throw new Error("Use HTTPS for remote UserBubble instances");
    }
    this.baseUrl = url.origin;
    const fetcher = options.fetch ?? globalThis.fetch;
    this.fetch = async (input, init) => {
      const response = await fetcher(input, init);
      if ([429, 502, 503, 504].includes(response.status)) {
        const error = new UserBubbleTransportError(response);
        await response.body?.cancel();
        throw error;
      }
      return response;
    };
    this.agent = new AgentAuthClient({
      ...options,
      fetch: this.fetch,
      urls: [this.baseUrl],
    });
  }
  async capabilities(): Promise<OperationDescription[]> {
    const response = await this.fetch(`${this.baseUrl}/api/v2/capabilities`);
    if (!response.ok) {
      throw new Error(`Capability discovery failed (${response.status})`);
    }
    return ((await response.json()) as { capabilities: OperationDescription[] })
      .capabilities;
  }
  async connect(organizationId: string, capabilities: string[]) {
    const provider = await this.agent.discoverProvider(this.baseUrl);
    const requested: CapabilityRequestItem[] = capabilities.map(
      (capability) => ({
        name: capability,
        constraints: { organizationId: { eq: organizationId } },
      })
    );
    return this.agent.connectAgent({
      provider: provider.issuer,
      mode: "delegated",
      name: "UserBubble CLI",
      capabilities: requested,
      preferredMethod: "device_authorization",
    });
  }
  /** Typed synchronous product operation. Dates are ISO strings on the wire. */
  async call<K extends OperationId>(
    agentId: string,
    operation: K,
    input: AgentOperationInput<K>
  ): Promise<OperationOutput<K>> {
    const result = await this.execute(agentId, operation, { ...input });
    if (!("data" in result)) {
      throw new Error("Expected a synchronous UserBubble operation result");
    }
    return result.data as OperationOutput<K>;
  }

  /** Fetch one page at a time; callers can stop iteration without loading the rest. */
  async *feedbackPages(
    agentId: string,
    input: AgentOperationInput<"feedback.search">
  ): AsyncGenerator<OperationOutput<"feedback.search">> {
    let cursor = input.cursor;
    const seen = new Set<string>();
    if (cursor) {
      seen.add(JSON.stringify(cursor));
    }
    while (true) {
      const page = await this.call(agentId, "feedback.search", {
        ...input,
        cursor,
      });
      yield page;
      if (!page.nextCursor) {
        return;
      }
      const key = JSON.stringify(page.nextCursor);
      if (seen.has(key)) {
        throw new Error("The server returned a repeated feedback cursor");
      }
      seen.add(key);
      cursor = page.nextCursor;
    }
  }

  async execute(
    agentId: string,
    operation: string,
    input: Record<string, unknown>
  ) {
    await this.agent.init();
    return this.agent.executeCapability({
      agentId,
      capability: operation,
      arguments: input,
    });
  }
}
