"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import styles from "./progress.module.css";

const moduleNames: Record<number, string> = {
  1: "Pengenalan Pemrograman",
  2: "Variabel & Tipe Data",
  3: "Percabangan",
  4: "Perulangan",
  5: "Fungsi & Prosedur",
  6: "Array & List",
  7: "String Manipulation",
  8: "OOP Dasar",
};

interface ModuleProgress {
  week_number: number;
  is_completed: boolean;
  last_accessed: string;
}

interface ExamResult {
  id: string;
  total_score: number;
  passed: boolean;
  completed_at: string;
  exams: { title: string; topic: string };
}

export default function ProgressPage() {
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: mProgress } = await supabase
        .from("module_progress")
        .select("*")
        .eq("user_id", user.id)
        .order("week_number");

      const { data: eResults } = await supabase
        .from("exam_results")
        .select("*, exams(title, topic)")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });

      if (mProgress) setModuleProgress(mProgress);
      if (eResults) setExamResults(eResults as ExamResult[]);
      setLoading(false);
    };
    fetchProgress();
  }, []);

  const getModuleStatus = (week: number) => {
    const progress = moduleProgress.find((p) => p.week_number === week);
    if (!progress) return { status: "belum", progress: 0 };
    if (progress.is_completed) return { status: "selesai", progress: 100 };
    return { status: "diakses", progress: 50 };
  };

  const completedModules = moduleProgress.filter((p) => p.is_completed).length;
  const accessedModules = moduleProgress.length;
  const totalModules = 8;
  const overallProgress = Math.round((completedModules / totalModules) * 100);
  const passedExams = examResults.filter((e) => e.passed).length;
  const avgExamScore =
    examResults.length > 0
      ? Math.round(
          examResults.reduce((acc, e) => acc + e.total_score, 0) /
            examResults.length,
        )
      : 0;

  if (loading) return <div className={styles.loading}>Memuat progress...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Progress Belajar 📊</h1>
        <p className={styles.pageSubtitle}>Pantau perkembangan belajar kamu</p>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#6366f1" }}>
            📚
          </div>
          <div>
            <div className={styles.statValue}>
              {completedModules}/{totalModules}
            </div>
            <div className={styles.statLabel}>Modul Selesai</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#8b5cf6" }}>
            👁️
          </div>
          <div>
            <div className={styles.statValue}>{accessedModules}</div>
            <div className={styles.statLabel}>Modul Dikunjungi</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#ec4899" }}>
            📝
          </div>
          <div>
            <div className={styles.statValue}>
              {passedExams}/{examResults.length}
            </div>
            <div className={styles.statLabel}>Ujian Lulus</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#f59e0b" }}>
            ⭐
          </div>
          <div>
            <div className={styles.statValue}>{avgExamScore}</div>
            <div className={styles.statLabel}>Rata-rata Nilai</div>
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className={styles.overallCard}>
        <div className={styles.overallHeader}>
          <h2 className={styles.overallTitle}>Progress Keseluruhan</h2>
          <span className={styles.overallPct}>{overallProgress}%</span>
        </div>
        <div className={styles.overallBar}>
          <div
            className={styles.overallFill}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <p className={styles.overallDesc}>
          {completedModules === 0
            ? "Mulai belajar modul pertama sekarang! 🚀"
            : completedModules === totalModules
              ? "🎉 Selamat! Kamu telah menyelesaikan semua modul!"
              : `Kamu sudah menyelesaikan ${completedModules} dari ${totalModules} modul. Terus semangat!`}
        </p>
      </div>

      {/* Module Progress */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>📚 Progress Modul</h2>
        <div className={styles.moduleList}>
          {Array.from({ length: totalModules }, (_, i) => i + 1).map((week) => {
            const { status, progress } = getModuleStatus(week);
            const lastAccess = moduleProgress.find(
              (p) => p.week_number === week,
            )?.last_accessed;
            return (
              <div key={week} className={styles.moduleCard}>
                <div className={styles.moduleLeft}>
                  <div
                    className={`${styles.moduleIcon} ${
                      status === "selesai"
                        ? styles.iconCompleted
                        : status === "diakses"
                          ? styles.iconAccessed
                          : styles.iconPending
                    }`}
                  >
                    {status === "selesai"
                      ? "✅"
                      : status === "diakses"
                        ? "📖"
                        : "🔒"}
                  </div>
                  <div>
                    <div className={styles.moduleWeek}>Minggu {week}</div>
                    <div className={styles.moduleTitle}>
                      {moduleNames[week]}
                    </div>
                    {lastAccess && (
                      <div className={styles.moduleDate}>
                        Terakhir diakses:{" "}
                        {new Date(lastAccess).toLocaleDateString("id-ID")}
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.moduleRight}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className={styles.progressPct}>{progress}%</span>
                  <Link
                    href={`/dashboard/modules/${week}`}
                    className={styles.studyLink}
                  >
                    {status === "selesai"
                      ? "Ulang"
                      : status === "diakses"
                        ? "Lanjut"
                        : "Mulai"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Exam Results */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>📝 Riwayat Ujian</h2>
        {examResults.length === 0 ? (
          <div className={styles.emptyExam}>
            <p>Belum ada ujian yang dikerjakan.</p>
            <Link href="/dashboard/exam" className={styles.examLink}>
              Mulai Ujian Sekarang →
            </Link>
          </div>
        ) : (
          <div className={styles.examList}>
            {examResults.map((result) => (
              <div key={result.id} className={styles.examCard}>
                <div className={styles.examInfo}>
                  <div className={styles.examTitle}>{result.exams?.title}</div>
                  {result.exams?.topic && (
                    <div className={styles.examTopic}>
                      📚 {result.exams.topic}
                    </div>
                  )}
                  <div className={styles.examDate}>
                    {new Date(result.completed_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div className={styles.examScore}>
                  <div
                    className={`${styles.scoreBig} ${result.passed ? styles.scorePass : styles.scoreFail}`}
                  >
                    {result.total_score}
                  </div>
                  <span
                    className={`${styles.passBadge} ${result.passed ? styles.passed : styles.failed}`}
                  >
                    {result.passed ? "✅ Lulus" : "❌ Belum Lulus"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
