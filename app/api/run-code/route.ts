import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { CONFIG } from "@/lib/config/constants";
import { createRateLimiter, getClientIdentifier } from "@/lib/utils/rate-limit";
import { validateRunCodeRequest } from "@/lib/schemas/api";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const rateLimiter = createRateLimiter(
  CONFIG.RATE_LIMIT.RUN_CODE.windowMs,
  CONFIG.RATE_LIMIT.RUN_CODE.requests,
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
    const validation = validateRunCodeRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Input tidak valid",
          details: validation.errors,
        },
        { status: 400 },
      );
    }

    const { code, language, stdin } = body;

    const prompt = `Kamu adalah interpreter kode. Jalankan kode ${language} berikut dan berikan outputnya saja.

Kode:
\`\`\`${language}
${code}
\`\`\`

${stdin ? `Input (stdin): ${stdin}` : ""}

PENTING:
- Berikan HANYA output dari kode tersebut
- Jika ada error, tulis pesan errornya
- Jangan tambahkan penjelasan apapun
- Jangan tambahkan teks lain selain output kode`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const output = response.choices[0]?.message?.content || "";

    // Truncate output if too large
    const truncatedOutput = output.substring(0, CONFIG.MAX_CODE_OUTPUT_SIZE);

    // Cek apakah output mengandung error
    const isError =
      truncatedOutput.toLowerCase().includes("error") ||
      truncatedOutput.toLowerCase().includes("traceback") ||
      truncatedOutput.toLowerCase().includes("exception");

    if (isError) {
      return NextResponse.json({ error: truncatedOutput });
    }

    return NextResponse.json({ output: truncatedOutput.trim() });
  } catch (error) {
    console.error("Run code error:", error);
    return NextResponse.json(
      { error: "Gagal menjalankan kode" },
      { status: 500 },
    );
  }
}
