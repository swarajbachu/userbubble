import { Effect, Result } from "effect";
import { describe, expect, it, vi } from "vitest";
import { ApplicationError } from "../packages/api/src/application/errors";
import { identifyCustomer } from "../packages/api/src/application/identification";
import { IdentificationRepository } from "../packages/api/src/application/repositories/identification";

function fixture(valid = true) {
  const upsert = vi.fn((input) => Effect.succeed(input));
  const touchKey = vi.fn(() => Effect.void);
  const repository = {
    validateKey: vi.fn(() =>
      Effect.succeed(
        valid
          ? {
              keyId: "installation",
              organizationId: "tenant",
              organizationSlug: "public-board",
            }
          : null
      )
    ),
    upsert,
    touchKey,
  };
  const run = (input: unknown) =>
    Effect.runPromise(
      identifyCustomer("key", input).pipe(
        Effect.provideService(IdentificationRepository, repository),
        Effect.result
      )
    );
  return { run, repository };
}
describe("SDK identification Effect", () => {
  it("derives the tenant from the installation key and returns no management identity", async () => {
    const { run, repository } = fixture();
    const result = await run({
      id: "customer",
      email: "person@example.com",
      organizationId: "foreign",
    });
    expect(Result.isSuccess(result) && result.success).toEqual({
      success: true,
      user: {
        id: "customer",
        email: "person@example.com",
        name: "person",
        avatar: null,
      },
      organizationSlug: "public-board",
    });
    expect(repository.upsert).toHaveBeenCalledWith({
      organizationId: "tenant",
      externalId: "customer",
      email: "person@example.com",
      name: "person",
      avatar: null,
    });
    expect(repository.touchKey).toHaveBeenCalledWith("installation");
  });
  it("rejects revoked or expired installation keys before persisting a customer", async () => {
    const { run, repository } = fixture(false);
    const result = await run({ id: "customer", email: "person@example.com" });
    expect(Result.isFailure(result) && result.failure.code).toBe(
      "UNAUTHORIZED"
    );
    expect(repository.upsert).not.toHaveBeenCalled();
  });
  it("rejects invalid input before accessing credentials", async () => {
    const { run, repository } = fixture();
    const result = await run({ id: "", email: "invalid" });
    expect(Result.isFailure(result) && result.failure.code).toBe("BAD_REQUEST");
    expect(repository.validateKey).not.toHaveBeenCalled();
  });
  it("preserves successful identification if last-used telemetry fails", async () => {
    const { run, repository } = fixture();
    repository.touchKey.mockImplementation(() =>
      Effect.fail(new ApplicationError({ code: "INTERNAL_SERVER_ERROR" }))
    );
    expect(
      Result.isSuccess(
        await run({ id: "customer", email: "person@example.com" })
      )
    ).toBe(true);
  });
});
