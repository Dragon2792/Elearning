"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "../login/login.module.css";
import regStyles from "./register.module.css";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Password tidak cocok!");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter!");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <div className={styles.brandContent}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>⚡</span>
            <span className={styles.logoText}>CodeLearn AI</span>
          </div>
          <h1 className={styles.tagline}>
            Mulai Perjalanan
            <br />
            Coding Kamu! 🚀
          </h1>
          <p className={styles.subTagline}>
            Bergabung dengan ribuan mahasiswa yang sudah belajar lebih efektif
            dengan AI Tutor.
          </p>
          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>✅</span>
              <span>Gratis untuk mahasiswa</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>🎯</span>
              <span>Belajar sesuai kurikulum</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>🏆</span>
              <span>Progress tracking otomatis</span>
            </div>
          </div>
        </div>
        <div className={styles.blob1} />
        <div className={styles.blob2} />
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formCard}>
          {success ? (
            <div className={regStyles.successState}>
              <div className={regStyles.successIcon}>🎉</div>
              <h2 className={regStyles.successTitle}>Pendaftaran Berhasil!</h2>
              <p className={regStyles.successText}>
                Cek email kamu untuk verifikasi akun, lalu login dan mulai
                belajar!
              </p>
              <Link href="/login" className={regStyles.goLoginBtn}>
                Pergi ke Login
              </Link>
            </div>
          ) : (
            <>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>Buat Akun Baru ✨</h2>
                <p className={styles.formSubtitle}>
                  Daftar gratis, mulai belajar sekarang
                </p>
              </div>

              {error && <div className={styles.errorBox}>{error}</div>}

              <form onSubmit={handleRegister} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Nama Lengkap</label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.inputIcon}>👤</span>
                    <input
                      type="text"
                      placeholder="Nama kamu"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={styles.input}
                      required
                    />
                  </div>
                </div>

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

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Password</label>
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
                    <span className={styles.inputIcon}>🔐</span>
                    <input
                      type="password"
                      placeholder="Ulangi password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={styles.input}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading}
                >
                  {loading ? (
                    <span className={styles.spinner} />
                  ) : (
                    "Daftar Sekarang"
                  )}
                </button>
              </form>

              <div className={styles.divider}>
                <span>atau</span>
              </div>

              <p className={styles.switchText}>
                Sudah punya akun?{" "}
                <Link href="/login" className={styles.switchLink}>
                  Masuk di sini
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
