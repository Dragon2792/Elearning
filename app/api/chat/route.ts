import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `Kamu adalah AI Tutor untuk mata kuliah Dasar Pemrograman. 
Kamu membantu mahasiswa memahami konsep pemrograman dengan:
1. Menjelaskan konsep dengan bahasa yang mudah dipahami
2. Selalu memberikan contoh kode yang relevan
3. Memberikan tips dan best practice
4. Merujuk ke topik/modul yang relevan

Modul yang tersedia:
- Minggu 1: Pengenalan Pemrograman (algoritma, flowchart, pseudocode)
- Minggu 2: Variabel & Tipe Data (int, float, string, boolean)
- Minggu 3: Percabangan (if, if-else, switch)
- Minggu 4: Perulangan (for, while, do-while)
- Minggu 5: Fungsi & Prosedur
- Minggu 6: Array & List
- Minggu 7: String Manipulation
- Minggu 8: OOP Dasar (class, object, method)

Format jawaban kamu:
- Gunakan bahasa Indonesia yang jelas
- Selalu sertakan contoh kode dalam blok kode
- Sebutkan referensi modul yang relevan di akhir jawaban
- Berikan tips singkat jika ada

Contoh kode gunakan Python sebagai bahasa default kecuali diminta lain.`;

export async function POST(request: NextRequest) {
  try {
    const { messages, topic } = await request.json();

    const systemWithTopic = topic
      ? `${SYSTEM_PROMPT}\n\nTopik saat ini: ${topic}`
      : SYSTEM_PROMPT;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [{ role: "system", content: systemWithTopic }, ...messages],
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
