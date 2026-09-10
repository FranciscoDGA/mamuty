'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appointment, Barber, Customer, Service, SalonConfig, FinancialTransaction, PaymentMethod } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import {
  INITIAL_SALON_CONFIG,
  INITIAL_SERVICES,
  INITIAL_BARBERS,
  INITIAL_CUSTOMERS,
  INITIAL_APPOINTMENTS,
  INITIAL_PORTFOLIO,
  INITIAL_LOYALTY_REWARDS,
  INITIAL_REVIEWS,
} from '@/lib/data';

interface AppContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  services: Service[];
  barbers: Barber[];
  appointments: Appointment[];
  customers: Customer[];
  salonConfig: SalonConfig;
  currentCustomer: Customer | null;
  setCurrentCustomer: (c: Customer | null) => void;
  buscarClientePorWhatsapp: (phone: string) => Promise<Customer | null>;
  createAppointment: (apt: Partial<Appointment> & { 
    customerName: string; 
    customerPhone: string; 
    customerEmail?: string;
    source?: string;
    paymentMethod?: PaymentMethod;
  }) => Promise<Appointment>;
  updateAppointmentStatus: (id: string, status: 'confirmed' | 'completed' | 'cancelled') => Promise<void>;
  createCustomer: (name: string, phone: string, extra?: Partial<Customer>) => Promise<any>;
  deleteCustomer: (id: string) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  deleteBarber: (id: string) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  resetAllData: (...args: any[]) => any;
  portfolio: any[];
  toggleLikePortfolio: (photoId: string) => void;
  preselectedBarberId: string | null;
  setPreselectedBarberId: (barberId: string | null) => void;
  loyaltyRewards: any[];
  redeemLoyaltyReward: (rewardId: string, customerId: string) => boolean;
  reviews: any[];

  // Compatibility & Extensions
  addCustomer: (cust: any) => Customer;
  addLoyaltyStamp: (phone: string) => Promise<Customer | null>;
  submitReview: (review: any) => void;
  transactions: FinancialTransaction[];
  updateSalonConfig: (cfg: Partial<SalonConfig>) => void;
  addTransaction: (tx: any) => void;
  addService: (srv: any) => void;

  // New Booking Alert for Admin
  latestNewBooking: Appointment | null;
  dismissNewBookingAlert: () => void;

  refreshData: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('agendar');
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [barbers, setBarbers] = useState<Barber[]>(INITIAL_BARBERS);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [salonConfig] = useState<SalonConfig>(INITIAL_SALON_CONFIG);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [portfolio, setPortfolio] = useState<any[]>(INITIAL_PORTFOLIO);
  const [loyaltyRewards, setLoyaltyRewards] = useState<any[]>(INITIAL_LOYALTY_REWARDS);
  const [reviews, setReviews] = useState<any[]>(INITIAL_REVIEWS);
  const [preselectedBarberId, setPreselectedBarberId] = useState<string | null>(null);
  const [latestNewBooking, setLatestNewBooking] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch Services from Supabase
      const { data: sData, error: sErr } = await supabase.from('services').select('*').eq('active', true);
      if (sErr || !sData || sData.length === 0) {
        console.warn('Supabase services unavailable or empty, using fallback:', sErr);
        setServices(INITIAL_SERVICES);
      } else {
        setServices(sData.map(s => ({
          id: s.id,
          name: s.name,
          category: s.name.toLowerCase().includes('barba') ? 'barba' : s.name.toLowerCase().includes('+') || s.name.toLowerCase().includes('combo') ? 'combos' : 'cabelo',
          description: s.description || '',
          price: Number(s.price),
          durationMinutes: s.duration_minutes || 30,
          pointsReward: Number(s.price),
          popular: s.name.toLowerCase().includes('degradê') || s.name.toLowerCase().includes('combo')
        })));
      }
      
      // 2. Fetch Barbers from Supabase
      const { data: bData, error: bErr } = await supabase.from('barbers').select('*');
      if (bErr || !bData || bData.length === 0) {
        console.warn('Supabase barbers unavailable or empty, using fallback:', bErr);
        setBarbers(INITIAL_BARBERS);
      } else {
        setBarbers([
          ...bData.map(b => ({
            id: b.id,
            name: b.name,
            role: b.description || 'Barbeiro Especialista',
            avatarUrl: b.photo_url || (b.name === 'mamuty.barber' ? '/logo.png' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80'),
            rating: 5.0,
            reviewsCount: b.name === 'mamuty.barber' ? 148 : 112,
            specialties: b.specialty ? [b.specialty] : ['Degradê', 'Barba', 'Corte Tradicional'],
            phone: '(94) 98443-9065',
            bio: b.description || '',
            availableDays: [1,2,3,4,5,6],
            active: b.active !== false,
          })),
          {
            id: 'any',
            name: 'Qualquer profissional',
            role: 'Disponível',
            avatarUrl: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400&q=80',
            rating: 5.0,
            reviewsCount: 0,
            specialties: [],
            phone: '',
            bio: '',
            availableDays: [1,2,3,4,5,6]
          }
        ]);
      }
      
      // 3. Fetch Appointments with relational data
      const { data: aData, error: aErr } = await supabase.from('appointments').select(`
        *,
        customers ( name, phone ),
        services ( name ),
        barbers ( name )
      `).order('appointment_date', { ascending: false }).order('appointment_time', { ascending: false });

      let loadedAppointments: Appointment[] = [];
      if (aErr || !aData) {
        console.warn('Supabase appointments fetch note:', aErr);
        loadedAppointments = INITIAL_APPOINTMENTS;
      } else {
        loadedAppointments = aData.map(a => {
          const notesStr = a.notes || '';
          let payMethod: PaymentMethod = 'pix';
          const lowerNotes = notesStr.toLowerCase();
          if (lowerNotes.includes('pagamento: dinheiro')) payMethod = 'dinheiro';
          else if (lowerNotes.includes('pagamento: debito') || lowerNotes.includes('pagamento: débito')) payMethod = 'debito';
          else if (lowerNotes.includes('pagamento: credito') || lowerNotes.includes('pagamento: crédito')) payMethod = 'credito';
          else if (lowerNotes.includes('pagamento: pix')) payMethod = 'pix';

          let src = 'site';
          if (lowerNotes.includes('origem: whatsapp')) src = 'whatsapp';
          else if (lowerNotes.includes('origem: admin')) src = 'admin';

          const emailMatch = notesStr.match(/E-mail:\s*([^\s|]+)/i);
          const customerEmail = emailMatch ? emailMatch[1] : undefined;

          return {
            id: a.id,
            customerName: a.customers?.name || 'Cliente',
            customerPhone: a.customers?.phone || '',
            customerEmail,
            barberId: a.barber_id,
            barberName: a.barbers?.name || (a.barber_id ? 'Barbeiro' : ''),
            serviceIds: [a.service_id],
            serviceNames: [a.services?.name || 'Serviço'],
            date: a.appointment_date,
            time: a.appointment_time ? a.appointment_time.substring(0,5) : '10:00',
            totalPrice: Number(a.price || 0),
            totalDurationMinutes: a.duration_minutes || 30,
            paymentMethod: payMethod,
            paymentStatus: a.status === 'completed' ? 'pago' : 'pendente',
            status: (a.status as any) || 'confirmed',
            notes: notesStr,
            whatsappNotificationSent: false,
            createdAt: a.created_at,
            source: src
          };
        });
        setAppointments(loadedAppointments);
      }

      // 4. Fetch Customers and aggregate CRM stats
      const { data: cData, error: cErr } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (cErr || !cData) {
        console.warn('Supabase customers fetch note:', cErr);
        setCustomers(INITIAL_CUSTOMERS);
      } else {
        const enrichedCustomers: Customer[] = cData.map(c => {
          const cleanPhone = (c.phone || '').replace(/\D/g, '');
          const customerApts = loadedAppointments.filter(
            a => a.customerPhone.replace(/\D/g, '').endsWith(cleanPhone.slice(-8))
          );
          const completedApts = customerApts.filter(a => a.status === 'completed');
          const totalSpent = completedApts.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
          const latestApt = customerApts[0];

          return {
            id: c.id,
            name: c.name,
            phone: c.phone,
            email: undefined,
            totalVisits: customerApts.length,
            totalSpent,
            loyaltyStamps: Math.min(completedApts.length, 10),
            loyaltyPoints: completedApts.length * 40,
            tier: completedApts.length >= 10 ? 'Ouro VIP' : completedApts.length >= 5 ? 'Prata' : 'Bronze',
            lastVisit: latestApt?.date,
          };
        });
        setCustomers(enrichedCustomers);
      }

    } catch (err: any) {
      console.warn('Graceful fallback applied:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Identificação inteligente do cliente via WhatsApp.
   * Busca no Supabase para não pedir novamente dados de quem já agendou.
   */
  const buscarClientePorWhatsapp = async (phone: string): Promise<Customer | null> => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 8) return null;

    try {
      const suffix = cleanPhone.slice(-8);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .ilike('phone', `%${suffix}%`)
        .limit(1)
        .maybeSingle();

      if (data) {
        const cleanFoundPhone = (data.phone || '').replace(/\D/g, '');
        const clientApts = appointments.filter(a => a.customerPhone.replace(/\D/g, '').endsWith(cleanFoundPhone.slice(-8)));
        const completedApts = clientApts.filter(a => a.status === 'completed');
        const latestApt = clientApts[0];

        const matchedCustomer: Customer = {
          id: data.id,
          name: data.name,
          phone: data.phone,
          totalVisits: clientApts.length,
          totalSpent: completedApts.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0),
          loyaltyStamps: Math.min(completedApts.length, 10),
          loyaltyPoints: completedApts.length * 40,
          tier: completedApts.length >= 10 ? 'Ouro VIP' : completedApts.length >= 5 ? 'Prata' : 'Bronze',
          lastVisit: latestApt?.date,
        };

        setCurrentCustomer(matchedCustomer);
        return matchedCustomer;
      }
    } catch (e) {
      console.warn('Erro ao buscar cliente por WhatsApp:', e);
    }
    return null;
  };

  const createCustomer = async (name: string, phone: string, extra?: Partial<Customer>) => {
    const cleanPhone = phone.replace(/\D/g, '');
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({ name, phone: cleanPhone })
        .select('*')
        .single();
      if (error) throw error;
      await fetchData();
      return data;
    } catch (err) {
      console.warn('Customer created locally:', err);
      const newC: Customer = {
        id: 'cust-' + Date.now(),
        name,
        phone: cleanPhone,
        totalVisits: 0,
        totalSpent: 0,
        loyaltyStamps: 0,
        loyaltyPoints: 0,
        tier: 'Bronze',
        ...extra
      };
      setCustomers(prev => [newC, ...prev]);
      return newC;
    }
  };

  const addLoyaltyStamp = async (phone: string): Promise<Customer | null> => {
    const cleanPhone = phone.replace(/\D/g, '');
    let updatedCustomer: Customer | null = null;
    setCustomers(prev => prev.map(c => {
      if (c.phone.replace(/\D/g, '').endsWith(cleanPhone.slice(-8))) {
        const nextStamps = (c.loyaltyStamps || 0) + 1;
        const nextPoints = (c.loyaltyPoints || 0) + 20;
        const nextTier = nextStamps >= 10 ? 'Ouro VIP' : nextStamps >= 5 ? 'Prata' : c.tier;
        updatedCustomer = {
          ...c,
          loyaltyStamps: nextStamps,
          loyaltyPoints: nextPoints,
          tier: nextTier
        };
        return updatedCustomer;
      }
      return c;
    }));

    return updatedCustomer;
  };

  /**
   * Criação de agendamento com proteção contra duplo agendamento no Supabase (Fonte da Verdade)
   */
  const createAppointment = async (apt: Partial<Appointment> & { 
    customerName: string; 
    customerPhone: string; 
    customerEmail?: string;
    source?: string;
    paymentMethod?: PaymentMethod;
  }): Promise<Appointment> => {
    let customerId = '';
    const cleanPhone = apt.customerPhone.replace(/\D/g, '');
    const dateStr = apt.date || new Date().toISOString().split('T')[0];
    const timeStr = apt.time || '10:00';
    const duration = apt.totalDurationMinutes || 40;
    const isUUID = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

    // 1. Resolver UUID do Barbeiro
    let finalBarberId = apt.barberId;
    if (!isUUID(finalBarberId) || finalBarberId === 'any') {
      const found = barbers.find(b => isUUID(b.id) && (b.id === finalBarberId || b.name.toLowerCase() === apt.barberName?.toLowerCase()));
      finalBarberId = found ? found.id : barbers.find(b => isUUID(b.id) && b.id !== 'any')?.id;
    }
    const finalBarber = barbers.find(b => b.id === finalBarberId) || barbers[0];

    // 2. Resolver UUID do Serviço
    let finalServiceId = apt.serviceIds?.[0];
    if (!isUUID(finalServiceId)) {
      const found = services.find(s => isUUID(s.id) && (s.id === finalServiceId || s.name.toLowerCase() === apt.serviceNames?.[0]?.toLowerCase()));
      finalServiceId = found ? found.id : services.find(s => isUUID(s.id))?.id;
    }
    const finalService = services.find(s => s.id === finalServiceId) || services[0];

    // 3. 🔒 PROTEÇÃO CONTRA DUPLO AGENDAMENTO NO BANCO (CRÍTICO)
    // Consulta diretamente o Supabase para o barbeiro e data escolhidos
    if (finalBarberId) {
      try {
        const { data: existingSlots, error: chkErr } = await supabase
          .from('appointments')
          .select('id, appointment_time, duration_minutes, status')
          .eq('barber_id', finalBarberId)
          .eq('appointment_date', dateStr)
          .not('status', 'eq', 'cancelled');

        if (!chkErr && existingSlots && existingSlots.length > 0) {
          const reqStart = parseInt(timeStr.split(':')[0]) * 60 + parseInt(timeStr.split(':')[1]);
          const reqEnd = reqStart + duration;

          for (const ex of existingSlots) {
            const exTime = ex.appointment_time ? ex.appointment_time.substring(0, 5) : '10:00';
            const exStart = parseInt(exTime.split(':')[0]) * 60 + parseInt(exTime.split(':')[1]);
            const exEnd = exStart + (ex.duration_minutes || 40);

            // Se houver sobreposição, recusa o agendamento imediatamente
            if (reqStart < exEnd && reqEnd > exStart) {
              throw new Error(`Desculpe! O horário das ${timeStr} com ${finalBarber?.name || 'este profissional'} acabou de ser reservado por outro cliente. Por favor, escolha outro horário.`);
            }
          }
        }
      } catch (err: any) {
        if (err.message && err.message.includes('acabou de ser reservado')) {
          throw err;
        }
        console.warn('Nota de verificação de concorrência:', err);
      }
    }

    // 4. Salvar ou Recuperar Cliente no Supabase
    try {
      const { data: existingCust } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', cleanPhone)
        .maybeSingle();
        
      if (existingCust) {
        customerId = existingCust.id;
      } else {
        const { data: newCust, error: custErr } = await supabase
          .from('customers')
          .insert({
            name: apt.customerName,
            phone: cleanPhone
          })
          .select('id')
          .single();
          
        if (!custErr && newCust) {
          customerId = newCust.id;
        }
      }
    } catch (err) {
      console.warn('Nota ao salvar cliente:', err);
    }

    // 5. Estruturar Metadata em notes (Origem, Pagamento, E-mail)
    const payMethod = apt.paymentMethod || 'pix';
    const src = apt.source || 'site';
    const notesArr = [
      `Origem: ${src}`,
      `Pagamento: ${payMethod.toUpperCase()}`
    ];
    if (apt.customerEmail) notesArr.push(`E-mail: ${apt.customerEmail}`);
    const notesPayload = notesArr.join(' | ');

    // 6. Inserir Agendamento no Supabase
    let savedId = 'apt-' + Date.now();
    try {
      const appointmentPayload: any = {
        customer_id: customerId || null,
        service_id: finalServiceId || null,
        barber_id: finalBarberId || null,
        appointment_date: dateStr,
        appointment_time: (timeStr.length === 5 ? timeStr + ':00' : timeStr),
        status: 'confirmed',
        price: apt.totalPrice ?? (finalService ? finalService.price : 40),
        duration_minutes: duration,
        notes: notesPayload,
      };

      const { data: insertedApt, error: aptErr } = await supabase
        .from('appointments')
        .insert(appointmentPayload)
        .select('*')
        .single();

      if (aptErr) {
        console.error('Erro inserindo agendamento no Supabase:', aptErr);
      } else if (insertedApt) {
        savedId = insertedApt.id;
      }
    } catch (err) {
      console.error('Erro ao persistir no Supabase:', err);
    }

    // 7. Criar objeto do agendamento local
    const createdApt: Appointment = {
      id: savedId,
      customerName: apt.customerName,
      customerPhone: cleanPhone,
      customerEmail: apt.customerEmail,
      barberId: finalBarberId || apt.barberId || '',
      barberName: finalBarber?.name || apt.barberName || '',
      serviceIds: finalServiceId ? [finalServiceId] : apt.serviceIds || [],
      serviceNames: finalService?.name ? [finalService.name] : apt.serviceNames || ['Corte'],
      date: dateStr,
      time: timeStr,
      totalPrice: apt.totalPrice ?? (finalService?.price || 40),
      totalDurationMinutes: duration,
      paymentMethod: payMethod,
      paymentStatus: 'pendente',
      status: 'confirmed',
      notes: notesPayload,
      whatsappNotificationSent: false,
      createdAt: new Date().toISOString(),
      source: src
    };

    // 8. Atualizar Estado Local e Acionar Alerta para o Painel Admin
    setAppointments(prev => [createdApt, ...prev.filter(a => a.id !== savedId)]);
    setLatestNewBooking(createdApt);

    // Refresh em background
    fetchData();

    return createdApt;
  };

  /**
   * Atualização de status (confirmed, completed, cancelled)
   * Ao cancelar, libera o horário imediatamente mantendo o registro no banco.
   */
  const updateAppointmentStatus = async (id: string, status: 'confirmed' | 'completed' | 'cancelled') => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));

    try {
      await supabase.from('appointments').update({ status }).eq('id', id);
    } catch (err) {
      console.warn('Erro ao atualizar status no Supabase:', err);
    }

    // Recalcular visitas do cliente se foi concluído
    await fetchData();
  };

  const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  const deleteCustomer = async (id: string) => {
    const custPhone = customers.find(c => c.id === id)?.phone;
    setCustomers(prev => prev.filter(c => c.id !== id));
    if (custPhone) {
      setAppointments(prev => prev.filter(a => a.customerPhone.replace(/\D/g, '') !== custPhone.replace(/\D/g, '')));
    }

    try {
      if (isUUID(id)) {
        await supabase.from('customers').delete().eq('id', id);
      }
    } catch (err) {
      console.warn('Erro ao deletar cliente no Supabase:', err);
    }
  };

  const deleteService = async (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    try {
      if (isUUID(id)) {
        await supabase.from('services').update({ active: false }).eq('id', id);
      }
    } catch (err) {
      console.warn('Erro ao desativar serviço no Supabase:', err);
    }
  };

  const deleteBarber = async (id: string) => {
    setBarbers(prev => prev.filter(b => b.id !== id));
    try {
      if (isUUID(id)) {
        await supabase.from('barbers').delete().eq('id', id);
      }
    } catch (err) {
      console.warn('Erro ao deletar barbeiro no Supabase:', err);
    }
  };

  const deleteAppointment = async (id: string) => {
    // Mantém regra da Sprint: cancelar em vez de sumir com o histórico
    await updateAppointmentStatus(id, 'cancelled');
  };

  const resetAllData = () => {
    fetchData();
  };

  const toggleLikePortfolio = (photoId: string) => {
    setPortfolio(prev => prev.map(p => p.id === photoId ? { ...p, likesCount: (p.likesCount || 0) + 1 } : p));
  };

  const redeemLoyaltyReward = (rewardId: string, customerId: string): boolean => {
    return true;
  };

  const addCustomer = (cust: any): Customer => {
    const newC: Customer = {
      id: cust.id || 'cust-' + Date.now(),
      name: cust.name,
      phone: cust.phone,
      totalVisits: 0,
      totalSpent: 0,
      loyaltyStamps: 0,
      loyaltyPoints: 0,
      tier: 'Bronze',
      ...cust
    };
    setCustomers(prev => [newC, ...prev]);
    return newC;
  };

  const submitReview = (review: any) => {
    setReviews(prev => [{ ...review, id: 'rev-' + Date.now(), createdAt: new Date().toISOString() }, ...prev]);
  };

  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const updateSalonConfig = (cfg: Partial<SalonConfig>) => {};
  const addTransaction = (tx: any) => setTransactions(prev => [tx, ...prev]);
  const addService = (srv: any) => setServices(prev => [srv, ...prev]);

  const dismissNewBookingAlert = () => setLatestNewBooking(null);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        services,
        barbers,
        appointments,
        customers,
        salonConfig,
        currentCustomer,
        setCurrentCustomer,
        buscarClientePorWhatsapp,
        createAppointment,
        updateAppointmentStatus,
        createCustomer,
        deleteCustomer,
        deleteService,
        deleteBarber,
        deleteAppointment,
        resetAllData,
        portfolio,
        toggleLikePortfolio,
        preselectedBarberId,
        setPreselectedBarberId,
        loyaltyRewards,
        redeemLoyaltyReward,
        reviews,
        addCustomer,
        addLoyaltyStamp,
        submitReview,
        transactions,
        updateSalonConfig,
        addTransaction,
        addService,
        latestNewBooking,
        dismissNewBookingAlert,
        refreshData: fetchData,
        isLoading,
        error,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
