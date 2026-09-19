import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local' });

import { alfredChat } from './lib/alfred/service.ts';

async function test() {
  try {
    const res = await alfredChat("Oi", {
      services: [],
      barbers: [],
      appointments: [],
      currentCustomer: null,
      conversationHistory: []
    });
    console.log(res);
  } catch (e) {
    console.error("ERROR:", e);
  }
}
test();
