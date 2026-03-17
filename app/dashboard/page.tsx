"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "./home.module.css";

const quickMenus = [
  {
    href: "/dashboard/modules",
    icon: "📚",
    label: "Modul Materi",
    desc: "Lihat semua materi kuliah",
    color: "#6366f1",
  },
  {
    href: "/dashboard/chat",
    icon: "🤖",
    label: "AI Tutor",
    desc: "Tanya langsung ke AI",
    color: "#8b5cf6",
  },
  {
    href: "/dashboard/exams",
    icon: "📝",
    label: "Ujian",
    desc: "Kerjakan ujian online",
    color: "#ec4899",
  },
  {
    href: "/dashboard/progress",
    icon: "📊",
    label: "Progress",
    desc: "Pantau perkembangan belajar",
    color: "#f59e0b",
  },
];

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

interface UserType {
  email?: string;
  user_metadata?: { full_name?: string };
}

export default function DashboardHome() {
  const [user, setUser] = useState<UserType | null>(null);
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress[]>([]);
  const [dbModules, setDbModules] = useState<DbModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const { data: progressData } = await supabase
        .from("module_progress")
        .select("week_number, is_completed, last_accessed")
        .eq("user_id", user.id)
        .order("week_number");
      if (progressData) setModuleProgress(progressData);

      const { data: modulesData } = await supabase
        .from("modules")
        .select("id, week_number, title")
        .eq("is_published", true)
        .order("week_number")
        .limit(4);
      if (modulesData) setDbModules(modulesData);

      setLoading(false);
    };
    fetchData();
  }, []);

  const completedCount = moduleProgress.filter((p) => p.is_completed).length;
  const totalModules = dbModules.length || 1;
  const overallProgress = Math.round((completedCount / totalModules) * 100);
  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] || "Mahasiswa";

  const recentModules = dbModules.map((mod) => {
    const p = moduleProgress.find((p) => p.week_number === mod.week_number);
    let progress = 0;
    if (p) progress = p.is_completed ? 100 : 50;
    return { week: mod.week_number, title: mod.title, progress };
  });

  return (
    <div className={styles.page}>
      <div className={styles.greeting}>
        <div>
          <h1 className={styles.greetTitle}>Halo, {firstName}! 👋</h1>
          <p className={styles.greetSub}>
            {loading
              ? "Memuat progress..."
              : completedCount === 0
                ? "Mulai belajar modul pertama sekarang! 🚀"
                : "Lanjutkan belajar hari ini. Kamu sudah " +
                  String(overallProgress) +
                  "% selesai!"}
          </p>
        </div>
        <div className={styles.progressCircle}>
          <svg viewBox="0 0 36 36" className={styles.circleSvg}>
            <path
              className={styles.circleTrack}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={styles.circleFill}
              strokeDasharray={String(overallProgress) + ", 100"}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className={styles.circleText}>{overallProgress}%</span>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Menu Cepat</h2>
        <div className={styles.quickGrid}>
          {quickMenus.map((menu) => (
            <Link key={menu.href} href={menu.href} className={styles.quickCard}>
              <div
                className={styles.quickIcon}
                style={{ background: menu.color }}
              >
                {menu.icon}
              </div>
              <div>
                <div className={styles.quickLabel}>{menu.label}</div>
                <div className={styles.quickDesc}>{menu.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Modul Terkini</h2>
          <Link href="/dashboard/modules" className={styles.seeAll}>
            Lihat Semua
          </Link>
        </div>
        <div className={styles.moduleList}>
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "1.5rem",
                color: "#94a3b8",
                fontSize: "0.9rem",
              }}
            >
              Memuat modul...
            </div>
          ) : recentModules.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "1.5rem",
                color: "#94a3b8",
                fontSize: "0.9rem",
              }}
            >
              Belum ada modul yang dipublikasikan
            </div>
          ) : (
            recentModules.map((mod) => (
              <Link
                key={mod.week}
                href={"/dashboard/modules/" + String(mod.week)}
                className={styles.moduleCard}
              >
                <div className={styles.moduleWeek}>Minggu {mod.week}</div>
                <div className={styles.moduleTitle}>{mod.title}</div>
                <div className={styles.moduleProgress}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: String(mod.progress) + "%" }}
                    />
                  </div>
                  <span className={styles.progressText}>{mod.progress}%</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
