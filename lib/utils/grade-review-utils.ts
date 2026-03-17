/**
 * Teacher grade review system utilities
 * Allows teachers to review and override AI grading
 */

import { createClient } from "@/lib/supabase/client";

export interface StudentAnswer {
  id: string;
  exam_id: string;
  question_id: string;
  user_id: string;
  answer_text: string;
  ai_score: number;
  ai_feedback: string;
  teacher_score?: number;
  teacher_feedback?: string;
  is_reviewed: boolean;
  created_at: string;
  user_email?: string;
  user_name?: string;
  question_text?: string;
}

export interface GradeReview {
  answer_id: string;
  teacher_score: number;
  teacher_feedback: string;
}

/**
 * Fetch all unreviewed answers for an exam
 */
export async function fetchUnreviewedAnswers(
  examId: string,
): Promise<StudentAnswer[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("answers")
      .select(
        `
        *,
        profiles:user_id(email, full_name),
        questions:question_id(question_text)
      `,
      )
      .eq("exam_id", examId)
      .eq("is_reviewed", false);

    if (!data) return [];

    return data.map((answer) => ({
      ...answer,
      user_email: (answer.profiles as any)?.email,
      user_name: (answer.profiles as any)?.full_name,
      question_text: (answer.questions as any)?.question_text,
    }));
  } catch (error) {
    console.error("Failed to fetch unreviewed answers:", error);
    return [];
  }
}

/**
 * Fetch all answers for an exam (reviewed and unreviewed)
 */
export async function fetchAnswersForExam(
  examId: string,
): Promise<StudentAnswer[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("answers")
      .select(
        `
        *,
        profiles:user_id(email, full_name),
        questions:question_id(question_text)
      `,
      )
      .eq("exam_id", examId);

    if (!data) return [];

    return data.map((answer) => ({
      ...answer,
      user_email: (answer.profiles as any)?.email,
      user_name: (answer.profiles as any)?.full_name,
      question_text: (answer.questions as any)?.question_text,
    }));
  } catch (error) {
    console.error("Failed to fetch exam answers:", error);
    return [];
  }
}

/**
 * Fetch answers for a specific student
 */
export async function fetchStudentAnswers(
  userId: string,
  examId: string,
): Promise<StudentAnswer[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("answers")
      .select(
        `
        *,
        questions:question_id(question_text)
      `,
      )
      .eq("user_id", userId)
      .eq("exam_id", examId);

    if (!data) return [];

    return data.map((answer) => ({
      ...answer,
      question_text: (answer.questions as any)?.question_text,
    }));
  } catch (error) {
    console.error("Failed to fetch student answers:", error);
    return [];
  }
}

/**
 * Submit teacher grade review
 */
export async function submitGradeReview(
  answerId: string,
  teacherScore: number,
  teacherFeedback: string,
): Promise<boolean> {
  try {
    if (teacherScore < 0 || teacherScore > 100) {
      console.error("Score must be between 0 and 100");
      return false;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("answers")
      .update({
        teacher_score: teacherScore,
        teacher_feedback: teacherFeedback,
        is_reviewed: true,
      })
      .eq("id", answerId);

    if (error) {
      console.error("Failed to save grade review:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error submitting grade review:", error);
    return false;
  }
}

/**
 * Get final score (teacher override or AI score)
 */
export function getFinalScore(answer: StudentAnswer): number {
  return answer.teacher_score ?? answer.ai_score;
}

/**
 * Get final feedback (teacher override or AI feedback)
 */
export function getFinalFeedback(answer: StudentAnswer): string {
  return answer.teacher_feedback ?? answer.ai_feedback;
}

/**
 * Calculate average score for student in exam
 * Uses teacher scores if available, otherwise AI scores
 */
export function calculateStudentExamScore(answers: StudentAnswer[]): number {
  if (answers.length === 0) return 0;

  const scores = answers.map((a) => getFinalScore(a));
  const average = Math.round(
    scores.reduce((a, b) => a + b, 0) / scores.length,
  );

  return average;
}

/**
 * Get statistics on review status for an exam
 */
export function getReviewStats(answers: StudentAnswer[]): {
  total: number;
  reviewed: number;
  pending: number;
  percentReviewed: number;
} {
  const reviewed = answers.filter((a) => a.is_reviewed).length;
  const pending = answers.length - reviewed;

  return {
    total: answers.length,
    reviewed,
    pending,
    percentReviewed: answers.length > 0 ? Math.round((reviewed / answers.length) * 100) : 0,
  };
}
