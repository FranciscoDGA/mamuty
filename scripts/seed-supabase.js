const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('🚀 Iniciando sincronização Supabase Mamuty Barbearia...');

  // 1. Sincronizar Barbeiros Oficiais
  console.log('--- 1. Sincronizando Barbeiros ---');
  const officialBarbers = [
    {
      name: 'mamuty.barber',
      description: 'Fundador & Barbeiro Chefe (Hemerson Barber)',
      specialty: 'Degradê, Tesoura & Barba',
      photo_url: '/barber-hemerson.jpg',
      active: true
    },
    {
      name: 'Douglas',
      description: 'Especialista em Degradê & Barba',
      specialty: 'Degradê / Fade & Barba',
      photo_url: '/barber-douglas.jpg',
      active: true
    }
  ];

  for (const b of officialBarbers) {
    const { data: existing } = await supabase.from('barbers').select('id, name').eq('name', b.name).maybeSingle();
    if (existing) {
      await supabase.from('barbers').update(b).eq('id', existing.id);
      console.log(`✓ Barbeiro atualizado: ${b.name} (${existing.id})`);
    } else {
      const { data: inserted, error } = await supabase.from('barbers').insert(b).select().single();
      if (error) console.error(`Erro inserindo ${b.name}:`, error);
      else console.log(`✓ Barbeiro inserido: ${b.name} (${inserted.id})`);
    }
  }

  // Desativar barbeiros que não fazem parte da Mamuty
  await supabase.from('barbers').update({ active: false }).not('name', 'in', '("mamuty.barber","Douglas")');

  // 2. Sincronizar Serviços Oficiais da Sprint 2
  console.log('--- 2. Sincronizando Serviços Oficiais ---');
  const officialServices = [
    {
      name: 'Corte social',
      description: 'Corte masculino tradicional com alinhamento na tesoura ou máquina.',
      price: 40,
      duration_minutes: 30,
      active: true
    },
    {
      name: 'Corte degradê',
      description: 'Degradê milimétrico na régua (Low, Mid ou High Fade).',
      price: 40,
      duration_minutes: 40,
      active: true
    },
    {
      name: 'Barba simples',
      description: 'Alinhamento e desenho de barba com toalha e navalha.',
      price: 35,
      duration_minutes: 30,
      active: true
    },
    {
      name: 'Cabelo + Barba',
      description: 'Combo completo de corte degradê ou tradicional + barba alinhada.',
      price: 70,
      duration_minutes: 50,
      active: true
    },
    {
      name: 'Cabelo + Sobrancelha',
      description: 'Corte de cabelo completo com alinhamento e limpeza de sobrancelha.',
      price: 60,
      duration_minutes: 45,
      active: true
    },
    {
      name: 'Combo Completo',
      description: 'Corte completo, barba na toalha quente, sobrancelha e finalização.',
      price: 100,
      duration_minutes: 60,
      active: true
    }
  ];

  for (const s of officialServices) {
    const { data: existing } = await supabase.from('services').select('id, name').eq('name', s.name).maybeSingle();
    if (existing) {
      await supabase.from('services').update(s).eq('id', existing.id);
      console.log(`✓ Serviço atualizado: ${s.name} (${existing.id})`);
    } else {
      const { data: inserted, error } = await supabase.from('services').insert(s).select().single();
      if (error) console.error(`Erro inserindo ${s.name}:`, error);
      else console.log(`✓ Serviço inserido: ${s.name} (${inserted.id})`);
    }
  }

  // 3. Cadastrar Cliente Inteligente João Silva se não existir
  console.log('--- 3. Cadastrando Clientes Iniciais ---');
  const sampleCustomers = [
    { name: 'João Silva', phone: '94984439065' },
    { name: 'Carlos Santos', phone: '94991234567' },
    { name: 'Pedro Henrique', phone: '94998765432' }
  ];

  for (const c of sampleCustomers) {
    const { data: existing } = await supabase.from('customers').select('id').eq('phone', c.phone).maybeSingle();
    if (!existing) {
      const { data: inserted } = await supabase.from('customers').insert(c).select().single();
      if (inserted) console.log(`✓ Cliente cadastrado: ${c.name} (${inserted.id})`);
    } else {
      console.log(`✓ Cliente já existente: ${c.name}`);
    }
  }

  console.log('🎉 Sincronização concluída com sucesso!');
}

seed();
