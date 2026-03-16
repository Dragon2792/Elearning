"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./modules.module.css";

interface Module {
  id: string;
  week_number: number;
  title: string;
  description: string;
  is_published: boolean;
  created_at: string;
}

interface Section {
  id?: string;
  title: string;
  content: string;
  code_example: string;
  code_language: string;
  order_number: number;
}

interface ModuleFile {
  id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
}

const getFileIcon = (type: string) => {
  if (type.includes("pdf")) return "📄";
  if (type.includes("word") || type.includes("document")) return "📝";
  if (type.includes("presentation") || type.includes("powerpoint")) return "📊";
  return "📁";
};

const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

export default function AdminModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleFiles, setModuleFiles] = useState<ModuleFile[]>([]);

  // Form state
  const [weekNumber, setWeekNumber] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [sections, setSections] = useState<Section[]>([
    {
      title: "",
      content: "",
      code_example: "",
      code_language: "python",
      order_number: 1,
    },
  ]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState("");
  const [fileDesc, setFileDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchModules = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("modules")
        .select("*")
        .order("week_number");
      if (data) setModules(data);
      setLoading(false);
    };
    fetchModules();
  }, []);

  const fetchModules = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("modules")
      .select("*")
      .order("week_number");
    if (data) setModules(data);
    setLoading(false);
  };

  const fetchModuleFiles = async (moduleId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("module_files")
      .select("*")
      .eq("module_id", moduleId);
    if (data) setModuleFiles(data);
  };

  const fetchSections = async (moduleId: string): Promise<Section[]> => {
    const supabase = createClient();
    const { data } = await supabase
      .from("module_sections")
      .select("*")
      .eq("module_id", moduleId)
      .order("order_number");
    return data || [];
  };

  const handleCreate = () => {
    setView("create");
    setEditingModule(null);
    setWeekNumber(1);
    setTitle("");
    setDescription("");
    setIsPublished(false);
    setSections([
      {
        title: "",
        content: "",
        code_example: "",
        code_language: "python",
        order_number: 1,
      },
    ]);
    setModuleFiles([]);
    setErrorMsg("");
  };

  const handleEdit = async (mod: Module) => {
    setEditingModule(mod);
    setWeekNumber(mod.week_number);
    setTitle(mod.title);
    setDescription(mod.description || "");
    setIsPublished(mod.is_published);
    const secs = await fetchSections(mod.id);
    setSections(
      secs.length > 0
        ? secs
        : [
            {
              title: "",
              content: "",
              code_example: "",
              code_language: "python",
              order_number: 1,
            },
          ],
    );
    await fetchModuleFiles(mod.id);
    setView("edit");
    setErrorMsg("");
  };

  const addSection = () => {
    setSections([
      ...sections,
      {
        title: "",
        content: "",
        code_example: "",
        code_language: "python",
        order_number: sections.length + 1,
      },
    ]);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const updateSection = (
    index: number,
    field: keyof Section,
    value: string,
  ) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    setSections(updated);
  };

  const handleSave = async () => {
    if (!title) {
      setErrorMsg("Judul modul wajib diisi!");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (editingModule) {
      // Update modul
      await supabase
        .from("modules")
        .update({
          week_number: weekNumber,
          title,
          description,
          is_published: isPublished,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingModule.id);

      // Hapus sections lama
      await supabase
        .from("module_sections")
        .delete()
        .eq("module_id", editingModule.id);

      // Insert sections baru
      const validSections = sections.filter((s) => s.title);
      if (validSections.length > 0) {
        await supabase.from("module_sections").insert(
          validSections.map((s, i) => ({
            ...s,
            module_id: editingModule.id,
            order_number: i + 1,
          })),
        );
      }
    } else {
      // Cek apakah minggu sudah ada
      const existing = modules.find((m) => m.week_number === weekNumber);
      if (existing) {
        setErrorMsg("Modul minggu " + weekNumber + " sudah ada!");
        setSaving(false);
        return;
      }

      // Buat modul baru
      const { data: newModule, error } = await supabase
        .from("modules")
        .insert({
          week_number: weekNumber,
          title,
          description,
          is_published: isPublished,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error || !newModule) {
        setErrorMsg("Gagal membuat modul!");
        setSaving(false);
        return;
      }

      // Insert sections
      const validSections = sections.filter((s) => s.title);
      if (validSections.length > 0) {
        await supabase.from("module_sections").insert(
          validSections.map((s, i) => ({
            ...s,
            module_id: newModule.id,
            order_number: i + 1,
          })),
        );
      }
    }

    setSuccessMsg("Modul berhasil disimpan! ✅");
    await fetchModules();
    setSaving(false);
    setView("list");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleUploadFile = async () => {
    if (!selectedFile || !fileTitle || !editingModule) {
      setErrorMsg("Judul dan file wajib diisi!");
      return;
    }
    setUploading(true);
    setErrorMsg("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const fileExt = selectedFile.name.split(".").pop();
    const filePath = "week-" + weekNumber + "/" + Date.now() + "." + fileExt;

    const { error: uploadError } = await supabase.storage
      .from("modules")
      .upload(filePath, selectedFile);

    if (uploadError) {
      setErrorMsg("Gagal upload: " + uploadError.message);
      setUploading(false);
      return;
    }

    await supabase.from("module_files").insert({
      module_id: editingModule.id,
      week_number: weekNumber,
      title: fileTitle,
      description: fileDesc,
      file_name: selectedFile.name,
      file_path: filePath,
      file_type: selectedFile.type,
      file_size: selectedFile.size,
      uploaded_by: user?.id,
    });

    setFileTitle("");
    setFileDesc("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    await fetchModuleFiles(editingModule.id);
    setUploading(false);
    setSuccessMsg("File berhasil diupload! ✅");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleDeleteFile = async (file: ModuleFile) => {
    if (!confirm("Hapus file " + file.title + "?")) return;
    const supabase = createClient();
    await supabase.storage.from("modules").remove([file.file_path]);
    await supabase.from("module_files").delete().eq("id", file.id);
    if (editingModule) await fetchModuleFiles(editingModule.id);
  };

  const togglePublish = async (mod: Module) => {
    const supabase = createClient();
    await supabase
      .from("modules")
      .update({ is_published: !mod.is_published })
      .eq("id", mod.id);
    await fetchModules();
  };

  const handleDelete = async (mod: Module) => {
    if (!confirm("Hapus modul " + mod.title + "? Semua konten akan terhapus!"))
      return;
    const supabase = createClient();
    await supabase.from("modules").delete().eq("id", mod.id);
    await fetchModules();
  };

  const getPublicUrl = (filePath: string) => {
    const supabase = createClient();
    const { data } = supabase.storage.from("modules").getPublicUrl(filePath);
    return data.publicUrl;
  };

  if (view === "create" || view === "edit") {
    return (
      <div className={styles.page}>
        <div className={styles.formHeader}>
          <button onClick={() => setView("list")} className={styles.backBtn}>
            ← Kembali
          </button>
          <h1 className={styles.formHeaderTitle}>
            {view === "create" ? "➕ Buat Modul Baru" : "✏️ Edit Modul"}
          </h1>
        </div>

        {successMsg && <div className={styles.successMsg}>{successMsg}</div>}
        {errorMsg && <div className={styles.errorMsg}>{errorMsg}</div>}

        <div className={styles.formCard}>
          <h2 className={styles.sectionLabel}>📋 Informasi Modul</h2>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Minggu ke- *</label>
              <select
                value={weekNumber}
                onChange={(e) => setWeekNumber(Number(e.target.value))}
                className={styles.select}
                disabled={view === "edit"}
              >
                {Array.from({ length: 16 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>
                    Minggu {w}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Status</label>
              <div className={styles.toggleRow}>
                <span className={styles.toggleLabel}>
                  {isPublished ? "✅ Dipublikasikan" : "⏸️ Draft"}
                </span>
                <button
                  onClick={() => setIsPublished(!isPublished)}
                  className={isPublished ? styles.toggleOn : styles.toggleOff}
                >
                  {isPublished ? "ON" : "OFF"}
                </button>
              </div>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Judul Modul *</label>
            <input
              type="text"
              placeholder="Contoh: Pengenalan Pemrograman"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Deskripsi Modul</label>
            <textarea
              placeholder="Deskripsi singkat tentang modul ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.textarea}
              rows={2}
            />
          </div>
        </div>

        <div className={styles.formCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionLabel}>📖 Konten Modul</h2>
            <button onClick={addSection} className={styles.addSectionBtn}>
              + Tambah Bagian
            </button>
          </div>

          {sections.map((sec, i) => (
            <div key={i} className={styles.sectionCard}>
              <div className={styles.sectionCardHeader}>
                <span className={styles.sectionNum}>Bagian {i + 1}</span>
                {sections.length > 1 && (
                  <button
                    onClick={() => removeSection(i)}
                    className={styles.removeSectionBtn}
                  >
                    ✕ Hapus
                  </button>
                )}
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Judul Bagian *</label>
                <input
                  type="text"
                  placeholder="Contoh: Apa itu Pemrograman?"
                  value={sec.title}
                  onChange={(e) => updateSection(i, "title", e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Penjelasan / Konten</label>
                <textarea
                  placeholder="Tulis penjelasan materi di sini..."
                  value={sec.content}
                  onChange={(e) => updateSection(i, "content", e.target.value)}
                  className={styles.textarea}
                  rows={4}
                />
              </div>
              <div className={styles.codeGroup}>
                <div className={styles.inputGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>Contoh Kode (opsional)</label>
                  <textarea
                    placeholder="Tulis contoh kode di sini..."
                    value={sec.code_example}
                    onChange={(e) =>
                      updateSection(i, "code_example", e.target.value)
                    }
                    className={styles.codeArea}
                    rows={4}
                  />
                </div>
                <div className={styles.inputGroup} style={{ width: "140px" }}>
                  <label className={styles.label}>Bahasa</label>
                  <select
                    value={sec.code_language}
                    onChange={(e) =>
                      updateSection(i, "code_language", e.target.value)
                    }
                    className={styles.select}
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                    <option value="c">C</option>
                    <option value="cpp">C++</option>
                    <option value="pseudocode">Pseudocode</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {view === "edit" && (
          <div className={styles.formCard}>
            <h2 className={styles.sectionLabel}>📎 File & Lampiran</h2>

            {moduleFiles.length > 0 && (
              <div className={styles.existingFiles}>
                {moduleFiles.map((file) => (
                  <div key={file.id} className={styles.fileItem}>
                    <span className={styles.fileIcon}>
                      {getFileIcon(file.file_type)}
                    </span>
                    <div className={styles.fileInfo}>
                      <div className={styles.fileTitle}>{file.title}</div>
                      <div className={styles.fileMeta}>
                        {file.file_name} · {formatSize(file.file_size)}
                      </div>
                    </div>
                    <div className={styles.fileActions}>
                      <a
                        href={getPublicUrl(file.file_path)}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.viewBtn}
                      >
                        👁️ Lihat
                      </a>
                      <button
                        onClick={() => handleDeleteFile(file)}
                        className={styles.deleteFileBtn}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.uploadSection}>
              <h3 className={styles.uploadTitle}>Upload File Baru</h3>
              <div className={styles.uploadGrid}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Judul File *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Slide Pertemuan 1"
                    value={fileTitle}
                    onChange={(e) => setFileTitle(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Deskripsi</label>
                  <input
                    type="text"
                    placeholder="Deskripsi singkat..."
                    value={fileDesc}
                    onChange={(e) => setFileDesc(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  Pilih File (PDF, Word, PowerPoint)
                </label>
                <div className={styles.fileDropzone}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    onChange={(e) =>
                      setSelectedFile(e.target.files?.[0] || null)
                    }
                    className={styles.fileInput}
                    id="fileUpload"
                  />
                  <label htmlFor="fileUpload" className={styles.fileLabel}>
                    {selectedFile ? (
                      <div className={styles.fileSelected}>
                        <span>{getFileIcon(selectedFile.type)}</span>
                        <div>
                          <div className={styles.fileSelectedName}>
                            {selectedFile.name}
                          </div>
                          <div className={styles.fileSelectedSize}>
                            {formatSize(selectedFile.size)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.filePlaceholder}>
                        <span className={styles.fileUploadIcon}>📂</span>
                        <div className={styles.fileUploadText}>
                          Klik untuk pilih file
                        </div>
                        <div className={styles.fileUploadHint}>
                          PDF, Word, PowerPoint (maks 50MB)
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>
              <button
                onClick={handleUploadFile}
                disabled={uploading}
                className={styles.uploadFileBtn}
              >
                {uploading ? "⏳ Mengupload..." : "⬆️ Upload File"}
              </button>
            </div>
          </div>
        )}

        {view === "create" && (
          <div className={styles.noteCard}>
            💡 Setelah modul dibuat, kamu bisa upload file lampiran dengan klik
            tombol Edit pada modul.
          </div>
        )}

        <div className={styles.formActions}>
          <button onClick={() => setView("list")} className={styles.cancelBtn}>
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={styles.saveBtn}
          >
            {saving ? "⏳ Menyimpan..." : "💾 Simpan Modul"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Kelola Modul</h1>
          <p className={styles.pageSubtitle}>
            Buat dan kelola modul pembelajaran
          </p>
        </div>
        <button onClick={handleCreate} className={styles.createBtn}>
          ➕ Buat Modul Baru
        </button>
      </div>

      {successMsg && <div className={styles.successMsg}>{successMsg}</div>}

      {loading ? (
        <div className={styles.loadingText}>Memuat modul...</div>
      ) : modules.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📚</div>
          <p>Belum ada modul. Buat modul pertama!</p>
          <button onClick={handleCreate} className={styles.createBtn}>
            ➕ Buat Modul Baru
          </button>
        </div>
      ) : (
        <div className={styles.moduleList}>
          {modules.map((mod) => (
            <div key={mod.id} className={styles.moduleCard}>
              <div className={styles.moduleInfo}>
                <div className={styles.moduleWeek}>
                  Minggu {mod.week_number}
                </div>
                <div className={styles.moduleTitle}>{mod.title}</div>
                {mod.description && (
                  <div className={styles.moduleDesc}>{mod.description}</div>
                )}
                <div className={styles.moduleMeta}>
                  Dibuat: {new Date(mod.created_at).toLocaleDateString("id-ID")}
                </div>
              </div>
              <div className={styles.moduleActions}>
                <span
                  className={
                    mod.is_published ? styles.publishedBadge : styles.draftBadge
                  }
                >
                  {mod.is_published ? "✅ Publik" : "⏸️ Draft"}
                </span>
                <button
                  onClick={() => togglePublish(mod)}
                  className={styles.publishBtn}
                >
                  {mod.is_published ? "Sembunyikan" : "Publikasikan"}
                </button>
                <button
                  onClick={() => handleEdit(mod)}
                  className={styles.editBtn}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(mod)}
                  className={styles.deleteBtn}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
