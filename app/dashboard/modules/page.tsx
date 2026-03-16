"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./modules.module.css";

const allModules = [
  {
    week: 1,
    title: "Pengenalan Pemrograman",
    desc: "Algoritma, flowchart, pseudocode, dan konsep dasar pemrograman",
    topics: ["Algoritma", "Flowchart", "Pseudocode", "Lingkungan Pemrograman"],
    duration: "2 jam",
  },
  {
    week: 2,
    title: "Variabel & Tipe Data",
    desc: "Mengenal variabel, konstanta, dan berbagai tipe data dalam pemrograman",
    topics: ["Integer", "Float", "String", "Boolean", "Deklarasi Variabel"],
    duration: "2 jam",
  },
  {
    week: 3,
    title: "Percabangan",
    desc: "Struktur kontrol percabangan untuk pengambilan keputusan",
    topics: ["if", "if-else", "else-if", "switch-case", "Operator Logika"],
    duration: "3 jam",
  },
  {
    week: 4,
    title: "Perulangan",
    desc: "Struktur perulangan untuk mengeksekusi kode berulang kali",
    topics: ["for loop", "while loop", "do-while", "break", "continue"],
    duration: "3 jam",
  },
  {
    week: 5,
    title: "Fungsi & Prosedur",
    desc: "Membuat dan menggunakan fungsi untuk kode yang lebih modular",
    topics: ["Definisi Fungsi", "Parameter", "Return Value", "Rekursi"],
    duration: "3 jam",
  },
  {
    week: 6,
    title: "Array & List",
    desc: "Struktur data array dan list untuk menyimpan kumpulan data",
    topics: ["Array 1D", "Array 2D", "List", "Operasi Array"],
    duration: "3 jam",
  },
  {
    week: 7,
    title: "String Manipulation",
    desc: "Teknik pengolahan dan manipulasi teks/string",
    topics: ["Konkatenasi", "Slicing", "Built-in Methods", "Format String"],
    duration: "2 jam",
  },
  {
    week: 8,
    title: "OOP Dasar",
    desc: "Konsep dasar Object Oriented Programming",
    topics: ["Class", "Object", "Method", "Atribut", "Enkapsulasi"],
    duration: "4 jam",
  },
];

interface ModuleProgress {
  week_number: number;
  is_completed: boolean;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("module_progress")
        .select("week_number, is_completed")
        .eq("user_id", user.id);
      if (data) setProgress(data);
      setLoading(false);
    };
    fetchProgress();
  }, []);

  const getModuleStatus = (
    week: number,
  ): "completed" | "in-progress" | "locked" => {
    const isAccessible =
      week === 1 || progress.some((p) => p.week_number === week - 1);
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

  const completedCount = allModules.filter(
    (m) => getModuleStatus(m.week) === "completed",
  ).length;
  const inProgressCount = allModules.filter(
    (m) => getModuleStatus(m.week) === "in-progress",
  ).length;
  const totalProgress = Math.round((completedCount / allModules.length) * 100);

  const filtered = allModules.filter((m) => {
    const matchSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.topics.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const status = getModuleStatus(m.week);
    const matchFilter = filter === "all" || filter === status;
    return matchSearch && matchFilter;
  });

  const renderTopicsSection = (mod: (typeof allModules)[0], status: string) => {
    if (status === "locked") {
      return (
        <div className={styles.topicsSection}>
          <div className={styles.topicsTitle}>Topik yang dipelajari:</div>
          <div className={styles.topicsList}>
            {mod.topics.map((topic) => (
              <span key={topic} className={styles.topicChip}>
                {topic}
              </span>
            ))}
          </div>
          <div className={styles.lockedMsg}>
            Selesaikan modul sebelumnya untuk membuka modul ini
          </div>
        </div>
      );
    }
    return (
      <div className={styles.topicsSection}>
        <div className={styles.topicsTitle}>Topik yang dipelajari:</div>
        <div className={styles.topicsList}>
          {mod.topics.map((topic) => (
            <span key={topic} className={styles.topicChip}>
              {topic}
            </span>
          ))}
        </div>
        <div className={styles.cardActions}>
          <a
            href={"/dashboard/modules/" + String(mod.week)}
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
            <div className={styles.statValue}>{allModules.length}</div>
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
            placeholder="Cari modul atau topik..."
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
        {filtered.map((mod) => {
          const status = getModuleStatus(mod.week);
          const progressPct = getProgressPct(mod.week);
          const statusInfo = statusConfig[status];
          const isExpanded = expandedWeek === mod.week;
          const cardClass =
            status === "locked"
              ? styles.moduleCard + " " + styles.locked
              : styles.moduleCard;

          return (
            <div key={mod.week} className={cardClass}>
              <div
                className={styles.cardHeader}
                onClick={() => setExpandedWeek(isExpanded ? null : mod.week)}
              >
                <div className={styles.weekBadge}>Minggu {mod.week}</div>
                <div className={styles.cardMeta}>
                  <h3 className={styles.cardTitle}>{mod.title}</h3>
                  <p className={styles.cardDesc}>{mod.desc}</p>
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
                  <span className={styles.duration}>{mod.duration}</span>
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
        })}
      </div>
    </div>
  );
}
