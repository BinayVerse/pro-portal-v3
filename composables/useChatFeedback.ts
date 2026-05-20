import { ref } from "vue";
import { useAuthStore } from "~/stores/auth";
import { useErrorStore } from "~/stores/error";

export interface FeedbackPayload {
  org_id: string;
  user_id: string;
  channel: string;
  message_id?: string;
  question_text?: string;
  answer_text?: string;
  feedback: "helpful" | "not_helpful";
  reason?: string;
  comment?: string;
  retrieved_context?: any;
  reframed_question?: string;
}

export const useChatFeedback = () => {
  const auth = useAuthStore();
  const errorStore = useErrorStore();
  const isSubmitting = ref(false);

  const submitFeedback = async (
    payload: Omit<FeedbackPayload, "org_id" | "user_id">
  ) => {
    isSubmitting.value = true;
    try {
      if (!auth.user?.org_id || !auth.user?.user_id) {
        throw new Error("User not authenticated");
      }

      const fullPayload: FeedbackPayload = {
        ...payload,
        org_id: auth.user.org_id,
        user_id: auth.user.user_id,
      };

      const response = await $fetch("/api/chat/feedback", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        body: fullPayload,
      });

      return response;
    } catch (error: any) {
      logError("Failed to submit feedback:", error);
      errorStore.showError(error?.message || "Failed to submit feedback");
      throw error;
    } finally {
      isSubmitting.value = false;
    }
  };

  return {
    submitFeedback,
    isSubmitting,
  };
};
