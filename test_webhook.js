async function testWebhook() {
  const url = 'https://mamuty.vercel.app/api/webhooks/uazapi';
  
  // Exemplo genérico de payload da Uazapi v2 / Evolution API
  const payload = {
    event: 'messages.upsert',
    instance: 'mamuty',
    data: {
      message: {
        conversation: 'Oi, quero agendar!'
      },
      key: {
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false
      },
      pushName: 'Cliente Teste'
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    console.log("Status da Vercel:", res.status);
    const text = await res.text();
    console.log("Resposta da Vercel:", text);
  } catch(e) {
    console.error("Erro:", e);
  }
}

testWebhook();
