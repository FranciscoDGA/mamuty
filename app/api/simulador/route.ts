import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { alfredChat } from '@/lib/alfred/service';
import { pensarEResponderAlfred, BrainContext } from '@/lib/ai/brain';
import { MAMUTY_KNOWLEDGE_BASE } from '@/lib/ai/knowledgeBase';
import { Appointment, Barber, Service, Customer } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { message, history = [], customerData = null } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mensagem é obrigatória.' }, { status: 400 });
    }

    // 1. Preparar catálogo de serviços, barbeiros e agendamentos
    let services: Service[] = [];
    let barbers: Barber[] = [];
    let appointments: Appointment[] = [];

    const today = new Date().toISOString().split('T')[0];

    const [servicesResult, barbersResult, appointmentsResult] = await Promise.allSettled([
      supabase.from('services').select('*').eq('active', true),
      supabase.from('barbers').select('*').eq('active', true),
      supabase.from('appointments').select('*').gte('date', today).lte('date', today),
    ]);

    // Serviços
    if (servicesResult.status === 'fulfilled' && servicesResult.value.data?.length) {
      services = servicesResult.value.data.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category || 'cabelo',
        description: s.description || '',
        price: Number(s.price),
        durationMinutes: s.duration_minutes || 30,
        pointsReward: s.points_reward || 0,
        active: s.active,
      }));
    } else {
      services = MAMUTY_KNOWLEDGE_BASE.servicos.map((s) => ({
        id: s.id,
        name: s.nome,
        category: 'cabelo',
        description: s.descricao,
        price: s.preco,
        durationMinutes: s.duracaoMinutos,
        pointsReward: 0,
        active: true,
      }));
    }

    // Barbeiros
    if (barbersResult.status === 'fulfilled' && barbersResult.value.data?.length) {
      barbers = barbersResult.value.data.map((b) => ({
        id: b.id,
        name: b.name,
        role: b.role || 'barbeiro',
        avatarUrl: b.avatar_url || '',
        rating: b.rating || 0,
        reviewsCount: b.reviews_count || 0,
        specialties: b.specialties || [],
        phone: b.phone || '',
        bio: b.bio || '',
        availableDays: b.available_days || [1, 2, 3, 4, 5, 6],
      }));
    } else {
      barbers = MAMUTY_KNOWLEDGE_BASE.barbeiros.map((b) => ({
        id: b.id,
        name: b.nome,
        role: b.especialidades?.[0] || 'Barbeiro',
        avatarUrl: '/logo.png',
        rating: 5,
        reviewsCount: 100,
        specialties: b.especialidades || [],
        phone: '',
        bio: '',
        availableDays: [1, 2, 3, 4, 5, 6],
      }));
    }

    // Agendamentos
    if (appointmentsResult.status === 'fulfilled' && appointmentsResult.value.data) {
      appointments = appointmentsResult.value.data.map((a) => ({
        id: a.id,
        customerName: a.customer_name,
        customerPhone: a.customer_phone,
        barberId: a.barber_id,
        barberName: a.barber_name,
        serviceIds: a.service_ids || [],
        serviceNames: a.service_names || [],
        date: a.date,
        time: a.time,
        totalPrice: Number(a.total_price),
        totalDurationMinutes: a.total_duration_minutes,
        paymentMethod: a.payment_method,
        paymentStatus: a.payment_status,
        status: a.status,
        whatsappNotificationSent: a.whatsapp_notification_sent,
        createdAt: a.created_at,
      }));
    }

    let replyText = '';
    let intentDetected = 'AI_CHAT';

    try {
      if (process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY) {
        const alfredResult = await alfredChat(message, {
          services,
          barbers,
          appointments,
          currentCustomer: customerData,
          conversationHistory: history,
        });

        if (alfredResult?.reply) {
          replyText = alfredResult.reply;
          intentDetected = alfredResult.toolUsed || 'GEMINI_ALFRED';
        }
      }
    } catch (err: any) {
      console.error('[Simulador API] Erro ao chamar Alfred:', err);
    }

    // Fallback inteligente
    if (!replyText) {
      const brainContext: BrainContext = {
        services,
        barbers,
        appointments,
        currentCustomer: customerData,
        conversationHistory: history,
        activeDraft: {},
      };

      try {
        const brainOutput = await pensarEResponderAlfred(message, brainContext);
        replyText = brainOutput.reply;
        intentDetected = brainOutput.intent;
      } catch (err) {
        replyText = 'Erro ao processar a resposta no simulador. Verifique os logs e as chaves de API configuradas.';
      }
    }

    return NextResponse.json({
      reply: replyText,
      intent: intentDetected
    });

  } catch (error: any) {
    console.error('[Simulador API] Erro na rota:', error);
    return NextResponse.json({ error: error.message || 'Erro interno.' }, { status: 500 });
  }
}
