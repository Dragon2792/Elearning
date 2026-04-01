import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CONFIG } from "@/lib/config/constants";
import { createRateLimiter, getClientIdentifier } from "@/lib/utils/rate-limit";
import { validateChatRequest } from "@/lib/schemas/api";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const rateLimiter = createRateLimiter(
  CONFIG.RATE_LIMIT.CHAT.windowMs,
  CONFIG.RATE_LIMIT.CHAT.requests,
);

export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  if (!rateLimiter(clientId)) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi dalam beberapa saat." },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();

    // Validate input
    const validation = validateChatRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Input tidak valid",
          details: validation.errors,
        },
        { status: 400 },
      );
    }

    const { messages, topic } = body;

    const supabase = await createClient();

    // Ambil modul & sections dari database, filter berdasarkan topik jika ada

    let query = supabase
      .from("modules")
      .select("id, week_number, title, description")
      .eq("is_published", true);

    if (topic && topic !== "Semua Topik") {
      // Gunakan ilike untuk pencarian case-insensitive yang mengandung kata topik
      // Ini akan mencari topik di judul atau deskripsi modul
      query = query.or(`title.ilike.%${topic}%,description.ilike.%${topic}%`);
    }

    const { data: modules } = await query.order("week_number");

    let moduleContext = "";
    let moduleSources = "";

    if (modules && modules.length > 0) {
      // Ambil sections dari semua modul
      const moduleIds = modules.map((m: { id: string }) => m.id);
      const { data: sections } = await supabase
        .from("module_sections")
        .select("module_id, title, content, code_example, code_language")
        .in("module_id", moduleIds);

      // Susun context dari modul
      modules.forEach(
        (mod: {
          id: string;
          week_number: number;
          title: string;
          description?: string;
        }) => {
          const modSections =
            sections?.filter(
              (s: { module_id: string }) => s.module_id === mod.id,
            ) || [];
          if (modSections.length > 0) {
            moduleContext += `\n=== Minggu ${mod.week_number}: ${mod.title} ===\n`;
            if (mod.description)
              moduleContext += `Deskripsi: ${mod.description}\n`;
            modSections.forEach(
              (sec: {
                title?: string;
                content?: string;
                code_example?: string;
                code_language?: string;
              }) => {
                if (sec.title) moduleContext += `\nBagian: ${sec.title}\n`;
                if (sec.content) moduleContext += `Konten: ${sec.content}\n`;
                if (sec.code_example)
                  moduleContext += `Contoh Kode (${sec.code_language}):\n${sec.code_example}\n`;
              },
            );
          }
          moduleSources += `- Minggu ${mod.week_number}: ${mod.title}\n`;
        },
      );
    }

    const hasModuleContent = moduleContext.length > 0;

    const SYSTEM_PROMPT = hasModuleContent
      ? `Kamu adalah AI Tutor untuk mata kuliah Dasar Pemrograman.

PRIORITAS UTAMA: Jawab berdasarkan modul yang tersedia di bawah ini. Selalu sebutkan sumber modul yang kamu gunakan.

MODUL YANG TERSEDIA:
${moduleContext}

INSTRUKSI:
1. Cari jawaban dari modul di atas terlebih dahulu
2. Jika pertanyaan ada di modul, jawab berdasarkan modul dan sebutkan sumbernya seperti: "[Sumber: Modul Minggu X - Judul Modul]"
3. Jika tidak ada di modul, jawab berdasarkan pengetahuan umum dan sebutkan sumbernya seperti: "[Sumber: Pengetahuan Umum - Topik]" atau "[Sumber: Dokumentasi Resmi Python/Java/dll]"
4. Selalu berikan contoh kode yang relevan
5. Gunakan bahasa Indonesia yang jelas
6. Di akhir jawaban, selalu tambahkan bagian "📚 Referensi:" yang mencantumkan sumber-sumber yang digunakan
7. Format contoh kode dalam blok kode

${topic ? `Topik saat ini: ${topic}` : ""}

Daftar modul yang tersedia:
${moduleSources}`
      : `Kamu adalah AI Tutor untuk mata kuliah Dasar Pemrograman.

INSTRUKSI:
1. Jawab pertanyaan pemrograman dengan jelas dan mudah dipahami
2. Selalu berikan contoh kode yang relevan
3. Gunakan bahasa Indonesia
4. Selalu sertakan sumber di akhir jawaban dalam format:
   "📚 Referensi:
   - [Nama Sumber]: [Deskripsi singkat]"
5. Contoh sumber: Dokumentasi Python, W3Schools, GeeksforGeeks, dll
6. Format contoh kode dalam blok kode

${topic ? `Topik saat ini: ${topic}` : ""}`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 2048,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    });

    const text = response.choices[0]?.message?.content || "";
    return NextResponse.json({ message: text });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Gagal mendapatkan respons dari AI" },
      { status: 500 },
    );
  }
}
