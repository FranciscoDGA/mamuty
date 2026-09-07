const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://mjyhlzajiijtyswaxyaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qeWhsemFqaWlqdHlzd2F4eWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MTAwMzgsImV4cCI6MjEwNDM4NjAzOH0.fBaP2KoUTPcT40ZK3zTxVatJ0S8B5IWP-UeEc_nzFQU'
);

async function run() {
  console.log('Testing services:');
  const s = await supabase.from('services').select('*').eq('active', true);
  console.log('services:', s.error ? s.error : s.data);

  console.log('Testing barbers:');
  const b = await supabase.from('barbers').select('*').eq('active', true);
  console.log('barbers:', b.error ? b.error : b.data);

  console.log('Testing appointments joined:');
  const a = await supabase.from('appointments').select(`
    *,
    customers ( name, phone ),
    services ( name ),
    barbers ( name )
  `);
  console.log('appointments:', a.error ? a.error : a.data);
}

run();
