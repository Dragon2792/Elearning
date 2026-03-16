"use client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./detail.module.css";

const moduleContent: Record<
  number,
  {
    title: string;
    desc: string;
    sections: {
      title: string;
      content: string;
      code?: string;
      lang?: string;
    }[];
    summary: string[];
  }
> = {
  1: {
    title: "Pengenalan Pemrograman",
    desc: "Memahami konsep dasar pemrograman, algoritma, flowchart, dan pseudocode.",
    sections: [
      {
        title: "🤔 Apa itu Pemrograman?",
        content: `Pemrograman adalah proses memberikan instruksi kepada komputer untuk menyelesaikan suatu tugas. Instruksi-instruksi ini ditulis dalam bahasa yang bisa dipahami komputer, yang disebut bahasa pemrograman.\n\nKomputer sangat "bodoh" — dia hanya melakukan apa yang diperintahkan. Tugas programmer adalah memberikan instruksi yang tepat, jelas, dan berurutan.`,
      },
      {
        title: "📋 Algoritma",
        content: `Algoritma adalah urutan langkah-langkah logis untuk menyelesaikan suatu masalah. Algoritma harus:\n• Jelas dan tidak ambigu\n• Memiliki titik awal dan akhir\n• Menghasilkan output yang benar`,
        code: `# Algoritma dalam pseudocode
MULAI
  siapkan air
  didihkan air
  JIKA air sudah mendidih MAKA
    masukkan mie
    tunggu 3 menit
    tiriskan mie
    tambahkan bumbu
    aduk rata
  SELESAI JIKA
  sajikan mie
SELESAI`,
        lang: "pseudocode",
      },
      {
        title: "💻 Program Pertama",
        content: "Mari kita buat program pertama dalam Python:",
        code: `# Program pertama: Hello World
print("Hello, World!")
print("Selamat datang di dunia pemrograman!")

# Menampilkan angka
print(42)
print(3.14)`,
        lang: "python",
      },
    ],
    summary: [
      "Pemrograman adalah memberikan instruksi kepada komputer",
      "Algoritma adalah langkah-langkah logis untuk menyelesaikan masalah",
      "Python menggunakan print() untuk menampilkan output",
      "Komentar dalam Python menggunakan tanda #",
    ],
  },
  2: {
    title: "Variabel & Tipe Data",
    desc: "Memahami variabel, konstanta, dan berbagai tipe data dalam pemrograman.",
    sections: [
      {
        title: "📦 Apa itu Variabel?",
        content:
          "Variabel adalah wadah untuk menyimpan data. Bayangkan variabel seperti sebuah kotak berlabel — kamu bisa menyimpan sesuatu di dalamnya dan mengambilnya kapan saja.",
        code: `# Membuat variabel
nama = "Budi"
umur = 20
tinggi = 175.5
sudah_lulus = False

print(nama)
print(umur)
print(tinggi)
print(sudah_lulus)`,
        lang: "python",
      },
      {
        title: "🔢 Tipe Data",
        content: `Python memiliki beberapa tipe data dasar:\n• int — bilangan bulat: 1, -5, 100\n• float — bilangan desimal: 3.14, -0.5\n• str — teks: "Halo", 'Python'\n• bool — nilai benar/salah: True, False`,
        code: `nilai = 95
pi = 3.14159
nama = "Alice"
lulus = True

print(type(nilai))   # <class 'int'>
print(type(pi))      # <class 'float'>
print(type(nama))    # <class 'str'>
print(type(lulus))   # <class 'bool'>`,
        lang: "python",
      },
      {
        title: "🔄 Konversi Tipe Data",
        content: "Kadang kita perlu mengubah satu tipe data ke tipe lain:",
        code: `angka_str = "42"
angka_int = int(angka_str)
print(angka_int + 8)   # Output: 50

pi_str = "3.14"
pi_float = float(pi_str)
print(pi_float * 2)    # Output: 6.28

angka = 100
angka_str = str(angka)
print("Nilai: " + angka_str)`,
        lang: "python",
      },
    ],
    summary: [
      "Variabel adalah wadah untuk menyimpan data",
      "Python memiliki 4 tipe data dasar: int, float, str, bool",
      "Gunakan type() untuk mengecek tipe data",
      "Konversi tipe data menggunakan int(), float(), str()",
    ],
  },
  3: {
    title: "Percabangan",
    desc: "Struktur kontrol percabangan untuk pengambilan keputusan dalam program.",
    sections: [
      {
        title: "🔀 if sederhana",
        content: "Percabangan memungkinkan program untuk membuat keputusan:",
        code: `nilai = 85

if nilai >= 70:
    print("Selamat! Kamu lulus!")`,
        lang: "python",
      },
      {
        title: "↔️ if-else",
        content: "Gunakan else untuk menangani kondisi yang tidak terpenuhi:",
        code: `nilai = 55

if nilai >= 70:
    print("Lulus ✅")
else:
    print("Tidak Lulus ❌")`,
        lang: "python",
      },
      {
        title: "🔢 elif",
        content: "Gunakan elif untuk memeriksa beberapa kondisi:",
        code: `nilai = 78

if nilai >= 90:
    grade = "A"
elif nilai >= 80:
    grade = "B"
elif nilai >= 70:
    grade = "C"
else:
    grade = "D"

print(f"Grade kamu: {grade}")`,
        lang: "python",
      },
    ],
    summary: [
      "if digunakan untuk memeriksa satu kondisi",
      "else menangani kondisi yang tidak terpenuhi",
      "elif memeriksa beberapa kondisi secara berurutan",
      "Operator perbandingan: ==, !=, >, <, >=, <=",
    ],
  },
  4: {
    title: "Perulangan",
    desc: "Struktur perulangan untuk mengeksekusi kode berulang kali.",
    sections: [
      {
        title: "🔁 For Loop",
        content:
          "For loop digunakan ketika kamu tahu berapa kali ingin mengulang:",
        code: `for i in range(5):
    print(f"Iterasi ke-{i}")

for i in range(1, 11, 2):
    print(i)
# Output: 1, 3, 5, 7, 9`,
        lang: "python",
      },
      {
        title: "🔄 While Loop",
        content:
          "While loop digunakan ketika kamu tidak tahu berapa kali perulangan terjadi:",
        code: `hitung = 1

while hitung <= 5:
    print(f"Hitung: {hitung}")
    hitung += 1`,
        lang: "python",
      },
      {
        title: "⛔ break & continue",
        content: "break menghentikan loop, continue melewati iterasi saat ini:",
        code: `for i in range(10):
    if i == 5:
        break
    print(i)

for i in range(10):
    if i % 2 == 0:
        continue
    print(i)`,
        lang: "python",
      },
    ],
    summary: [
      "for loop untuk iterasi dengan jumlah yang diketahui",
      "while loop untuk iterasi dengan kondisi",
      "range(start, stop, step) untuk mengatur iterasi",
      "break menghentikan loop, continue melewati iterasi",
    ],
  },
  5: {
    title: "Fungsi & Prosedur",
    desc: "Membuat dan menggunakan fungsi untuk kode yang lebih modular.",
    sections: [
      {
        title: "📦 Membuat Fungsi",
        content: "Fungsi adalah blok kode yang dapat dipanggil berulang kali:",
        code: `def sapa(nama):
    print(f"Halo, {nama}!")

sapa("Budi")
sapa("Alice")`,
        lang: "python",
      },
      {
        title: "↩️ Return Value",
        content: "Fungsi bisa mengembalikan nilai menggunakan return:",
        code: `def luas_persegi(sisi):
    return sisi * sisi

luas = luas_persegi(5)
print(f"Luas: {luas}")`,
        lang: "python",
      },
      {
        title: "🎯 Parameter Default",
        content: "Parameter bisa memiliki nilai default:",
        code: `def perkenalan(nama, umur=17, kota="Jakarta"):
    print(f"Nama: {nama}, Umur: {umur}, Kota: {kota}")

perkenalan("Budi")
perkenalan("Alice", 20, "Bandung")`,
        lang: "python",
      },
    ],
    summary: [
      "Fungsi dibuat dengan keyword def",
      "Parameter adalah input yang diterima fungsi",
      "return digunakan untuk mengembalikan nilai",
      "Parameter dapat memiliki nilai default",
    ],
  },
  6: {
    title: "Array & List",
    desc: "Struktur data array dan list untuk menyimpan kumpulan data.",
    sections: [
      {
        title: "📋 List di Python",
        content: "List adalah struktur data untuk menyimpan kumpulan item:",
        code: `buah = ["apel", "mangga", "jeruk", "pisang"]

print(buah[0])   # apel
print(buah[-1])  # pisang
print(buah[1:3]) # ['mangga', 'jeruk']`,
        lang: "python",
      },
      {
        title: "✏️ Operasi List",
        content: "List memiliki berbagai operasi:",
        code: `nilai = [85, 90, 78, 92, 88]

nilai.append(95)
nilai.insert(0, 70)
nilai.remove(78)

print(len(nilai))
print(max(nilai))
print(min(nilai))
print(sum(nilai)/len(nilai))`,
        lang: "python",
      },
      {
        title: "🔄 Iterasi List",
        content: "Loop melalui elemen list:",
        code: `mahasiswa = ["Budi", "Alice", "Charlie"]

for i, nama in enumerate(mahasiswa):
    print(f"{i+1}. {nama}")

nilai = [80, 90, 75, 85, 95]
lulus = [n for n in nilai if n >= 80]
print(lulus)`,
        lang: "python",
      },
    ],
    summary: [
      "List menyimpan kumpulan data dalam satu variabel",
      "Index list dimulai dari 0",
      "append() menambah elemen di akhir",
      "len(), max(), min(), sum() untuk operasi list",
    ],
  },
  7: {
    title: "String Manipulation",
    desc: "Teknik pengolahan dan manipulasi teks/string.",
    sections: [
      {
        title: "📝 Dasar String",
        content: "String adalah kumpulan karakter:",
        code: `nama = "Python"

print(len(nama))     # 6
print(nama[0])       # P
print(nama[-1])      # n
print(nama[0:3])     # Pyt`,
        lang: "python",
      },
      {
        title: "🔧 String Methods",
        content: "Python memiliki banyak method untuk manipulasi string:",
        code: `teks = "  Halo Dunia Python  "

print(teks.upper())
print(teks.lower())
print(teks.strip())
print(teks.replace("Python", "Programming"))
print(teks.find("Dunia"))`,
        lang: "python",
      },
      {
        title: "🎨 String Formatting",
        content: "Cara modern untuk memformat string:",
        code: `nama = "Budi"
umur = 20
nilai = 95.5

print(f"Nama: {nama}, Umur: {umur}")
print(f"Nilai: {nilai:.2f}")

kalimat = "apel,mangga,jeruk"
buah = kalimat.split(",")
print(", ".join(buah))`,
        lang: "python",
      },
    ],
    summary: [
      "String bisa diakses seperti list menggunakan index",
      "upper(), lower() untuk mengubah case",
      "strip() menghapus whitespace di awal/akhir",
      "f-string adalah cara modern untuk formatting string",
    ],
  },
  8: {
    title: "OOP Dasar",
    desc: "Konsep dasar Object Oriented Programming.",
    sections: [
      {
        title: "🏗️ Class & Object",
        content: "Class adalah blueprint untuk membuat object:",
        code: `class Mahasiswa:
    def __init__(self, nama, nim):
        self.nama = nama
        self.nim = nim

    def perkenalan(self):
        print(f"Nama: {self.nama}, NIM: {self.nim}")

mhs = Mahasiswa("Budi", "12345")
mhs.perkenalan()`,
        lang: "python",
      },
      {
        title: "🔒 Enkapsulasi",
        content: "Enkapsulasi menyembunyikan detail implementasi:",
        code: `class RekeningBank:
    def __init__(self, pemilik, saldo=0):
        self.pemilik = pemilik
        self.__saldo = saldo

    def deposit(self, jumlah):
        self.__saldo += jumlah

    def cek_saldo(self):
        return self.__saldo

rekening = RekeningBank("Budi", 1000000)
rekening.deposit(500000)
print(rekening.cek_saldo())`,
        lang: "python",
      },
      {
        title: "👨‍👩‍👧 Inheritance",
        content: "Inheritance memungkinkan class mewarisi dari class lain:",
        code: `class Hewan:
    def __init__(self, nama, suara):
        self.nama = nama
        self.suara = suara

    def bersuara(self):
        print(f"{self.nama}: {self.suara}")

class Kucing(Hewan):
    def __init__(self, nama):
        super().__init__(nama, "Meow")

kucing = Kucing("Kitty")
kucing.bersuara()`,
        lang: "python",
      },
    ],
    summary: [
      "Class adalah blueprint, object adalah instance-nya",
      "__init__ adalah constructor untuk inisialisasi object",
      "Enkapsulasi melindungi data dengan private attribute",
      "Inheritance memungkinkan class mewarisi dari class lain",
    ],
  },
};

export default function ModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const week = Number(params.week);
  const mod = moduleContent[week];
  const [isCompleted, setIsCompleted] = useState(false);
  const [marking, setMarking] = useState(false);
  const [moduleFiles, setModuleFiles] = useState<
    {
      id: string;
      title: string;
      description: string;
      file_name: string;
      file_path: string;
      file_type: string;
      file_size: number;
    }[]
  >([]);

  useEffect(() => {
    const trackProgress = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Track progress
      await supabase.from("module_progress").upsert(
        {
          user_id: user.id,
          week_number: week,
          last_accessed: new Date().toISOString(),
        },
        { onConflict: "user_id,week_number" },
      );

      // Cek completed
      const { data: progressData } = await supabase
        .from("module_progress")
        .select("is_completed")
        .eq("user_id", user.id)
        .eq("week_number", week)
        .single();

      if (progressData) setIsCompleted(progressData.is_completed);

      // Fetch file modul dari database
      const { data: files } = await supabase
        .from("module_files")
        .select("*")
        .eq("week_number", week);
      if (files) setModuleFiles(files);
    };
    trackProgress();
  }, [week]);

  const markAsComplete = async () => {
    setMarking(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
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

  if (!mod) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>Modul tidak ditemukan</h2>
        <button onClick={() => router.back()}>← Kembali</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/dashboard/modules" className={styles.backLink}>
          ← Kembali ke Modul
        </Link>
        <div className={styles.weekBadge}>Minggu {week}</div>
        <h1 className={styles.title}>{mod.title}</h1>
        <p className={styles.desc}>{mod.desc}</p>
        {isCompleted && (
          <div className={styles.completedBadge}>
            ✅ Modul ini sudah kamu selesaikan!
          </div>
        )}
      </div>

      <div className={styles.sections}>
        {mod.sections.map((section, i) => (
          <div key={i} className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            <p className={styles.sectionContent}>{section.content}</p>
            {section.code && (
              <div className={styles.codeBlock}>
                <div className={styles.codeLang}>
                  {section.lang || "python"}
                </div>
                <pre>
                  <code>{section.code}</code>
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {moduleFiles.length > 0 && (
        <div className={styles.filesCard}>
          <div className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>📌 Ringkasan</h2>
            <ul className={styles.summaryList}>
              {mod.summary.map((point, i) => (
                <li key={i} className={styles.summaryItem}>
                  <span className={styles.summaryDot}>✅</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {/* Tombol Tandai Selesai */}
      {!isCompleted && (
        <button
          onClick={markAsComplete}
          disabled={marking}
          className={styles.completeBtn}
        >
          {marking ? "⏳ Menyimpan..." : "✅ Tandai Modul Selesai"}
        </button>
      )}

      <div className={styles.navigation}>
        {week > 1 && (
          <Link
            href={`/dashboard/modules/${week - 1}`}
            className={styles.navBtn}
          >
            ← Modul Sebelumnya
          </Link>
        )}
        <Link href="/dashboard/chat" className={styles.askBtn}>
          🤖 Tanya AI Tutor
        </Link>
        {week < 8 && (
          <Link
            href={`/dashboard/modules/${week + 1}`}
            className={styles.navBtn}
          >
            Modul Berikutnya →
          </Link>
        )}
      </div>
    </div>
  );
}
