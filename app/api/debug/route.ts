import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'GEMINI_API_KEY não configurada', keyPresent: false });
  }

  // Test 1: Basic Gemini call (sem tools)
  let basicTest: any = { ok: false };
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'Responda apenas: OK' }] }],
    });
    basicTest = { ok: true, reply: response.text };
  } catch (err: any) {
    basicTest = {
      ok: false,
      error: err?.message || String(err),
      status: err?.status,
      statusText: err?.statusText,
      details: err?.errorDetails || err?.response?.data,
    };
  }

  // Test 2: Gemini com system prompt (sem tools)
  let systemTest: any = { ok: false };
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'Quais serviços vocês oferecem?' }] }],
      config: {
        systemInstruction: 'Você é Alfred, atendente da Mamuty Barbearia. Responda de forma curta.',
        maxOutputTokens: 200,
        temperature: 0.7,
      },
    });
    systemTest = { ok: true, reply: response.text };
  } catch (err: any) {
    systemTest = {
      ok: false,
      error: err?.message || String(err),
      status: err?.status,
    };
  }

  return NextResponse.json({
    keyPresent: true,
    keyPrefix: apiKey.substring(0, 10) + '...',
    basicTest,
    systemTest,
    timestamp: new Date().toISOString(),
  });
}
