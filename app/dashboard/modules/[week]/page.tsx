"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "./detail.module.css";

interface Section {
  id: string;
  title: string;
  content: string;
  code_example: string;
  code_language: string;
  order_number: number;
}

interface ModuleFile {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
}

interface Module {
  id: string;
  week_number: number;
  title: string;
  description: string;
}

function getFileIcon(type: string): string {
  if (type.includes("pdf")) return "📄";
  if (type.includes("word") || type.includes("document")) return "📝";
  if (type.includes("presentation") || type.includes("powerpoint")) return "📊";
  return "📁";
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function ModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const week = Number(params.week);
  const [mod, setMod] = useState<Module | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [moduleFiles, setModuleFiles] = useState<ModuleFile[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [marking, setMarking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prevWeek, setPrevWeek] = useState<number | null>(null);
  const [nextWeek, setNextWeek] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const authResult = await supabase.auth.getUser();
      const user = authResult.data.user;
      if (!user) return;
      const modResult = await supabase
        .from("modules")
        .select("*")
        .eq("week_number", week)
        .eq("is_published", true)
        .single();
      if (!modResult.data) {
        setLoading(false);
        return;
      }
      setMod(modResult.data);
      const secResult = await supabase
        .from("module_sections")
        .select("*")
        .eq("module_id", modResult.data.id)
        .order("order_number");
      if (secResult.data) setSections(secResult.data);
      const fileResult = await supabase
        .from("module_files")
        .select("*")
        .eq("module_id", modResult.data.id);
      console.log("[DEBUG] fileResult.data:", fileResult.data);
      if (fileResult.data) setModuleFiles(fileResult.data);
      await supabase.from("module_progress").upsert(
        {
          user_id: user.id,
          week_number: week,
          last_accessed: new Date().toISOString(),
        },
        { onConflict: "user_id,week_number" },
      );
      const progResult = await supabase
        .from("module_progress")
        .select("is_completed")
        .eq("user_id", user.id)
        .eq("week_number", week)
        .single();
      if (progResult.data) setIsCompleted(progResult.data.is_completed);
      const allResult = await supabase
        .from("modules")
        .select("week_number")
        .eq("is_published", true)
        .order("week_number");
      if (allResult.data) {
        const weeks = allResult.data.map(
          (m: { week_number: number }) => m.week_number,
        );
        const idx = weeks.indexOf(week);
        setPrevWeek(idx > 0 ? weeks[idx - 1] : null);
        setNextWeek(idx < weeks.length - 1 ? weeks[idx + 1] : null);
      }
      setLoading(false);
    };
    fetchData();
  }, [week]);

  const markAsComplete = async () => {
    setMarking(true);
    const supabase = createClient();
    const authResult = await supabase.auth.getUser();
    const user = authResult.data.user;
    if (!user) return;
    await supabase.from("module_progress").upsert(
      {
        user_id: user.id,
        week_number: week,
        is_completed: true,
        last_accessed: new Date().toISOString(),
      },
      { onConflict: "user_id,week_number" },
    );
    setIsCompleted(true);
    setMarking(false);
  };

  const getPublicUrl = (filePath: string) => {
    const supabase = createClient();
    const urlResult = supabase.storage.from("modules").getPublicUrl(filePath);
    return urlResult.data.publicUrl;
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
        Memuat modul...
      </div>
    );
  }

  if (!mod) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <h2 style={{ color: "#1e293b", marginBottom: "1rem" }}>
          Modul tidak ditemukan
        </h2>
        <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
          Modul ini belum dipublikasikan.
        </p>
        <button
          onClick={() => router.push("/dashboard/modules")}
          style={{
            padding: "0.75rem 1.5rem",
            background: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Kembali ke Modul
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/dashboard/modules" className={styles.backLink}>
          Kembali ke Modul
        </Link>
        <div className={styles.weekBadge}>Minggu {week}</div>
        <h1 className={styles.title}>{mod.title}</h1>
        {mod.description && <p className={styles.desc}>{mod.description}</p>}
        {isCompleted && (
          <div className={styles.completedBadge}>
            Modul ini sudah kamu selesaikan!
          </div>
        )}
      </div>
      <div className={styles.sections}>
        {sections.length === 0 && (
          <div className={styles.sectionCard}>
            <p
              style={{ color: "#94a3b8", textAlign: "center", padding: "1rem" }}
            >
              Konten modul belum tersedia.
            </p>
          </div>
        )}
        {sections.map((section) => (
          <div key={section.id} className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            {section.content && (
              <p className={styles.sectionContent}>{section.content}</p>
            )}
            {section.code_example && (
              <div className={styles.codeBlock}>
                <div className={styles.codeLang}>
                  {section.code_language || "python"}
                </div>
                <pre>
                  <code>{section.code_example}</code>
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
      {moduleFiles.length > 0 && (
        <div className={styles.filesCard}>
          <h2 className={styles.filesTitle}>Materi dan File Download</h2>
          <div className={styles.filesList}>
            {moduleFiles.map((file) => (
              <div key={file.id} className={styles.fileItem}>
                <span className={styles.fileItemIcon}>
                  {getFileIcon(file.file_type)}
                </span>
                <div className={styles.fileItemInfo}>
                  <div className={styles.fileItemTitle}>{file.title}</div>
                  {file.description && (
                    <div className={styles.fileItemDesc}>
                      {file.description}
                    </div>
                  )}
                  <div className={styles.fileItemMeta}>
                    {file.file_name} - {formatSize(file.file_size)}
                  </div>
                </div>
                <a
                  href={getPublicUrl(file.file_path)}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.downloadBtn}
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
      {!isCompleted && (
        <button
          onClick={markAsComplete}
          disabled={marking}
          className={styles.completeBtn}
        >
          {marking ? "Menyimpan..." : "Tandai Modul Selesai"}
        </button>
      )}
      <div className={styles.navigation}>
        {prevWeek !== null && (
          <Link
            href={"/dashboard/modules/" + String(prevWeek)}
            className={styles.navBtn}
          >
            Modul Sebelumnya
          </Link>
        )}
        <Link href="/dashboard/chat" className={styles.askBtn}>
          Tanya AI Tutor
        </Link>
        {nextWeek !== null && (
          <Link
            href={"/dashboard/modules/" + String(nextWeek)}
            className={styles.navBtn}
          >
            Modul Berikutnya
          </Link>
        )}
      </div>
    </div>
  );
}
