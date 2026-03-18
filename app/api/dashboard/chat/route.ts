import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { CONFIG } from "../../../../lib/config/constants";
import {
  createRateLimiter,
  getClientIdentifier,
} from "../../../../lib/utils/rate-limit";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const rateLimiter = createRateLimiter(10 * 60 * 1000, 5); // 5 submissions per 10 mins

export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  if (!rateLimiter(clientId)) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi nanti." },
      { status: 429 },
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { examId, answers } = body;

    if (!examId || !answers) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 },
      );
    }

    // 1. Fetch Questions and Exam Title securely from Server
    const { data: examData, error: examError } = await supabase
      .from("exams")
      .select("title, questions(id, question_text, rubric)")
      .eq("id", examId)
      .single();

    if (examError || !examData || !examData.questions) {
      return NextResponse.json(
        { error: "Soal atau ujian tidak ditemukan" },
        { status: 404 },
      );
    }

    const { questions } = examData;

    // 2. Grade all answers in parallel
    const gradingPromises = questions.map(
      async (q: { id: string; question_text: string; rubric: string }) => {
        const studentAnswer = answers[q.id] || "";
        const prompt = `Kamu adalah penilai ujian. Nilai jawaban berdasarkan rubrik.
Soal: ${q.question_text}
Rubrik: ${q.rubric}
Jawaban: ${studentAnswer}

Output JSON saja: { "score": <0-100>, "feedback": "<feedback singkat>" }`;

        try {
          const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            max_tokens: 256,
            messages: [{ role: "user", content: prompt }],
          });
          const text = response.choices[0]?.message?.content || "";
          const clean = text.replace(/```json|```/g, "").trim();
          const result = JSON.parse(clean);
          return {
            question_id: q.id,
            answer_text: studentAnswer,
            score: result.score || 0,
            feedback: result.feedback || "Tidak ada feedback.",
          };
        } catch {
          return {
            question_id: q.id,
            answer_text: studentAnswer,
            score: 0,
            feedback: "Gagal menilai otomatis.",
          };
        }
      },
    );

    const gradedResults = await Promise.all(gradingPromises);

    // 3. Calculate Final Score
    const totalScore = Math.round(
      gradedResults.reduce(
        (acc: number, curr: { score: number }) => acc + curr.score,
        0,
      ) / questions.length,
    );
    const passed = totalScore >= CONFIG.PASSING_SCORE;

    // 4. Save to Database
    await supabase.from("exam_results").insert({
      exam_id: examId,
      user_id: user.id,
      total_score: totalScore,
      passed: passed,
    });

    const answersToInsert = gradedResults.map(
      (r: {
        question_id: string;
        answer_text: string;
        score: number;
        feedback: string;
      }) => ({
        exam_id: examId,
        user_id: user.id,
        question_id: r.question_id,
        answer_text: r.answer_text,
        ai_score: r.score,
        ai_feedback: r.feedback,
      }),
    );
    await supabase.from("answers").insert(answersToInsert);

    // 5. Send Email Notification
    if (user.email) {
      // TODO: Implement email notification if needed
    }
    const resultsByQuestionId: Record<
      string,
      {
        question_id: string;
        answer_text: string;
        score: number;
        feedback: string;
      }
    > = {};
    gradedResults.forEach(
      (r: {
        question_id: string;
        answer_text: string;
        score: number;
        feedback: string;
      }) => {
        resultsByQuestionId[r.question_id] = r;
      },
    );

    return NextResponse.json({
      totalScore,
      passed,
      results: resultsByQuestionId,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
