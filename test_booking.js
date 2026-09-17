const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, anonKey);

async function run() {
  const { data, error } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes, active')
    .eq('id', 'd19be95b-7907-408d-bcd1-07642a913287') // Corte social
    .single();

  console.log("Data:", data);
  console.log("Error:", error);
}

run();
