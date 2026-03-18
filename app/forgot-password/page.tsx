"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "../login/login.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      if (error) {
        setError(error.message || "Gagal mengirim email reset password");
        setLoading(false);
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setLoading(false);
    }
  };

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
            <p className={styles.subTagline}>
              Tanya apa saja tentang coding, dapatkan jawaban instan dengan
              contoh kode nyata.
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
              <h2 className={styles.formTitle}>Email Terkirim! 📧</h2>
              <p className={styles.formSubtitle}>
                Kami telah mengirimkan link reset password ke email kamu
              </p>
            </div>

            <div
              style={{
                background: "#d1fae5",
                border: "1px solid #86efac",
                color: "#16a34a",
                padding: "1rem",
                borderRadius: "10px",
                marginBottom: "1.5rem",
                textAlign: "center",
              }}
            >
              ✅ Silakan periksa email <strong>{email}</strong>
              <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
                Klik link di email untuk mengatur password baru
              </p>
            </div>

            <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
              Link reset password berlaku selama 1 jam. Jika belum menerima
              email, cek folder spam atau{" "}
              <button
                onClick={() => setSubmitted(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6366f1",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                coba lagi
              </button>
              .
            </p>

            <Link href="/login" className={styles.submitBtn}>
              ← Kembali ke Login
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
            <h2 className={styles.formTitle}>Reset Password 🔐</h2>
            <p className={styles.formSubtitle}>
              Masukkan email akun CodeLearn kamu
            </p>
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Email</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>📧</span>
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <p
              style={{
                color: "#64748b",
                fontSize: "0.9rem",
                marginBottom: "1.5rem",
              }}
            >
              Kami akan mengirimkan link untuk mengatur password baru ke email
              ini. Link berlaku selama 1 jam.
            </p>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Mengirim..." : "Kirim Link Reset"}
            </button>
          </form>

          <div className={styles.divider}>
            <span>atau</span>
          </div>

          <p className={styles.switchText}>
            Ingat password kamu?{" "}
            <Link href="/login" className={styles.switchLink}>
              Masuk Sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
