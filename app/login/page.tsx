"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Email atau password salah!");
      setLoading(false);
    } else {
      // Cek role user
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
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
            <h2 className={styles.formTitle}>Selamat Datang! 👋</h2>
            <p className={styles.formSubtitle}>Masuk ke akun CodeLearn kamu</p>
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form onSubmit={handleLogin} className={styles.form}>
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
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <div className={styles.forgotRow}>
              <Link href="/forgot-password" className={styles.forgotLink}>
                Lupa password?
              </Link>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? <span className={styles.spinner} /> : "Masuk Sekarang"}
            </button>
          </form>

          <div className={styles.divider}>
            <span>atau</span>
          </div>

          <p className={styles.switchText}>
            Belum punya akun?{" "}
            <Link href="/register" className={styles.switchLink}>
              Daftar Gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
