"use client";
import { useState } from "react";
import styles from "./code.module.css";

const LANGUAGES = [
  {
    id: "python",
    name: "Python",
    version: "3.10.0",
    defaultCode:
      '# Tulis kode Python di sini\nprint("Hello, World!")\n\n# Contoh:\nname = "Mahasiswa"\nprint(f"Halo, {name}!")',
  },
  {
    id: "javascript",
    name: "JavaScript",
    version: "18.15.0",
    defaultCode:
      '// Tulis kode JavaScript di sini\nconsole.log("Hello, World!");\n\n// Contoh:\nconst name = "Mahasiswa";\nconsole.log(`Halo, ${name}!`);',
  },
  {
    id: "java",
    name: "Java",
    version: "15.0.2",
    defaultCode:
      'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n        \n        // Contoh:\n        String name = "Mahasiswa";\n        System.out.println("Halo, " + name + "!");\n    }\n}',
  },
  {
    id: "c",
    name: "C",
    version: "10.2.0",
    defaultCode:
      '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    \n    // Contoh:\n    char name[] = "Mahasiswa";\n    printf("Halo, %s!\\n", name);\n    \n    return 0;\n}',
  },
  {
    id: "cpp",
    name: "C++",
    version: "10.2.0",
    defaultCode:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    \n    // Contoh:\n    string name = "Mahasiswa";\n    cout << "Halo, " << name << "!" << endl;\n    \n    return 0;\n}',
  },
];

export default function CodeRunnerPage() {
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(LANGUAGES[0].defaultCode);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [stdin, setStdin] = useState("");
  const [showStdin, setShowStdin] = useState(false);

  const handleLangChange = (langId: string) => {
    const lang = LANGUAGES.find((l) => l.id === langId);
    if (lang) {
      setSelectedLang(lang);
      setCode(lang.defaultCode);
      setOutput("");
      setError("");
    }
  };

  const runCode = async () => {
    setRunning(true);
    setOutput("");
    setError("");

    try {
      const res = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language: selectedLang.id,
          stdin,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setOutput(data.output);
      }
    } catch {
      setError("Gagal terhubung ke server. Coba lagi!");
    } finally {
      setRunning(false);
    }
  };

  const clearCode = () => {
    setCode(selectedLang.defaultCode);
    setOutput("");
    setError("");
    setStdin("");
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Code Runner</h1>
          <p className={styles.subtitle}>
            Tulis dan jalankan kode langsung di browser
          </p>
        </div>
        <div className={styles.headerRight}>
          <select
            value={selectedLang.id}
            onChange={(e) => handleLangChange(e.target.value)}
            className={styles.langSelect}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
          <button onClick={clearCode} className={styles.clearBtn}>
            🗑️ Reset
          </button>
          <button
            onClick={runCode}
            disabled={running}
            className={styles.runBtn}
          >
            {running ? "⏳ Running..." : "▶️ Jalankan"}
          </button>
        </div>
      </div>

      <div className={styles.editor}>
        <div className={styles.editorPanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>📝 Editor</span>
            <span className={styles.langBadge}>{selectedLang.name}</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={styles.codeEditor}
            spellCheck={false}
            placeholder="Tulis kode di sini..."
          />
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.outputPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>
                {error ? "❌ Error" : "✅ Output"}
              </span>
              {running && (
                <span className={styles.runningBadge}>Running...</span>
              )}
            </div>
            <div className={styles.outputContent}>
              {running ? (
                <div className={styles.runningState}>
                  <div className={styles.spinner} />
                  <span>Menjalankan kode...</span>
                </div>
              ) : error ? (
                <pre className={styles.errorOutput}>{error}</pre>
              ) : output ? (
                <pre className={styles.successOutput}>{output}</pre>
              ) : (
                <div className={styles.emptyOutput}>
                  <span className={styles.emptyIcon}>▶️</span>
                  <p>Klik Jalankan untuk melihat output</p>
                </div>
              )}
            </div>
          </div>

          <div className={styles.stdinPanel}>
            <div
              className={styles.stdinHeader}
              onClick={() => setShowStdin(!showStdin)}
            >
              <span className={styles.panelTitle}>⌨️ Input (stdin)</span>
              <span>{showStdin ? "▲" : "▼"}</span>
            </div>
            {showStdin && (
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                className={styles.stdinInput}
                placeholder="Masukkan input untuk program kamu..."
                rows={3}
              />
            )}
          </div>
        </div>
      </div>

      <div className={styles.tips}>
        <h3 className={styles.tipsTitle}>💡 Tips</h3>
        <div className={styles.tipsList}>
          <span className={styles.tip}>Pilih bahasa pemrograman di atas</span>
          <span className={styles.tip}>
            Klik Jalankan atau tekan untuk eksekusi
          </span>
          <span className={styles.tip}>
            Gunakan Input untuk program yang butuh input
          </span>
          <span className={styles.tip}>
            Klik Reset untuk kembali ke kode default
          </span>
        </div>
      </div>
    </div>
  );
}
