"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "../login/login.module.css";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    // Check if user has valid session from reset link
    const checkSession = async () => {
      const session = new URLSearchParams(window.location.search).get(
        "session",
      );
      if (session === "true") {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setIsValidSession(true);
        } else {
          setError(
            "Link reset password tidak valid atau sudah kadaluarsa. Silakan coba lagi.",
          );
        }
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!password) {
      setError("Password tidak boleh kosong");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak sama");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message || "Gagal mengubah password");
        setLoading(false);
      } else {
        // Sign out Supabase session agar user benar-benar logout
        await supabase.auth.signOut();
        setSubmitted(true);
        // Redirect to login after 2 detik
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setLoading(false);
    }
  };

  if (!isValidSession && !error) {
    return (
      <div className={styles.container}>
        <div className={styles.leftPanel}>
          <div className={styles.brandContent}>
            <div className={styles.logo}>
              <span className={styles.logoIcon}>⚡</span>
              <span className={styles.logoText}>CodeLearn AI</span>
            </div>
          </div>
        </div>
        <div className={styles.rightPanel}>
          <div className={styles.formCard}>
            <p style={{ textAlign: "center", color: "#94a3b8" }}>
              Memverifikasi link reset password...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={styles.container}>
        <div className={styles.leftPanel}>
          <div className={styles.brandContent}>
            <div className={styles.logo}>
              <span className={styles.logoIcon}>⚡</span>
              <span className={styles.logoText}>CodeLearn AI</span>
            </div>
            <h1 className={styles.tagline}>
              Belajar Pemrograman
              <br />
              dengan AI Tutor
            </h1>
          </div>
          <div className={styles.blob1} />
          <div className={styles.blob2} />
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Password Berhasil Diubah! ✅</h2>
              <p className={styles.formSubtitle}>
                Password kamu telah berhasil diperbarui
              </p>
            </div>

            <div
              style={{
                background: "#d1fae5",
                border: "1px solid #86efac",
                color: "#16a34a",
                padding: "1.5rem",
                borderRadius: "10px",
                textAlign: "center",
                marginBottom: "1.5rem",
              }}
            >
              <p style={{ marginBottom: "0.5rem" }}>
                Kamu sekarang dapat masuk dengan password baru kamu.
              </p>
              <p style={{ fontSize: "0.9rem" }}>
                Dialihkan ke halaman login dalam beberapa detik...
              </p>
            </div>

            <Link href="/login" className={styles.submitBtn}>
              ← Masuk Sekarang
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <div className={styles.brandContent}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>⚡</span>
            <span className={styles.logoText}>CodeLearn AI</span>
          </div>
          <h1 className={styles.tagline}>
            Belajar Pemrograman
            <br />
            dengan AI Tutor
          </h1>
          <p className={styles.subTagline}>
            Tanya apa saja tentang coding, dapatkan jawaban instan dengan contoh
            kode nyata.
          </p>
          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>🤖</span>
              <span>AI Tutor 24/7 siap membantu</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>💻</span>
              <span>Contoh kode interaktif</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>📚</span>
              <span>Materi terstruktur per minggu</span>
            </div>
          </div>
        </div>
        <div className={styles.blob1} />
        <div className={styles.blob2} />
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Password Baru 🔐</h2>
            <p className={styles.formSubtitle}>
              Masukkan password baru untuk akun kamu
            </p>
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Password Baru</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>🔒</span>
                <input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Konfirmasi Password</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>🔒</span>
                <input
                  type="password"
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <p
              style={{
                color: "#64748b",
                fontSize: "0.85rem",
                marginBottom: "1.5rem",
              }}
            >
              💡 Gunakan password yang kuat dengan kombinasi huruf, angka, dan
              simbol
            </p>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Mengubah Password..." : "Ubah Password"}
            </button>
          </form>

          <p className={styles.switchText}>
            <Link href="/login" className={styles.switchLink}>
              ← Kembali ke Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
