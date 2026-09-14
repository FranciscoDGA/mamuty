'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { MessageCircle, X, Send, Bot, Loader2 } from 'lucide-react';
import { useIsMounted } from '@/hooks/useIsMounted';
import { AlfredMessage } from '@/lib/alfred/service';

interface AlfredChatProps {
  className?: string;
}

export default function AlfredChat({ className = '' }: AlfredChatProps) {
  const isMounted = useIsMounted();
  const { services, barbers, appointments, currentCustomer } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AlfredMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setMessages([{
        role: 'assistant',
        content: 'Olá! Sou o Alfred, assistente da Mamuty Barbearia. Como posso ajudar? Posso tirar dúvidas sobre serviços, preços, horários e disponibilidade.'
      }]);
      setHasGreeted(true);
    }
  }, [isOpen, hasGreeted]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isMounted) return null;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: AlfredMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/alfred', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10),
          services: services.map(s => ({ id: s.id, name: s.name, price: s.price, duration: s.durationMinutes })),
          barbers: barbers.map(b => ({ id: b.id, name: b.name, specialties: b.specialties })),
          appointments: appointments.map(a => ({ id: a.id, barberId: a.barberId, date: a.date, time: a.time, status: a.status })),
          customer: currentCustomer ? { id: currentCustomer.id, name: currentCustomer.name, email: currentCustomer.email } : null,
        }),
      });

      if (!res.ok) throw new Error('Erro na requisição');

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Desculpe, tive um problema técnico. Tente novamente ou acesse https://mamuty.vercel.app/agendar para agendar diretamente.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`fixed z-50 ${isOpen ? 'inset-0 sm:inset-auto sm:bottom-24 sm:right-5 sm:w-96 sm:h-[520px]' : 'bottom-24 right-5'}`}>
      {isOpen && (
        <div className="flex flex-col h-full bg-[#0b1120] sm:rounded-2xl border border-slate-800 shadow-2xl shadow-black/60 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-black/30 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-black">Alfred</h3>
                <p className="text-[11px] text-black/60 font-medium">Assistente Mamuty</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg bg-black/20 hover:bg-black/30 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-black" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-amber-500 text-black rounded-2xl rounded-br-md font-medium'
                    : 'bg-slate-800 text-slate-100 rounded-2xl rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 bg-slate-800 rounded-2xl rounded-bl-md">
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 pb-4 pt-2 border-t border-slate-800/60">
            <div className="flex items-end gap-2 bg-slate-900 rounded-2xl border border-slate-800 focus-within:border-amber-500/40 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                rows={1}
                className="flex-1 bg-transparent px-4 py-3 text-sm text-slate-100 placeholder-slate-500 resize-none outline-none max-h-24"
                style={{ minHeight: '44px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 flex items-center justify-center transition-colors m-1.5 shrink-0"
              >
                <Send className="w-4 h-4 text-black" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`w-14 h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-95 transition-all flex items-center justify-center ${className}`}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
