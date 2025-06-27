import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const error = searchParams.get('error');
  const error_code = searchParams.get('error_code');
  
  if (error === 'access_denied' && error_code === 'otp_expired') {
    const redirectTo = request.nextUrl.clone();
    redirectTo.pathname = '/auth/auth-code-error';
    return NextResponse.redirect(redirectTo);
  }
  
  return NextResponse.next();
}
