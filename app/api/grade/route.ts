import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { question, rubric, answer } = await request.json();

    const prompt = `Kamu adalah penilai ujian pemrograman. Nilai jawaban mahasiswa berdasarkan rubrik yang diberikan.

Soal: ${question}

Rubrik Penilaian: ${rubric}

Jawaban Mahasiswa: ${answer}

Berikan penilaian dalam format JSON berikut (HANYA JSON, tanpa teks lain):
{
  "score": <angka 0-100>,
  "feedback": "<feedback konstruktif dalam bahasa Indonesia>",
  "passed": <true jika score >= 70, false jika tidak>
}`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.choices[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Grade API error:", error);
    return NextResponse.json(
      { error: "Gagal menilai jawaban" },
      { status: 500 },
    );
  }
}
