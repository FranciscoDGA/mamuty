import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { INITIAL_SERVICES, INITIAL_BARBERS } from '@/lib/data';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Mensagens não fornecidas' }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const userText = (lastMessage.content || '').trim();
    const lower = userText.toLowerCase();

    // 1. Fetch current services and barbers from Supabase (or fallback)
    let services = INITIAL_SERVICES;
    let barbers = INITIAL_BARBERS.filter(b => b.id !== 'any');

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
    } catch (e) {
      console.warn('Erro ao carregar dados do Supabase na API:', e);
    }

    // 2. Check if GEMINI_API_KEY is available for LLM processing
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

        const systemInstruction = `
Você é o assistente virtual exclusivo da **Mamuty Barbearia & Salão Masculino**.
Seu objetivo é atender clientes no WhatsApp de forma rápida, educada, moderna e focada em converter dúvidas em agendamentos.

INFORMAÇÕES DA BARBEARIA:
- Endereço: Av. Paulista, 1842 - Sala 04 - Bela Vista, São Paulo - SP
- Horário: Segunda a Sábado das 09:00 às 20:30 (almoço das 12:00 às 13:00)
- Serviços e Preços:
${services.map(s => `  * ${s.name}: R$ ${s.price} (${s.durationMinutes} min) - ${s.description}`).join('\n')}
- Barbeiros:
${barbers.map(b => `  * ${b.name}: ${b.specialties.join(', ')}`).join('\n')}

COMPORTAMENTO:
1. Responda em português brasileiro com simpatia, naturalidade e objetividade (estilo WhatsApp).
2. Se o cliente perguntar preço ou serviços, informe com entusiasmo e sugira agendar um horário.
3. Quebre objeções: se o cliente achar caro ou tiver dúvida, destaque a qualidade, cerveja/café cortesia e atendimento premium.
4. Para agendar, pergunte:
   - Qual serviço deseja
   - Preferência de barbeiro (ou qualquer profissional)
   - Data e horário desejado
   - Nome e WhatsApp de contato
5. Quando o cliente confirmar os dados para agendar, responda com uma confirmação bem formatada.
        `;

        const chatContents = messages.map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }));

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: chatContents,
          config: {
            systemInstruction
          }
        });

        const reply = response.text || 'Opa! Como posso ajudar você hoje na Mamuty?';
        return NextResponse.json({ reply, source: 'gemini' });
      } catch (geminiError) {
        console.warn('Erro na chamada Gemini, usando assistente inteligente local:', geminiError);
      }
    }

    // 3. Fallback: Intelligent Conversational Engine (Fast, High-converting NLP)
    let reply = '';
    let suggestedOptions: { label: string; text: string }[] = [];

    // Preços / Serviços
    if (lower.includes('preço') || lower.includes('preco') || lower.includes('quanto') || lower.includes('valor') || lower.includes('tabela') || lower.includes('serviço') || lower.includes('servico') || lower.includes('corte') || lower.includes('barba')) {
      const servList = services.map(s => `✂️ *${s.name}* — R$ ${s.price} (${s.durationMinutes} min)`).join('\n');
      reply = `Opa! Nossos principais serviços e valores na Mamuty Barbearia:\n\n${servList}\n\n☕ Todos incluem café espresso ou água gelada como cortesia!\n\nQuer que eu reserve um horário pra você dar aquele talento no visual?`;
      suggestedOptions = [
        { label: 'Agendar um horário', text: 'Quero agendar um horário' },
        { label: 'Ver profissionais', text: 'Quais os barbeiros disponíveis?' }
      ];
    }
    // Barbeiros / Profissionais
    else if (lower.includes('barbeiro') || lower.includes('profissional') || lower.includes('profissionais') || lower.includes('equipe') || lower.includes('quem atende')) {
      const barbList = barbers.map(b => `💈 *${b.name}* — Especialista em ${b.specialties.join(', ')}`).join('\n');
      reply = `Essa é a nossa equipe de feras na Mamuty:\n\n${barbList}\n\nTodos com excelência e acabamento impecável na navalha e tesoura. Deseja agendar com algum deles em especial?`;
      suggestedOptions = [
        { label: 'Com qualquer um', text: 'Pode ser com qualquer barbeiro hoje' },
        { label: 'Ver preços', text: 'Quais os preços?' }
      ];
    }
    // Endereço / Localização
    else if (lower.includes('onde') || lower.includes('endereço') || lower.includes('endereco') || lower.includes('local') || lower.includes('fica')) {
      reply = `📍 Ficamos na *Av. Paulista, 1842 - Sala 04*, Bela Vista - São Paulo (ao lado do metrô Consolação/Trianon-Masp).\n\n⏰ Horário de atendimento: Segunda a Sábado, das 09:00 às 20:30.\n\nQuer garantir uma cadeira pra hoje?`;
      suggestedOptions = [
        { label: 'Ver horários hoje', text: 'Tem vaga hoje?' },
        { label: 'Quero agendar', text: 'Quero agendar um corte' }
      ];
    }
    // Horários / Vagas hoje
    else if (lower.includes('vaga') || lower.includes('horario') || lower.includes('horário') || lower.includes('hoje') || lower.includes('amanha') || lower.includes('amanhã')) {
      reply = `Temos vagas disponíveis sim! 🎯\n\nNossos horários mais procurados hoje:\n🕒 *14:00* &bull; *15:30* &bull; *17:00* &bull; *18:30*\n\nQual horário fica melhor pra você?`;
      suggestedOptions = [
        { label: 'Às 15:30', text: 'Quero às 15:30' },
        { label: 'Às 17:00', text: 'Quero às 17:00' },
        { label: 'Às 18:30', text: 'Quero às 18:30' }
      ];
    }
    // Cancelamento
    else if (lower.includes('cancelar') || lower.includes('desmarcar') || lower.includes('remarcar')) {
      reply = `Sem problemas, imprevistos acontecem! 👍\n\nPara cancelar ou remarcar, me informe o seu *número de telefone* com DDD que eu localizo seu agendamento no sistema.`;
      suggestedOptions = [
        { label: 'Remarcar para amanhã', text: 'Quero remarcar para amanhã' }
      ];
    }
    // Saudação ou Padrão
    else {
      reply = `Fala, tudo bem? Bem-vindo ao WhatsApp da *Mamuty Barbearia*! 💈✂️\n\nSou o assistente digital da barbearia. Como posso te ajudar hoje?\n\n• Agendar corte ou barba\n• Consultar serviços e valores\n• Saber horário e endereço`;
      suggestedOptions = [
        { label: 'Ver serviços e preços', text: 'Quais os preços dos serviços?' },
        { label: 'Tem vaga hoje?', text: 'Tem vaga para hoje?' },
        { label: 'Onde fica a barbearia?', text: 'Qual o endereço de vocês?' }
      ];
    }

    return NextResponse.json({ reply, options: suggestedOptions, source: 'assistant' });
  } catch (err: any) {
    console.error('Erro no endpoint /api/chat:', err);
    return NextResponse.json({ 
      reply: 'Opa! Tive uma oscilação momentânea, mas você pode agendar diretamente pelo menu ou me dizer o dia e horário que deseja!',
      source: 'fallback'
    }, { status: 200 });
  }
}
