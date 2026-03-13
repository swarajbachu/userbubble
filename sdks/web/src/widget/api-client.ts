type ApiResponse<T> =
  | { data: T }
  | { error: { code: string; message: string } };

type FeedbackPost = {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  voteCount: number;
  createdAt: string;
  author: { name: string; image: string | null };
  hasUserVoted: boolean;
};

type ChangelogEntry = {
  id: string;
  title: string;
  description: string;
  version: string | null;
  coverImageUrl: string | null;
  tags: string[] | null;
  publishedAt: string | null;
  author: { name: string; image: string | null } | null;
};

type ChangelogDetail = ChangelogEntry & {
  linkedFeedback: Array<{
    id: string;
    title: string;
    status: string;
    category: string;
    voteCount: number;
  }>;
};

export class WidgetApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly getAuthToken: () => string | null;

  constructor(
    baseUrl: string,
    apiKey: string,
    getAuthToken: () => string | null
  ) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.getAuthToken = getAuthToken;
  }

  async getFeedback(
    sortBy?: "votes" | "recent",
    status?: string,
    category?: string
  ): Promise<ApiResponse<FeedbackPost[]>> {
    const params = new URLSearchParams();
    if (sortBy) {
      params.set("sortBy", sortBy);
    }
    if (status) {
      params.set("status", status);
    }
    if (category) {
      params.set("category", category);
    }
    return this.request<FeedbackPost[]>(
      `/api/v1/feedback?${params.toString()}`,
      { includeAuth: true }
    );
  }

  async submitFeedback(body: {
    title: string;
    description: string;
    category?: string;
  }): Promise<ApiResponse<FeedbackPost>> {
    return this.request<FeedbackPost>("/api/v1/feedback", {
      method: "POST",
      body,
      includeAuth: true,
    });
  }

  async voteFeedback(
    postId: string,
    value: number
  ): Promise<ApiResponse<{ success: true }>> {
    return this.request<{ success: true }>("/api/v1/feedback/vote", {
      method: "POST",
      body: { postId, value },
      includeAuth: true,
    });
  }

  async getChangelog(
    limit?: number,
    offset?: number
  ): Promise<ApiResponse<ChangelogEntry[]>> {
    const params = new URLSearchParams();
    if (limit) {
      params.set("limit", String(limit));
    }
    if (offset) {
      params.set("offset", String(offset));
    }
    return this.request<ChangelogEntry[]>(
      `/api/v1/changelog?${params.toString()}`
    );
  }

  async getChangelogEntry(id: string): Promise<ApiResponse<ChangelogDetail>> {
    return this.request<ChangelogDetail>(`/api/v1/changelog/${id}`);
  }

  private async request<T>(
    path: string,
    options?: {
      method?: string;
      body?: unknown;
      includeAuth?: boolean;
    }
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      "X-API-Key": this.apiKey,
      "Content-Type": "application/json",
    };

    if (options?.includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: options?.method ?? "GET",
        headers,
        body: options?.body ? JSON.stringify(options.body) : undefined,
      });

      return (await response.json()) as ApiResponse<T>;
    } catch {
      return { error: { code: "NETWORK_ERROR", message: "Network error" } };
    }
  }
}
