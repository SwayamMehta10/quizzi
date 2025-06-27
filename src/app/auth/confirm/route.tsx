import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  
  if (token_hash && type) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      // Always redirect to complete-profile for new users after email confirmation
      // The complete-profile page will handle checking if they need to complete setup
      const redirectTo = request.nextUrl.clone()
      redirectTo.pathname = '/complete-profile'
      redirectTo.search = '' // Clear search params to avoid URL encoding issues
      return NextResponse.redirect(redirectTo)
    }
  }
  
  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = '/auth/auth-code-error'
  redirectTo.search = ''
  return NextResponse.redirect(redirectTo)
}
