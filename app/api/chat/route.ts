import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { INITIAL_SERVICES, INITIAL_BARBERS, INITIAL_APPOINTMENTS } from '@/lib/data';
import { MAMUTY_KNOWLEDGE_BASE } from '@/lib/ai/knowledgeBase';
import { pensarEResponderMarcos } from '@/lib/ai/brain';
import { checkApiRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkApiRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: 'Muitas requisições. Aguarde um momento.',
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
      }, { status: 429 });
    }

    const { messages, draft, currentCustomer } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Mensagens não fornecidas' }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const userText = (lastMessage.content || lastMessage.text || '').trim();

    // 1. Carregar dados atuais do Supabase
    let services = INITIAL_SERVICES;
    let barbers = INITIAL_BARBERS.filter(b => b.id !== 'any');
    let appointments = INITIAL_APPOINTMENTS;

    try {
      const { data: sData } = await supabase.from('services').select('*').eq('active', true);
      if (sData && sData.length > 0) {
        services = sData.map(s => ({
          id: s.id,
          name: s.name,
          category: 'cabelo',
          description: s.description || '',
          price: Number(s.price),
          durationMinutes: s.duration_minutes,
          pointsReward: 0,
        }));
      }

      const { data: bData } = await supabase.from('barbers').select('*').eq('active', true);
      if (bData && bData.length > 0) {
        barbers = bData.map(b => ({
          id: b.id,
          name: b.name,
          role: b.description || 'Especialista',
          avatarUrl: b.photo_url || '',
          rating: 5,
          reviewsCount: 0,
          specialties: b.specialty ? [b.specialty] : [],
          phone: '',
          bio: b.description || '',
          availableDays: [1,2,3,4,5,6],
        }));
      }

      const { data: aData } = await supabase.from('appointments').select('*').order('appointment_date', { ascending: false });
      if (aData && aData.length > 0) {
        appointments = aData.map(a => ({
          id: a.id,
          customerName: 'Cliente',
          customerPhone: '',
          barberId: a.barber_id,
          barberName: '',
          serviceIds: [a.service_id],
          serviceNames: ['Serviço'],
          date: a.appointment_date,
          time: a.appointment_time ? a.appointment_time.substring(0, 5) : '10:00',
          totalPrice: Number(a.price || 0),
          totalDurationMinutes: a.duration_minutes || 30,
          paymentMethod: 'pix',
          paymentStatus: 'pendente',
          status: a.status || 'confirmed',
          whatsappNotificationSent: false,
          createdAt: a.created_at
        }));
      }
    } catch (e) {
      console.warn('Nota de dados Supabase na API:', e);
    }

    // 2. Chamar o Cérebro do Marcos
    const history = messages.map((m: any) => ({
      role: (m.role === 'user' || m.sender === 'user') ? ('user' as const) : ('assistant' as const),
      content: m.content || m.text || ''
    }));

    const brainResult = await pensarEResponderMarcos(userText, {
      services,
      barbers,
      appointments,
      currentCustomer: currentCustomer || null,
      conversationHistory: history,
      activeDraft: draft
    });

    return NextResponse.json({
      reply: brainResult.reply,
      intent: brainResult.intent,
      toolUsed: brainResult.toolUsed,
      quickReplies: brainResult.quickReplies,
      component: brainResult.component,
      componentData: brainResult.componentData,
      newDraftState: brainResult.newDraftState,
      actionToExecute: brainResult.actionToExecute,
      source: 'marcos-brain'
    });

  } catch (err: any) {
    console.error('Erro no endpoint /api/chat:', err);
    return NextResponse.json({ 
      reply: 'Opa! Tive uma oscilação momentânea na conexão com a agenda. Como posso ajudar você hoje na Mamuty?',
      source: 'fallback'
    }, { status: 200 });
  }
}
