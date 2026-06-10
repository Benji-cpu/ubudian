import { z } from "zod";

// Contract for POST /api/quiz/submit. Must accept exactly what
// quiz-container.tsx sends: `answers` is the ordered array shape that is
// also persisted in quiz_results.answers (see QuizResultRecord), and
// `user_segment` is null when the taker skipped the router question.
export const quizSubmitSchema = z.object({
  primary_archetype: z.string().min(1).max(100),
  secondary_archetype: z.string().max(100).nullable().optional(),
  scores: z.record(z.string(), z.number()),
  answers: z
    .array(
      z.object({
        question_id: z.number().int(),
        answer_id: z.string().max(100),
      })
    )
    .max(20),
  email: z.string().email().optional().or(z.literal("")),
  user_segment: z.enum(["curious", "visiting", "local"]).nullable().optional(),
});

export type QuizSubmitPayload = z.infer<typeof quizSubmitSchema>;
