const { createBooking } = require('./lib/booking/service');
const { supabaseAdmin } = require('./lib/supabase-admin');

async function run() {
  const input = {
    serviceId: 'd0f8e160-a36e-43b9-a740-74e1e9309d42',
    barberId: 'ece4ed3a-2b29-45be-8f64-577b82ce5c47',
    date: '2026-09-18',
    time: '14:00',
    customerName: 'Test Customer',
    customerPhone: '55999999999',
    paymentMethod: 'pix',
  };

  try {
    const result = await createBooking(supabaseAdmin, input);
    console.log(result);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
