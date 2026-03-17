"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./modules.module.css";

interface ModuleProgress {
  week_number: number;
  is_completed: boolean;
}

interface DbModule {
  id: string;
  week_number: number;
  title: string;
  description: string;
  is_published: boolean;
}

const statusConfig = {
  completed: { label: "Selesai", color: "#10b981", bg: "#d1fae5" },
  "in-progress": {
    label: "Sedang Dipelajari",
    color: "#f59e0b",
    bg: "#fef3c7",
  },
  locked: { label: "Terkunci", color: "#94a3b8", bg: "#f1f5f9" },
};

const filterOptions = [
  { key: "all", label: "Semua" },
  { key: "completed", label: "Selesai" },
  { key: "in-progress", label: "Berlangsung" },
  { key: "locked", label: "Terkunci" },
];

export default function ModulesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [progress, setProgress] = useState<ModuleProgress[]>([]);
  const [dbModules, setDbModules] = useState<DbModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: progressData } = await supabase
        .from("module_progress")
        .select("week_number, is_completed")
        .eq("user_id", user.id);
      if (progressData) setProgress(progressData);

      const { data: modulesData } = await supabase
        .from("modules")
        .select("id, week_number, title, description, is_published")
        .eq("is_published", true)
        .order("week_number");
      if (modulesData) setDbModules(modulesData);

      setLoading(false);
    };
    fetchData();
  }, []);

  const getModuleStatus = (
    week: number,
  ): "completed" | "in-progress" | "locked" => {
    const isAccessible =
      week === dbModules[0]?.week_number ||
      progress.some((p) => p.week_number === week - 1) ||
      dbModules.findIndex((m) => m.week_number === week) === 0;
    if (!isAccessible) return "locked";
    const found = progress.find((p) => p.week_number === week);
    if (!found) return "in-progress";
    if (found.is_completed) return "completed";
    return "in-progress";
  };

  const getProgressPct = (week: number): number => {
    const status = getModuleStatus(week);
    if (status === "completed") return 100;
    if (status === "in-progress") return 50;
    return 0;
  };

  const completedCount = dbModules.filter(
    (m) => getModuleStatus(m.week_number) === "completed",
  ).length;
  const inProgressCount = dbModules.filter(
    (m) => getModuleStatus(m.week_number) === "in-progress",
  ).length;
  const totalProgress =
    dbModules.length > 0
      ? Math.round((completedCount / dbModules.length) * 100)
      : 0;

  const filtered = dbModules.filter((m) => {
    const matchSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase());
    const status = getModuleStatus(m.week_number);
    const matchFilter = filter === "all" || filter === status;
    return matchSearch && matchFilter;
  });

  const renderTopicsSection = (mod: DbModule, status: string) => {
    if (status === "locked") {
      return (
        <div className={styles.topicsSection}>
          <div className={styles.lockedMsg}>
            Selesaikan modul sebelumnya untuk membuka modul ini
          </div>
        </div>
      );
    }
    return (
      <div className={styles.topicsSection}>
        <div className={styles.cardActions}>
          <a
            href={"/dashboard/modules/" + String(mod.week_number)}
            className={styles.studyBtn}
          >
            {status === "completed"
              ? "🔄 Pelajari Ulang"
              : "▶️ Lanjutkan Belajar"}
          </a>
          <a href="/dashboard/chat" className={styles.askBtn}>
            🤖 Tanya AI Tutor
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📚</span>
          <div>
            <div className={styles.statValue}>
              {loading ? "..." : dbModules.length}
            </div>
            <div className={styles.statLabel}>Total Modul</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>✅</span>
          <div>
            <div className={styles.statValue}>
              {loading ? "..." : completedCount}
            </div>
            <div className={styles.statLabel}>Selesai</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🔥</span>
          <div>
            <div className={styles.statValue}>
              {loading ? "..." : inProgressCount}
            </div>
            <div className={styles.statLabel}>Sedang Dipelajari</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📊</span>
          <div>
            <div className={styles.statValue}>
              {loading ? "..." : String(totalProgress) + "%"}
            </div>
            <div className={styles.statLabel}>Total Progress</div>
          </div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Cari modul..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterBtns}>
          {filterOptions.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={
                filter === f.key
                  ? styles.filterBtn + " " + styles.filterActive
                  : styles.filterBtn
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.moduleGrid}>
        {loading ? (
          <div
            style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}
          >
            Memuat modul...
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}
          >
            {dbModules.length === 0
              ? "Belum ada modul yang dipublikasikan"
              : "Tidak ada modul ditemukan"}
          </div>
        ) : (
          filtered.map((mod) => {
            const status = getModuleStatus(mod.week_number);
            const progressPct = getProgressPct(mod.week_number);
            const statusInfo = statusConfig[status];
            const isExpanded = expandedWeek === mod.week_number;
            const cardClass =
              status === "locked"
                ? styles.moduleCard + " " + styles.locked
                : styles.moduleCard;

            return (
              <div key={mod.id} className={cardClass}>
                <div
                  className={styles.cardHeader}
                  onClick={() =>
                    setExpandedWeek(isExpanded ? null : mod.week_number)
                  }
                >
                  <div className={styles.weekBadge}>
                    Minggu {mod.week_number}
                  </div>
                  <div className={styles.cardMeta}>
                    <h3 className={styles.cardTitle}>{mod.title}</h3>
                    {mod.description && (
                      <p className={styles.cardDesc}>{mod.description}</p>
                    )}
                  </div>
                  <div className={styles.cardRight}>
                    <span
                      className={styles.statusBadge}
                      style={{
                        color: statusInfo.color,
                        background: statusInfo.bg,
                      }}
                    >
                      {statusInfo.label}
                    </span>
                    <span className={styles.expandIcon}>
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {status !== "locked" && (
                  <div className={styles.progressRow}>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: String(progressPct) + "%" }}
                      />
                    </div>
                    <span className={styles.progressText}>{progressPct}%</span>
                  </div>
                )}

                {isExpanded && renderTopicsSection(mod, status)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
