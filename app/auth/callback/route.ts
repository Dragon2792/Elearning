import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type"); // recovery, signup, or invite
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();

    // Exchange the auth code for a user session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Jika flow adalah reset password (recovery), arahkan ke form reset
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password?session=true`);
      }

      // Default: login sukses, arahkan ke dashboard
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Jika gagal, kembalikan ke login dengan pesan error
  return NextResponse.redirect(`${origin}/login?error=auth_code_error`);
}
