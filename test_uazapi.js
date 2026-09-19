const token = "cd45de94-e683-4b9d-8539-e51a0e6c6406";
const baseUrl = "https://mamuty.uazapi.com";
const phone = "5511999999999"; 

async function testSend() {
  const headers = {
    'Content-Type': 'application/json',
    'token': token
  };

  const payload = {
    number: phone,
    text: "Teste do Alfred 🚀"
  };

  try {
    const res1 = await fetch(`${baseUrl}/send/text`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    console.log("Status:", res1.status);
    const text1 = await res1.text();
    console.log("Response:", text1);
  } catch(e) {
    console.error("Erro:", e.message);
  }
}

testSend();
