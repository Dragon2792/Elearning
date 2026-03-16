"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./exams.module.css";

interface Exam {
  id: string;
  title: string;
  description: string;
  topic: string;
  is_active: boolean;
  created_at: string;
}

interface Question {
  question_text: string;
  rubric: string;
  order_number: number;
}

export default function AdminExams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    topic: "",
  });
  const [questions, setQuestions] = useState<Question[]>(
    Array.from({ length: 10 }, (_, i) => ({
      question_text: "",
      rubric: "",
      order_number: i + 1,
    })),
  );
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchExams = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("exams")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setExams(data);
      setLoading(false);
    };
    fetchExams();
  }, []);

  const refetchExams = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("exams")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setExams(data);
  };

  const handleSave = async () => {
    if (!formData.title) return alert("Judul ujian wajib diisi!");
    const emptyQ = questions.filter((q) => !q.question_text || !q.rubric);
    if (emptyQ.length > 0)
      return alert(
        `Soal nomor ${emptyQ.map((q) => q.order_number).join(", ")} belum diisi!`,
      );

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: exam, error } = await supabase
      .from("exams")
      .insert({ ...formData, created_by: user?.id })
      .select()
      .single();

    if (error || !exam) {
      alert("Gagal menyimpan ujian!");
      setSaving(false);
      return;
    }

    await supabase
      .from("questions")
      .insert(questions.map((q) => ({ ...q, exam_id: exam.id })));

    setSuccessMsg("Ujian berhasil dibuat! ✅");
    setShowForm(false);
    setFormData({ title: "", description: "", topic: "" });
    setQuestions(
      Array.from({ length: 10 }, (_, i) => ({
        question_text: "",
        rubric: "",
        order_number: i + 1,
      })),
    );
    await refetchExams();
    setSaving(false);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const toggleActive = async (examId: string, current: boolean) => {
    const supabase = createClient();
    await supabase
      .from("exams")
      .update({ is_active: !current })
      .eq("id", examId);
    await refetchExams();
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Kelola Ujian</h1>
          <p className={styles.pageSubtitle}>
            Buat dan kelola soal ujian untuk mahasiswa
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={styles.createBtn}
        >
          {showForm ? "✕ Batal" : "➕ Buat Ujian Baru"}
        </button>
      </div>

      {successMsg && <div className={styles.successMsg}>{successMsg}</div>}

      {showForm && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>📝 Buat Ujian Baru</h2>

          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Judul Ujian *</label>
              <input
                type="text"
                placeholder="Contoh: Ujian Tengah Semester"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className={styles.input}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Topik</label>
              <input
                type="text"
                placeholder="Contoh: Variabel & Tipe Data"
                value={formData.topic}
                onChange={(e) =>
                  setFormData({ ...formData, topic: e.target.value })
                }
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Deskripsi</label>
            <textarea
              placeholder="Deskripsi ujian..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className={styles.textarea}
              rows={2}
            />
          </div>

          <h3 className={styles.questionsTitle}>📋 10 Soal Ujian</h3>
          <div className={styles.questionsList}>
            {questions.map((q, i) => (
              <div key={i} className={styles.questionCard}>
                <div className={styles.questionNum}>Soal {i + 1}</div>
                <div className={styles.questionFields}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Pertanyaan *</label>
                    <textarea
                      placeholder={`Tulis soal nomor ${i + 1}...`}
                      value={q.question_text}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[i].question_text = e.target.value;
                        setQuestions(updated);
                      }}
                      className={styles.textarea}
                      rows={2}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Rubrik Penilaian *</label>
                    <textarea
                      placeholder="Kriteria jawaban yang benar..."
                      value={q.rubric}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[i].rubric = e.target.value;
                        setQuestions(updated);
                      }}
                      className={styles.rubricArea}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={styles.saveBtn}
          >
            {saving ? "⏳ Menyimpan..." : "💾 Simpan Ujian"}
          </button>
        </div>
      )}

      <div className={styles.examsList}>
        {loading ? (
          <div className={styles.loadingText}>Memuat ujian...</div>
        ) : exams.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📝</div>
            <p>Belum ada ujian. Buat ujian pertama kamu!</p>
          </div>
        ) : (
          exams.map((exam) => (
            <div key={exam.id} className={styles.examCard}>
              <div className={styles.examInfo}>
                <div className={styles.examTitle}>{exam.title}</div>
                {exam.topic && (
                  <div className={styles.examTopic}>📚 {exam.topic}</div>
                )}
                {exam.description && (
                  <div className={styles.examDesc}>{exam.description}</div>
                )}
                <div className={styles.examDate}>
                  Dibuat:{" "}
                  {new Date(exam.created_at).toLocaleDateString("id-ID")}
                </div>
              </div>
              <div className={styles.examActions}>
                <span
                  className={`${styles.statusBadge} ${exam.is_active ? styles.active : styles.inactive}`}
                >
                  {exam.is_active ? "✅ Aktif" : "⏸️ Nonaktif"}
                </span>
                <button
                  onClick={() => toggleActive(exam.id, exam.is_active)}
                  className={styles.toggleBtn}
                >
                  {exam.is_active ? "Nonaktifkan" : "Aktifkan"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
