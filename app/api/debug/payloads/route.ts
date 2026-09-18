import { NextResponse } from 'next/server';

// Armazenar últimos 10 payloads em memória (só existe na instância)
const recentPayloads: { time: string; body: any }[] = [];
const MAX_PAYLOADS = 10;

export function addPayload(body: any) {
  recentPayloads.unshift({ time: new Date().toISOString(), body });
  if (recentPayloads.length > MAX_PAYLOADS) recentPayloads.pop();
}

export async function GET() {
  return NextResponse.json({
    count: recentPayloads.length,
    payloads: recentPayloads,
  });
}
