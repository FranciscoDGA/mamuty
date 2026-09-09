'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appointment, Barber, Customer, Service, SalonConfig, FinancialTransaction } from '@/lib/types';
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
  createAppointment: (apt: Partial<Appointment> & { customerName: string, customerPhone: string, source?: string }) => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch Services
      const { data: sData, error: sErr } = await supabase.from('services').select('*').eq('active', true);
      if (sErr || !sData || sData.length === 0) {
        console.warn('Supabase services unavailable or empty, using fallback:', sErr);
        setServices(INITIAL_SERVICES);
      } else {
        setServices(sData.map(s => ({
          id: s.id,
          name: s.name,
          category: 'cabelo',
          description: s.description || '',
          price: Number(s.price),
          durationMinutes: s.duration_minutes,
          pointsReward: 0,
        })));
      }
      
      // 2. Fetch Barbers
      const { data: bData, error: bErr } = await supabase.from('barbers').select('*').eq('active', true);
      if (bErr || !bData || bData.length === 0) {
        console.warn('Supabase barbers unavailable or empty, using fallback:', bErr);
        setBarbers(INITIAL_BARBERS);
      } else {
        setBarbers([
          ...bData.map(b => ({
            id: b.id,
            name: b.name,
            role: b.description || 'Especialista',
            avatarUrl: b.photo_url || '',
            rating: 5,
            reviewsCount: 0,
            specialties: b.specialty ? [b.specialty] : [],
            phone: '',
            bio: b.description || '',
            availableDays: [1,2,3,4,5,6],
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
      
      // 3. Fetch Appointments
      const { data: aData, error: aErr } = await supabase.from('appointments').select(`
        *,
        customers ( name, phone ),
        services ( name ),
        barbers ( name )
      `).order('appointment_date', { ascending: false }).order('appointment_time', { ascending: false });

      if (aErr || !aData) {
        console.warn('Supabase appointments fetch note:', aErr);
      } else {
        setAppointments(aData.map(a => ({
          id: a.id,
          customerName: a.customers?.name || 'Cliente',
          customerPhone: a.customers?.phone || '',
          barberId: a.barber_id,
          barberName: a.barbers?.name || '',
          serviceIds: [a.service_id],
          serviceNames: [a.services?.name || ''],
          date: a.appointment_date,
          time: a.appointment_time ? a.appointment_time.substring(0,5) : '10:00',
          totalPrice: Number(a.price || 0),
          totalDurationMinutes: a.duration_minutes || 30,
          paymentMethod: 'presencial',
          paymentStatus: 'pendente',
          status: (a.status as any) || 'confirmed',
          whatsappNotificationSent: false,
          createdAt: a.created_at,
          source: a.source || 'web'
        })));
      }

      // 4. Fetch Customers
      const { data: cData, error: cErr } = await supabase.from('customers').select('*');
      if (cErr || !cData) {
        console.warn('Supabase customers fetch note:', cErr);
      } else {
        setCustomers(cData.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          totalVisits: 0,
          totalSpent: 0,
          loyaltyStamps: 0,
          loyaltyPoints: 0,
          tier: 'Bronze'
        })));
      }

    } catch (err: any) {
      console.warn('Graceful fallback applied:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createCustomer = async (name: string, phone: string) => {
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
        tier: 'Bronze'
      };
      setCustomers(prev => [newC, ...prev]);
      return newC;
    }
  };

  const addLoyaltyStamp = async (phone: string): Promise<Customer | null> => {
    const cleanPhone = phone.replace(/\D/g, '');
    let updatedCustomer: Customer | null = null;
    setCustomers(prev => prev.map(c => {
      if (c.phone.replace(/\D/g, '') === cleanPhone) {
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

    // Best-effort Supabase sync
    try {
      const { data: dbCust } = await supabase.from('customers').select('id, notes').eq('phone', cleanPhone).maybeSingle();
      if (dbCust) {
        await supabase.from('customers').update({
          notes: `${dbCust.notes || ''} [STAMPS:+1]`.trim()
        }).eq('id', dbCust.id);
      }
    } catch (e) {
      console.warn('Sync stamp note:', e);
    }

    return updatedCustomer;
  };

  const createAppointment = async (apt: Partial<Appointment> & { customerName: string, customerPhone: string, source?: string }) => {
    let customerId = '';
    const cleanPhone = apt.customerPhone.replace(/\D/g, '');
    
    try {
      // Find or create customer in Supabase
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

      // 2. Resolve Service UUID
      const isUUID = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));
      
      let finalServiceId = apt.serviceIds?.[0];
      if (!isUUID(finalServiceId)) {
        const found = services.find(s => isUUID(s.id) && (s.id === finalServiceId || s.name === apt.serviceNames?.[0]));
        finalServiceId = found ? found.id : services.find(s => isUUID(s.id))?.id;
      }

      // 3. Resolve Barber UUID
      let finalBarberId = apt.barberId;
      if (!isUUID(finalBarberId) || finalBarberId === 'any') {
        const found = barbers.find(b => isUUID(b.id) && (b.id === finalBarberId || b.name === apt.barberName));
        finalBarberId = found ? found.id : barbers.find(b => isUUID(b.id) && b.id !== 'any')?.id;
      }

      // 4. Insert appointment in Supabase (omit 'source' column since it may not exist in DB schema, save in notes instead)
      const appointmentPayload: any = {
        customer_id: customerId || null,
        service_id: finalServiceId || null,
        barber_id: finalBarberId || null,
        appointment_date: apt.date || new Date().toISOString().split('T')[0],
        appointment_time: (apt.time?.length === 5 ? apt.time + ':00' : apt.time) || '10:00:00',
        status: 'confirmed',
        price: apt.totalPrice || 0,
        duration_minutes: apt.totalDurationMinutes || 30,
        notes: apt.source ? `Origem: ${apt.source}` : 'Origem: web',
      };

      const { data: insertedApt, error: aptErr } = await supabase
        .from('appointments')
        .insert(appointmentPayload)
        .select('*')
        .single();

      if (aptErr) {
        console.error('Supabase appointment insert error:', aptErr);
      } else {
        console.log('Agendamento salvo com sucesso no Supabase:', insertedApt);
      }
    } catch (err) {
      console.error('Error saving to Supabase:', err);
    }

    // Always update local state immediately so user sees appointment instantly
    const newApt: Appointment = {
      id: 'apt-' + Date.now(),
      customerName: apt.customerName,
      customerPhone: cleanPhone,
      barberId: apt.barberId || '',
      barberName: apt.barberName || '',
      serviceIds: apt.serviceIds || [],
      serviceNames: apt.serviceNames || [],
      date: apt.date || new Date().toISOString().split('T')[0],
      time: apt.time || '10:00',
      totalPrice: apt.totalPrice || 0,
      totalDurationMinutes: apt.totalDurationMinutes || 30,
      paymentMethod: 'presencial',
      paymentStatus: 'pendente',
      status: 'confirmed',
      whatsappNotificationSent: false,
      createdAt: new Date().toISOString(),
      source: apt.source || 'web'
    };

    setAppointments(prev => [newApt, ...prev]);

    // Background refresh
    fetchData();
  };

  const updateAppointmentStatus = async (id: string, status: 'confirmed' | 'completed' | 'cancelled') => {
    // Update local state immediately
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));

    try {
      await supabase.from('appointments').update({ status }).eq('id', id);
    } catch (err) {
      console.warn('Status update sync error:', err);
    }
  };

  const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  const deleteCustomer = async (id: string) => {
    const custPhone = customers.find(c => c.id === id)?.phone;
    setCustomers(prev => prev.filter(c => c.id !== id));
    if (custPhone) {
      setAppointments(prev => prev.filter(a => a.customerPhone.replace(/\D/g, '') !== custPhone.replace(/\D/g, '')));
    }

    if (isUUID(id)) {
      try {
        await supabase.from('appointments').delete().eq('customer_id', id);
        const { error } = await supabase.from('customers').delete().eq('id', id);
        if (error) console.warn('Supabase delete customer error:', error);
      } catch (err) {
        console.warn('Delete customer error:', err);
      }
    }
  };

  const deleteService = async (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));

    if (isUUID(id)) {
      try {
        await supabase.from('appointments').delete().eq('service_id', id);
        const { error } = await supabase.from('services').delete().eq('id', id);
        if (error) console.warn('Supabase delete service error:', error);
      } catch (err) {
        console.warn('Delete service error:', err);
      }
    }
  };

  const deleteBarber = async (id: string) => {
    setBarbers(prev => prev.filter(b => b.id !== id));

    if (isUUID(id)) {
      try {
        await supabase.from('appointments').delete().eq('barber_id', id);
        const { error } = await supabase.from('barbers').delete().eq('id', id);
        if (error) console.warn('Supabase delete barber error:', error);
      } catch (err) {
        console.warn('Delete barber error:', err);
      }
    }
  };

  const deleteAppointment = async (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));

    if (isUUID(id)) {
      try {
        const { error } = await supabase.from('appointments').delete().eq('id', id);
        if (error) console.warn('Supabase delete appointment error:', error);
      } catch (err) {
        console.warn('Delete appointment error:', err);
      }
    }
  };

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
        createAppointment,
        updateAppointmentStatus,
        createCustomer,
        deleteCustomer,
        deleteService,
        deleteBarber,
        deleteAppointment,

        addCustomer: (cust: any): Customer => {
          const newC: Customer = {
            id: `cli-${Date.now()}`,
            name: cust.name,
            phone: cust.phone,
            totalVisits: 0,
            totalSpent: 0,
            loyaltyStamps: 0,
            loyaltyPoints: 0,
            tier: 'Bronze',
            createdAt: new Date().toISOString()
          };
          setCustomers(prev => [...prev, newC]);
          createCustomer(cust.name, cust.phone);
          return newC;
        },
        addLoyaltyStamp,
        submitReview: (rev: any) => {
          const newRev = {
            id: `rev-${Date.now()}`,
            customerName: rev.customerName,
            barberId: rev.barberId,
            barberName: rev.barberName,
            rating: rev.rating,
            comment: rev.comment,
            tags: rev.tags || [],
            createdAt: new Date().toISOString(),
          };
          setReviews(prev => [newRev, ...prev]);
        },
        transactions: [],
        updateSalonConfig: () => {},
        addTransaction: () => {},
        addService: () => {},
        resetAllData: () => {},
        portfolio,
        toggleLikePortfolio: (photoId: string) => {
          setPortfolio(prev =>
            prev.map(item =>
              item.id === photoId ? { ...item, likesCount: item.likesCount + 1 } : item
            )
          );
        },
        preselectedBarberId,
        setPreselectedBarberId,
        loyaltyRewards,
        redeemLoyaltyReward: (rewardId: string, customerId: string) => {
          const reward = loyaltyRewards.find(r => r.id === rewardId);
          if (!reward || !currentCustomer) return false;
          if (currentCustomer.loyaltyStamps < (reward.stampsRequired || 0)) return false;

          const updatedCustomer: Customer = {
            ...currentCustomer,
            loyaltyStamps: Math.max(0, currentCustomer.loyaltyStamps - (reward.stampsRequired || 0)),
          };
          setCurrentCustomer(updatedCustomer);
          setCustomers(prev => prev.map(c => c.id === customerId ? updatedCustomer : c));
          return true;
        },
        reviews,

        refreshData: fetchData,
        isLoading,
        error: null
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
