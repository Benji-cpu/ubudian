import { describe, expect, it } from "vitest";
import { quizSubmitSchema } from "@/lib/quiz/submit-schema";

// Regression lock for the client/server contract. quiz-container.tsx
// builds exactly these payloads — if this test fails, every quiz
// submission silently 400s (no quiz_results row, no Beehiiv subscriber,
// no spread email). That bug shipped once already; don't let it back in.

const clientPayload = {
  primary_archetype: "seeker",
  secondary_archetype: "connector",
  scores: { seeker: 12, explorer: 3, creative: 4, connector: 7, epicurean: 2 },
  answers: [
    { question_id: 1, answer_id: "a" },
    { question_id: 2, answer_id: "c" },
    { question_id: 3, answer_id: "b" },
    { question_id: 4, answer_id: "a" },
    { question_id: 5, answer_id: "d" },
  ],
};

describe("quizSubmitSchema", () => {
  it("accepts the exact payload the quiz container sends with an email", () => {
    const result = quizSubmitSchema.safeParse({
      ...clientPayload,
      email: "taker@example.com",
      user_segment: "visiting",
    });
    expect(result.success).toBe(true);
  });

  it("accepts user_segment: null (router question skipped)", () => {
    const result = quizSubmitSchema.safeParse({
      ...clientPayload,
      email: undefined,
      user_segment: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty-string email (skip path)", () => {
    const result = quizSubmitSchema.safeParse({
      ...clientPayload,
      email: "",
      user_segment: "local",
    });
    expect(result.success).toBe(true);
  });

  it("accepts answers as the ordered array shape that is persisted", () => {
    const result = quizSubmitSchema.safeParse(clientPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.answers).toEqual(clientPayload.answers);
    }
  });

  it("rejects a record-shaped answers object (the old broken contract)", () => {
    const result = quizSubmitSchema.safeParse({
      ...clientPayload,
      answers: { "1": "a", "2": "c" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = quizSubmitSchema.safeParse({
      ...clientPayload,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown user_segment", () => {
    const result = quizSubmitSchema.safeParse({
      ...clientPayload,
      user_segment: "alien",
    });
    expect(result.success).toBe(false);
  });

  it("rejects oversized answer arrays", () => {
    const result = quizSubmitSchema.safeParse({
      ...clientPayload,
      answers: Array.from({ length: 21 }, (_, i) => ({
        question_id: i,
        answer_id: "a",
      })),
    });
    expect(result.success).toBe(false);
  });
});
