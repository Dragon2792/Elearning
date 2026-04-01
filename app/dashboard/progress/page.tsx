"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import styles from "./progress.module.css";

interface ModuleProgress {
  week_number: number;
  is_completed: boolean;
  last_accessed: string;
}

interface DbModule {
  id: string;
  week_number: number;
  title: string;
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
  const [dbModules, setDbModules] = useState<DbModule[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      const supabase = createClient();
      const authResult = await supabase.auth.getUser();
      const user = authResult.data.user;
      if (!user) return;

      // Fetch all data in parallel for faster page load
      const [mProgress, modules, eResults] = await Promise.all([
        supabase
          .from("module_progress")
          .select("*")
          .eq("user_id", user.id)
          .order("week_number"),
        supabase
          .from("modules")
          .select("id, week_number, title")
          .eq("is_published", true)
          .order("week_number"),
        supabase
          .from("exam_results")
          .select("*, exams(title, topic)")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false }),
      ]);

      if (mProgress.data) setModuleProgress(mProgress.data);
      if (modules.data) setDbModules(modules.data);
      if (eResults.data) setExamResults(eResults.data as ExamResult[]);

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
  const totalModules = dbModules.length || 1;
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
        <h1 className={styles.pageTitle}>Progress Belajar</h1>
        <p className={styles.pageSubtitle}>Pantau perkembangan belajar kamu</p>
      </div>

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

      <div className={styles.overallCard}>
        <div className={styles.overallHeader}>
          <h2 className={styles.overallTitle}>Progress Keseluruhan</h2>
          <span className={styles.overallPct}>{overallProgress}%</span>
        </div>
        <div className={styles.overallBar}>
          <div
            className={styles.overallFill}
            style={{ width: String(overallProgress) + "%" }}
          />
        </div>
        <p className={styles.overallDesc}>
          {completedModules === 0
            ? "Mulai belajar modul pertama sekarang!"
            : completedModules === totalModules
              ? "Selamat! Kamu telah menyelesaikan semua modul!"
              : "Kamu sudah menyelesaikan " +
                completedModules +
                " dari " +
                totalModules +
                " modul. Terus semangat!"}
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Progress Modul</h2>
        <div className={styles.moduleList}>
          {dbModules.length === 0 ? (
            <div
              style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}
            >
              Belum ada modul yang dipublikasikan
            </div>
          ) : (
            dbModules.map((mod) => {
              const { status, progress } = getModuleStatus(mod.week_number);
              const lastAccess = moduleProgress.find(
                (p) => p.week_number === mod.week_number,
              )?.last_accessed;
              return (
                <div key={mod.id} className={styles.moduleCard}>
                  <div className={styles.moduleLeft}>
                    <div
                      className={
                        status === "selesai"
                          ? styles.moduleIcon + " " + styles.iconCompleted
                          : status === "diakses"
                            ? styles.moduleIcon + " " + styles.iconAccessed
                            : styles.moduleIcon + " " + styles.iconPending
                      }
                    >
                      {status === "selesai"
                        ? "✅"
                        : status === "diakses"
                          ? "📖"
                          : "🔒"}
                    </div>
                    <div>
                      <div className={styles.moduleWeek}>
                        Minggu {mod.week_number}
                      </div>
                      <div className={styles.moduleTitle}>{mod.title}</div>
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
                        style={{ width: String(progress) + "%" }}
                      />
                    </div>
                    <span className={styles.progressPct}>{progress}%</span>
                    <Link
                      href={"/dashboard/modules/" + String(mod.week_number)}
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
            })
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Riwayat Ujian</h2>
        {examResults.length === 0 ? (
          <div className={styles.emptyExam}>
            <p>Belum ada ujian yang dikerjakan.</p>
            <Link href="/dashboard/exams" className={styles.examLink}>
              Mulai Ujian Sekarang
            </Link>
          </div>
        ) : (
          <div className={styles.examList}>
            {examResults.map((result) => (
              <div key={result.id} className={styles.examCard}>
                <div className={styles.examInfo}>
                  <div className={styles.examTitle}>{result.exams?.title}</div>
                  {result.exams?.topic && (
                    <div className={styles.examTopic}>{result.exams.topic}</div>
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
                    className={
                      result.passed
                        ? styles.scoreBig + " " + styles.scorePass
                        : styles.scoreBig + " " + styles.scoreFail
                    }
                  >
                    {result.total_score}
                  </div>
                  <span
                    className={
                      result.passed
                        ? styles.passBadge + " " + styles.passed
                        : styles.passBadge + " " + styles.failed
                    }
                  >
                    {result.passed ? "Lulus" : "Belum Lulus"}
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
