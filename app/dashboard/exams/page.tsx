"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./exam.module.css";

interface Exam {
  id: string;
  title: string;
  description: string;
  topic: string;
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

export default function ExamPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
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
      const { data } = await supabase
        .from("exams")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (data) setExams(data);
      setLoading(false);
    };
    fetchExams();
  }, []);

  const selectExam = async (exam: Exam) => {
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const gradeResults: Record<string, GradeResult> = {};

    for (const question of questions) {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.question_text,
          rubric: question.rubric,
          answer: answers[question.id],
        }),
      });
      const grade = await res.json();
      gradeResults[question.id] = grade;

      await supabase.from("answers").insert({
        exam_id: selectedExam!.id,
        question_id: question.id,
        user_id: user?.id,
        answer_text: answers[question.id],
        ai_score: grade.score,
        ai_feedback: grade.feedback,
      });
    }

    const avg = Math.round(
      Object.values(gradeResults).reduce((acc, r) => acc + r.score, 0) /
        questions.length,
    );

    await supabase.from("exam_results").insert({
      exam_id: selectedExam!.id,
      user_id: user?.id,
      total_score: avg,
      passed: avg >= 70,
    });

    setResults(gradeResults);
    setTotalScore(avg);
    setSubmitted(true);
    setGrading(false);
  };

  if (loading) return <div className={styles.loading}>Memuat ujian...</div>;

  if (submitted) {
    return (
      <div className={styles.page}>
        <div
          className={`${styles.resultHeader} ${totalScore >= 70 ? styles.passed : styles.failed}`}
        >
          <div className={styles.resultIcon}>
            {totalScore >= 70 ? "🎉" : "📚"}
          </div>
          <h1 className={styles.resultTitle}>
            {totalScore >= 70 ? "Selamat! Kamu Lulus!" : "Belum Lulus"}
          </h1>
          <div className={styles.resultScore}>{totalScore}/100</div>
          <p className={styles.resultSubtitle}>
            {totalScore >= 70
              ? "Jawaban kamu relevan ≥70% berdasarkan rubrik dosen"
              : "Skor kamu di bawah 70. Pelajari lagi materinya ya!"}
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
                    className={`${styles.scoreChip} ${result?.score >= 70 ? styles.scorePass : styles.scoreFail}`}
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
            <span>✅ Lulus jika skor ≥70</span>
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
          {exams.map((exam) => (
            <div key={exam.id} className={styles.examCard}>
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
                  <span>10 Soal</span>
                  <span>Lulus ≥70%</span>
                </div>
              </div>
              <button
                onClick={() => selectExam(exam)}
                className={styles.startBtn}
              >
                Mulai Ujian →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
