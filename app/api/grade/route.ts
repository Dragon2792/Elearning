import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { CONFIG } from "@/lib/config/constants";
import { createRateLimiter, getClientIdentifier } from "@/lib/utils/rate-limit";
import { validateGradeRequest } from "@/lib/schemas/api";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const rateLimiter = createRateLimiter(
  CONFIG.RATE_LIMIT.GRADE.windowMs,
  CONFIG.RATE_LIMIT.GRADE.requests,
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
    const validation = validateGradeRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Input tidak valid",
          details: validation.errors,
        },
        { status: 400 },
      );
    }

    const { question, rubric, answer } = body;

    const prompt = `Kamu adalah penilai ujian pemrograman. Nilai jawaban mahasiswa berdasarkan rubrik yang diberikan.

Soal: ${question}

Rubrik Penilaian: ${rubric}

Jawaban Mahasiswa: ${answer}

Berikan penilaian dalam format JSON berikut (HANYA JSON, tanpa teks lain):
{
  "score": <angka 0-100>,
  "feedback": "<feedback konstruktif dalam bahasa Indonesia>",
  "passed": <true jika score >= ${CONFIG.PASSING_SCORE}, false jika tidak>
}`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.choices[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();

    let result;
    try {
      result = JSON.parse(clean);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Input:", clean);
      // Fallback response if JSON parsing fails
      return NextResponse.json({
        score: 0,
        feedback: "Terjadi kesalahan saat menilai. Silakan coba lagi.",
        passed: false,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Grade API error:", error);
    return NextResponse.json(
      { error: "Gagal menilai jawaban" },
      { status: 500 },
    );
  }
}
