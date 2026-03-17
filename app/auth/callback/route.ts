import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Handles Supabase auth callbacks (email confirmation, password reset, etc)
 * Called when user clicks links in emails
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");

  if (code && type === "recovery") {
    const supabase = await createClient();

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to reset password page where user can set new password
      return NextResponse.redirect(
        `${requestUrl.origin}/reset-password?session=true`,
      );
    }

    // If there was an error, redirect to forgot password with error
    return NextResponse.redirect(
      `${requestUrl.origin}/forgot-password?error=invalid_token`,
    );
  }

  // Default redirect if no valid code/type
  return NextResponse.redirect(`${requestUrl.origin}/login`);
}
