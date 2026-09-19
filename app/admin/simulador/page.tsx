'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Bot, User, Phone, CheckCircle2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function SimuladorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('5511999999999');
  const [customerName, setCustomerName] = useState('Cliente Teste');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleClear = () => {
    if (confirm('Deseja limpar todo o histórico desta simulação?')) {
      setMessages([]);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    
    // Adiciona a mensagem do usuário ao chat
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/simulador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages, // envia o histórico anterior
          customerData: {
            name: customerName,
            phone: customerPhone,
            tier: 'Gold', // Simula um cliente Gold para testes
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao comunicar com o servidor');
      }

      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (error: any) {
      console.error('Erro no simulador:', error);
      setMessages([
        ...newMessages,
        { role: 'assistant', content: `[Erro do Sistema]: ${error.message}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-5xl mx-auto bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-gray-200 mt-6">
      {/* Header */}
      <div className="bg-amber-600 text-white p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Simulador do Alfred</h1>
            <p className="text-amber-100 text-xs">Ambiente de Testes Isolado</p>
          </div>
        </div>
        <button
          onClick={handleClear}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors flex items-center gap-2 text-sm"
          title="Limpar Conversa"
        >
          <Trash2 size={16} />
          <span className="hidden sm:inline">Reiniciar</span>
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar com configs do simulador */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 hidden md:flex flex-col gap-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider mb-2">Dados Simulados</h2>
          
          <div className="space-y-3 text-sm">
            <div>
              <label className="block text-gray-500 mb-1">Nome do Cliente</label>
              <div className="flex items-center border border-gray-300 rounded px-2 py-1.5 focus-within:border-amber-500">
                <User size={14} className="text-gray-400 mr-2" />
                <input 
                  type="text" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full outline-none text-gray-700 bg-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-500 mb-1">Telefone Simulado</label>
              <div className="flex items-center border border-gray-300 rounded px-2 py-1.5 focus-within:border-amber-500">
                <Phone size={14} className="text-gray-400 mr-2" />
                <input 
                  type="text" 
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full outline-none text-gray-700 bg-transparent"
                />
              </div>
            </div>
            
            <div className="mt-6 p-3 bg-amber-50 rounded-md border border-amber-100 text-amber-800 text-xs">
              <p className="flex items-start gap-1">
                <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-amber-600" />
                <span>O simulador busca serviços e barbeiros reais do banco de dados da barbearia.</span>
              </p>
              <p className="flex items-start gap-1 mt-2">
                <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-amber-600" />
                <span>Nenhuma mensagem será enviada pelo WhatsApp.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-[#e5ddd5]">
          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 my-10 bg-white/50 p-4 rounded-lg w-fit mx-auto shadow-sm">
                Envie uma mensagem para iniciar a simulação com o Alfred.
              </div>
            )}
            
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[85%] sm:max-w-[75%] rounded-lg p-3 shadow-sm ${
                      isUser 
                        ? 'bg-[#d9fdd3] text-gray-800 rounded-tr-none' 
                        : 'bg-white text-gray-800 rounded-tl-none'
                    }`}
                  >
                    {/* Renderizamos as quebras de linha corretamente */}
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm flex gap-1 items-center h-[44px]">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-[#f0f2f5] p-3 flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite uma mensagem..."
              className="flex-1 px-4 py-3 rounded-full border-none focus:outline-none shadow-sm text-gray-700 bg-white"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-full p-3 h-[48px] w-[48px] flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Send size={20} className="ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
