import 'dotenv/config';

async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/simulador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Teste de chamada AI',
        history: [],
      })
    });
    const data = await res.json();
    console.log("Response:", data);
  } catch(e) {
    console.error(e);
  }
}
run();
