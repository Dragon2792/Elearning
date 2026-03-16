"use client";
import { useState, useRef, useEffect } from "react";
import styles from "./chat.module.css";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const TOPICS = [
  "Semua Topik",
  "Pengenalan Pemrograman",
  "Variabel & Tipe Data",
  "Percabangan",
  "Perulangan",
  "Fungsi & Prosedur",
  "Array & List",
  "String Manipulation",
  "OOP Dasar",
];

const SAMPLE_QUESTIONS = [
  "Apa itu variabel dan bagaimana cara mendeklarasikannya?",
  "Jelaskan perbedaan for loop dan while loop!",
  "Bagaimana cara membuat fungsi di Python?",
  "Apa itu array dan kapan sebaiknya digunakan?",
  "Contoh penggunaan if-else dalam kasus nyata?",
];

function formatMessage(text: string) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const lines = part.split("\n");
      const lang = lines[0].replace("```", "") || "code";
      const code = lines.slice(1, -1).join("\n");
      return (
        <div key={i} className={styles.codeBlock}>
          <div className={styles.codeLang}>{lang}</div>
          <pre>
            <code>{code}</code>
          </pre>
        </div>
      );
    }
    return (
      <span key={i} style={{ whiteSpace: "pre-wrap" }}>
        {part}
      </span>
    );
  });
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("Semua Topik");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    const userMessage: Message = { role: "user", content: userText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          topic: topic !== "Semua Topik" ? topic : null,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages([
        ...newMessages,
        { role: "assistant", content: data.message },
      ]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "❌ Maaf, terjadi kesalahan. Silakan coba lagi.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.aiAvatar}>🤖</div>
          <div>
            <h1 className={styles.title}>AI Tutor</h1>
            <p className={styles.subtitle}>
              Powered by Claude AI · Siap membantu 24/7
            </p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className={styles.topicSelect}
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} className={styles.clearBtn}>
              🗑️ Hapus Chat
            </button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={styles.chatArea}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🤖</div>
            <h2 className={styles.emptyTitle}>Halo! Saya AI Tutor kamu</h2>
            <p className={styles.emptySubtitle}>
              Tanyakan apa saja tentang materi pemrograman. Saya akan menjawab
              dengan penjelasan dan contoh kode!
            </p>
            <div className={styles.sampleGrid}>
              {SAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  className={styles.sampleBtn}
                  onClick={() => sendMessage(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.messageList}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`${styles.messageBubble} ${msg.role === "user" ? styles.userBubble : styles.aiBubble}`}
              >
                {msg.role === "assistant" && (
                  <div className={styles.aiLabel}>🤖 AI Tutor</div>
                )}
                <div className={styles.messageContent}>
                  {msg.role === "assistant"
                    ? formatMessage(msg.content)
                    : msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className={`${styles.messageBubble} ${styles.aiBubble}`}>
                <div className={styles.aiLabel}>🤖 AI Tutor</div>
                <div className={styles.typingIndicator}>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tanyakan sesuatu tentang pemrograman... (Enter untuk kirim)"
            className={styles.textarea}
            rows={1}
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className={styles.sendBtn}
          >
            {loading ? "⏳" : "➤"}
          </button>
        </div>
        <p className={styles.inputHint}>
          Shift+Enter untuk baris baru · Pilih topik di atas untuk jawaban lebih
          fokus
        </p>
      </div>
    </div>
  );
}
