import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.UAZAPI_TOKEN || '';
  return NextResponse.json({
    hasToken: !!token,
    tokenStart: token.substring(0, 8),
    baseUrl: process.env.UAZAPI_BASE_URL || 'not_set',
    session: process.env.UAZAPI_SESSION || 'not_set',
    geminiKeyStart: (process.env.GEMINI_API_KEY || '').substring(0, 8)
  });
}
