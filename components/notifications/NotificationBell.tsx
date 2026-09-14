'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Bell,
  Check,
  CheckCheck,
  Calendar,
  Clock,
  Scissors,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  X,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  recipient_type: string;
  type: string;
  title: string;
  message: string;
  booking_id: string | null;
  read_at: string | null;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export const NotificationBell: React.FC<{ variant?: 'header' | 'mobile' }> = ({ variant = 'header' }) => {
  const { currentCustomer } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const phoneParam = currentCustomer?.phone ? `?phone=${encodeURIComponent(currentCustomer.phone)}` : '?type=store';
      const res = await fetch(`/api/notifications${phoneParam}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, [currentCustomer?.phone]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          all: true,
          phone: currentCustomer?.phone || undefined,
          recipientType: currentCustomer?.phone ? 'customer' : 'store',
        }),
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'BOOKING_CREATED':
        return <Scissors className="w-4 h-4 text-amber-400" />;
      case 'BOOKING_CANCELLED':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'BOOKING_RESCHEDULED':
        return <RefreshCw className="w-4 h-4 text-blue-400" />;
      case 'PROFESSIONAL_CHANGED':
        return <UserCheck className="w-4 h-4 text-purple-400" />;
      case 'REMINDER':
        return <Clock className="w-4 h-4 text-emerald-400" />;
      default:
        return <Calendar className="w-4 h-4 text-amber-400" />;
    }
  };

  const displayedNotifications = notifications.filter((n) =>
    filter === 'unread' ? !n.read_at : true
  );

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-slate-700 transition flex items-center justify-center focus:outline-hidden"
        title="Central de Notificações"
        aria-label="Central de Notificações"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse shadow-md shadow-red-500/30">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover / Dropdown */}
      {isOpen && (
        <div className={`absolute z-50 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden right-0 text-left animate-in fade-in zoom-in-95 duration-150`}>
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-400" />
                Notificações
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] text-slate-400 hover:text-amber-400 font-medium flex items-center gap-1 transition"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ler todas</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-3 pt-2 pb-1.5 flex gap-1.5 bg-slate-900/40 border-b border-slate-800/60">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filter === 'all'
                  ? 'bg-slate-800 text-amber-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filter === 'unread'
                  ? 'bg-slate-800 text-amber-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Não Lidas ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {isLoading && notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Carregando notificações...
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 px-4">
                <Bell className="w-6 h-6 mx-auto text-slate-600 mb-2 stroke-[1.5]" />
                Nenhuma notificação encontrada no momento.
              </div>
            ) : (
              displayedNotifications.map((n) => {
                const isUnread = !n.read_at;
                return (
                  <div
                    key={n.id}
                    onClick={() => isUnread && markAsRead(n.id)}
                    className={`p-3.5 transition flex items-start gap-3 cursor-pointer ${
                      isUnread
                        ? 'bg-slate-900/80 hover:bg-slate-900'
                        : 'bg-transparent hover:bg-slate-900/40 opacity-80'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-800 border border-slate-700/60 shrink-0 mt-0.5">
                      {getIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className={`text-xs font-bold truncate ${isUnread ? 'text-white' : 'text-slate-300'}`}>
                          {n.title}
                        </h4>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 mt-1 whitespace-pre-line leading-relaxed line-clamp-3">
                        {n.message}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/40 text-[10px] text-slate-500">
                        <span>
                          {new Date(n.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })} &bull; {new Date(n.created_at).toLocaleDateString('pt-BR')}
                        </span>

                        {isUnread && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(n.id);
                            }}
                            className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-0.5"
                          >
                            <Check className="w-3 h-3" />
                            Marcar lida
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
