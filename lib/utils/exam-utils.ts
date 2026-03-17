/**
 * Shared utilities for exam operations
 * Reduces code duplication between admin and student exam pages
 */

import { createClient } from "@/lib/supabase/client";
import { CONFIG } from "@/lib/config/constants";

export interface ExamGradeData {
  score: number;
  feedback: string;
  passed: boolean;
}

/**
 * Grade a single answer using the grade API
 */
export async function gradeAnswer(
  question: string,
  rubric: string,
  answer: string,
): Promise<ExamGradeData | null> {
  try {
    const response = await fetch("/api/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, rubric, answer }),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error("Grade API error:", errData);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to grade answer:", error);
    return null;
  }
}

/**
 * Grade all answers for an exam
 */
export async function gradeAllAnswers(
  questions: Array<{ id: string; question_text: string; rubric: string }>,
  answers: Record<string, string>,
): Promise<Record<string, ExamGradeData> | null> {
  const results: Record<string, ExamGradeData> = {};

  for (const question of questions) {
    const grade = await gradeAnswer(
      question.question_text,
      question.rubric,
      answers[question.id] || "",
    );

    if (!grade) {
      console.error(`Failed to grade question ${question.id}`);
      return null;
    }

    results[question.id] = grade;
  }

  return results;
}

/**
 * Calculate average score from graded results
 */
export function calculateAverageScore(
  results: Record<string, ExamGradeData>,
): number {
  const scores = Object.values(results).map((r) => r.score);
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/**
 * Check if user has reached max exam attempts
 */
export function isExamLocked(attempts: number): boolean {
  return attempts >= CONFIG.MAX_EXAM_ATTEMPTS;
}

/**
 * Check if score is passing
 */
export function isPassing(score: number): boolean {
  return score >= CONFIG.PASSING_SCORE;
}

/**
 * Save exam result to database
 */
export async function saveExamResult(
  examId: string,
  userId: string | undefined,
  totalScore: number,
  answers: Array<{ question_id: string; answer_text: string; score: number; feedback: string }>,
): Promise<boolean> {
  if (!userId) return false;

  try {
    const supabase = createClient();
    const passed = isPassing(totalScore);

    // Insert answers
    for (const answer of answers) {
      await supabase.from("answers").insert({
        exam_id: examId,
        question_id: answer.question_id,
        user_id: userId,
        answer_text: answer.answer_text,
        ai_score: answer.score,
        ai_feedback: answer.feedback,
      });
    }

    // Insert exam result
    await supabase.from("exam_results").insert({
      exam_id: examId,
      user_id: userId,
      total_score: totalScore,
      passed,
    });

    return true;
  } catch (error) {
    console.error("Failed to save exam result:", error);
    return false;
  }
}
