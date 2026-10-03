import { ApplicationError, serverReads } from "@userbubble/api/management";
import { cache } from "react";
import { getApplicationContext } from "./application-context";

export const getFeedbackThread = cache(
  async (organizationId: string, postId: string) => {
    try {
      return await serverReads.feedbackThread(
        await getApplicationContext(),
        organizationId,
        postId
      );
    } catch (error) {
      if (
        error instanceof ApplicationError &&
        ["NOT_FOUND", "FORBIDDEN"].includes(error.code)
      ) {
        return;
      }
      throw error;
    }
  }
);
