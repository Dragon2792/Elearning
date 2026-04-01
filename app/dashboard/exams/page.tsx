"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CONFIG } from "@/lib/config/constants";
import styles from "./exams.module.css";

interface Exam {
  id: string;
  title: string;
  description: string;
  topic: string;
  questions: { count: number }[];
}

interface Question {
  id: string;
  question_text: string;
  order_number: number;
  rubric: string;
}

interface GradeResult {
  score: number;
  feedback: string;
  passed: boolean;
}

interface ExamResultData {
  [examId: string]: {
    total_score: number;
    passed: boolean;
    attempts: number;
  };
}

export default function ExamPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [completedExams, setCompletedExams] = useState<ExamResultData>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [grading, setGrading] = useState(false);
  const [results, setResults] = useState<Record<string, GradeResult>>({});
  const [submitted, setSubmitted] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data } = await supabase
        .from("exams")
        .select("*, questions(count)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (data) setExams(data);

      // Fetch exam results for current user
      if (user) {
        const { data: results } = await supabase
          .from("exam_results")
          .select("exam_id, total_score, passed")
          .eq("user_id", user.id);

        if (results) {
          const resultMap: ExamResultData = {};
          results.forEach((result) => {
            if (!resultMap[result.exam_id]) {
              resultMap[result.exam_id] = {
                total_score: result.total_score,
                passed: result.passed,
                attempts: 0,
              };
            }
            resultMap[result.exam_id].attempts += 1;
          });
          setCompletedExams(resultMap);
        }
      }

      setLoading(false);
    };
    fetchExams();
  }, []);

  const selectExam = async (exam: Exam) => {
    // Check if exam already completed
    if (completedExams[exam.id]) {
      const attempts = completedExams[exam.id].attempts;

      if (attempts >= CONFIG.MAX_EXAM_ATTEMPTS) {
        alert(
          `Ujian "${exam.title}" sudah selesai.\n\nAnda tidak bisa mengerjakan ujian ini lagi.`,
        );
        return;
      }

      const confirmRetake = window.confirm(
        `Ujian "${exam.title}" sudah diselesaikan dengan skor ${completedExams[exam.id].total_score}/100.\n\nAnda hanya bisa mengerjakan ulang 1 kali. Apakah Anda ingin melanjutkan?`,
      );
      if (!confirmRetake) return;
    }

    setSelectedExam(exam);
    setSubmitted(false);
    setResults({});
    setAnswers({});
    const supabase = createClient();
    const { data } = await supabase
      .from("questions")
      .select("*")
      .eq("exam_id", exam.id)
      .order("order_number");
    if (data) setQuestions(data);
  };

  const handleSubmit = async () => {
    const unanswered = questions.filter((q) => !answers[q.id]?.trim());
    if (unanswered.length > 0) {
      alert(
        `Soal nomor ${unanswered.map((q) => q.order_number).join(", ")} belum dijawab!`,
      );
      return;
    }

    setGrading(true);
    const supabase = createClient();
    await supabase.auth.getUser();

    try {
      // Submit all answers to the secure server API
      const res = await fetch("/api/dashboard/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: selectedExam!.id,
          answers: answers,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengumpulkan ujian");
      }

      const normalizedResults: Record<string, GradeResult> = {};
      if (Array.isArray(data.results)) {
        data.results.forEach(
          (r: {
            question_id?: string;
            score?: number;
            feedback?: string;
            passed?: boolean;
          }) => {
            if (r.question_id) {
              normalizedResults[r.question_id] = {
                score: r.score ?? 0,
                feedback: r.feedback ?? "Tidak ada feedback.",
                passed: r.passed ?? false,
              };
            }
          },
        );
      } else if (data.results && typeof data.results === "object") {
        Object.keys(data.results).forEach((key) => {
          const r = data.results[key] as {
            score?: number;
            feedback?: string;
            passed?: boolean;
          };
          normalizedResults[key] = {
            score: r.score ?? 0,
            feedback: r.feedback ?? "Tidak ada feedback.",
            passed: r.passed ?? false,
          };
        });
      }

      setResults(normalizedResults);
      setTotalScore(data.totalScore);
      setSubmitted(true);

      // Optimistically update the completed exams state to reflect the new attempt
      if (selectedExam) {
        setCompletedExams((prev) => {
          const newAttempts = (prev[selectedExam.id]?.attempts || 0) + 1;
          return {
            ...prev,
            [selectedExam.id]: {
              total_score: data.totalScore,
              passed: data.passed,
              attempts: newAttempts,
            },
          };
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        alert("Terjadi kesalahan: " + error.message);
      } else {
        alert("Terjadi kesalahan yang tidak diketahui.");
      }
    } finally {
      setGrading(false);
    }
  };

  if (loading) return <div className={styles.loading}>Memuat ujian...</div>;

  if (submitted) {
    return (
      <div className={styles.page}>
        <div
          className={`${styles.resultHeader} ${totalScore >= CONFIG.PASSING_SCORE ? styles.passed : styles.failed}`}
        >
          <div className={styles.resultIcon}>
            {totalScore >= CONFIG.PASSING_SCORE ? "🎉" : "📚"}
          </div>
          <h1 className={styles.resultTitle}>
            {totalScore >= CONFIG.PASSING_SCORE
              ? "Selamat! Kamu Lulus!"
              : "Belum Lulus"}
          </h1>
          <div className={styles.resultScore}>{totalScore}/100</div>
          <p className={styles.resultSubtitle}>
            {totalScore >= CONFIG.PASSING_SCORE
              ? `Jawaban kamu relevan ≥${CONFIG.PASSING_SCORE}% berdasarkan rubrik dosen`
              : `Skor kamu di bawah ${CONFIG.PASSING_SCORE}. Pelajari lagi materinya ya!`}
          </p>
        </div>

        <div className={styles.detailList}>
          {questions.map((q, i) => {
            const result = results[q.id];
            return (
              <div key={q.id} className={styles.detailCard}>
                <div className={styles.detailHeader}>
                  <span className={styles.detailNum}>Soal {i + 1}</span>
                  <span
                    className={`${styles.scoreChip} ${result?.score >= CONFIG.PASSING_SCORE ? styles.scorePass : styles.scoreFail}`}
                  >
                    {result?.score}/100
                  </span>
                </div>
                <p className={styles.detailQuestion}>{q.question_text}</p>
                <div className={styles.detailAnswer}>
                  <span className={styles.answerLabel}>Jawaban kamu:</span>
                  <p>{answers[q.id]}</p>
                </div>
                <div className={styles.detailFeedback}>
                  <span className={styles.feedbackLabel}>💡 Feedback AI:</span>
                  <p>{result?.feedback}</p>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => {
            setSelectedExam(null);
            setSubmitted(false);
          }}
          className={styles.backBtn}
        >
          ← Kembali ke Daftar Ujian
        </button>
      </div>
    );
  }

  if (selectedExam) {
    return (
      <div className={styles.page}>
        <div className={styles.examHeader}>
          <button
            onClick={() => setSelectedExam(null)}
            className={styles.backLink}
          >
            ← Kembali
          </button>
          <div>
            <h1 className={styles.examTitle}>{selectedExam.title}</h1>
            {selectedExam.topic && (
              <p className={styles.examTopic}>📚 {selectedExam.topic}</p>
            )}
            {selectedExam.description && (
              <p className={styles.examDesc}>{selectedExam.description}</p>
            )}
          </div>
          <div className={styles.examMeta}>
            <span>📝 {questions.length} Soal</span>
            <span>⏱️ Tidak ada batas waktu</span>
            <span>✅ Lulus jika skor ≥{CONFIG.PASSING_SCORE}</span>
          </div>
        </div>

        <div className={styles.questionsList}>
          {questions.map((q, i) => (
            <div key={q.id} className={styles.questionCard}>
              <div className={styles.questionHeader}>
                <span className={styles.questionNum}>Soal {i + 1}</span>
              </div>
              <p className={styles.questionText}>{q.question_text}</p>
              <textarea
                placeholder="Tulis jawaban kamu di sini..."
                value={answers[q.id] || ""}
                onChange={(e) =>
                  setAnswers({ ...answers, [q.id]: e.target.value })
                }
                className={styles.answerInput}
                rows={4}
                disabled={grading}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={grading}
          className={styles.submitBtn}
        >
          {grading ? "⏳ Sedang dinilai AI..." : "📤 Kumpulkan Jawaban"}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Ujian Online 📝</h1>
        <p className={styles.pageSubtitle}>Pilih ujian yang ingin dikerjakan</p>
      </div>

      {exams.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📭</div>
          <p>Belum ada ujian yang tersedia saat ini.</p>
          <p>Tunggu dosen mengaktifkan ujian ya!</p>
        </div>
      ) : (
        <div className={styles.examGrid}>
          {exams.map((exam) => {
            const isCompleted = completedExams[exam.id];
            const isLocked =
              isCompleted && isCompleted.attempts >= CONFIG.MAX_EXAM_ATTEMPTS;
            return (
              <div
                key={exam.id}
                className={`${styles.examCard} ${isCompleted ? styles.completedCard : ""} ${isLocked ? styles.lockedCard : ""}`}
              >
                {isCompleted && (
                  <div
                    className={`${styles.completedBadge} ${isLocked ? styles.lockedBadge : ""}`}
                  >
                    {isLocked ? "🔒 Terkunci" : "✅ Selesai"}
                  </div>
                )}
                <div className={styles.examCardIcon}>📝</div>
                <div className={styles.examCardInfo}>
                  <h3 className={styles.examCardTitle}>{exam.title}</h3>
                  {exam.topic && (
                    <p className={styles.examCardTopic}>📚 {exam.topic}</p>
                  )}
                  {exam.description && (
                    <p className={styles.examCardDesc}>{exam.description}</p>
                  )}
                  <div className={styles.examCardMeta}>
                    <span>{exam.questions[0]?.count || 0} Soal</span>
                    <span>Lulus ≥{CONFIG.PASSING_SCORE}%</span>
                  </div>
                  {isCompleted && (
                    <div
                      className={`${styles.scoreInfo} ${isCompleted.passed ? styles.passedScore : styles.failedScore}`}
                    >
                      Skor: {isCompleted.total_score}/100
                      {isCompleted.passed ? " ✨ LULUS" : " 📚 Belum Lulus"}
                      {isLocked && (
                        <div className={styles.lockedInfo}>
                          (Ujian sudah selesai - tidak bisa diakses lagi)
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => selectExam(exam)}
                  disabled={isLocked}
                  className={`${styles.startBtn} ${isCompleted && !isLocked ? styles.retakeBtn : ""} ${isLocked ? styles.disabledBtn : ""}`}
                >
                  {isLocked
                    ? "Selesai"
                    : isCompleted
                      ? "Ulang Ujian →"
                      : "Mulai Ujian →"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
