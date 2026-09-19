import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => { headers[key] = value; });

  console.log('[Uazapi Debug] Headers:', JSON.stringify(headers));
  console.log('[Uazapi Debug] Body:', JSON.stringify(body));

  return NextResponse.json({ ok: true, received: true, timestamp: new Date().toISOString() });
}

export async function GET() {
  return NextResponse.json({ status: 'debug endpoint ready' });
}
