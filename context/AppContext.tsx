'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appointment, Barber, Customer, Service, SalonConfig } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { INITIAL_SALON_CONFIG } from '@/lib/data';

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
  
  addCustomer: (...args: any[]) => any;
  submitReview: (...args: any[]) => any;
  transactions: any[];
  updateSalonConfig: (...args: any[]) => any;
  addTransaction: (...args: any[]) => any;
  addService: (...args: any[]) => any;
  deleteService: (...args: any[]) => any;
  resetAllData: (...args: any[]) => any;
  portfolio: any[];
  toggleLikePortfolio: (...args: any[]) => any;
  setPreselectedBarberId: (...args: any[]) => any;
  loyaltyRewards: any[];
  redeemLoyaltyReward: (...args: any[]) => any;
  reviews: any[];
  isLoading: boolean;

  error: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState('agendar');
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salonConfig] = useState<SalonConfig>(INITIAL_SALON_CONFIG);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Supabase não configurado. Verifique as variáveis de ambiente.');
      }

      // Fetch Services
      const { data: sData, error: sErr } = await supabase.from('services').select('*').eq('active', true);
      if (sErr) throw sErr;
      
      // Fetch Barbers
      const { data: bData, error: bErr } = await supabase.from('barbers').select('*').eq('active', true);
      if (bErr) throw bErr;
      
      // Fetch Appointments (For demo, fetch all. In prod, fetch future or recent)
      const { data: aData, error: aErr } = await supabase.from('appointments').select(`
        *,
        customers ( name, phone ),
        services ( name ),
        barbers ( name )
      `).order('appointment_date', { ascending: false }).order('appointment_time', { ascending: false });
      if (aErr) throw aErr;

      // Fetch Customers
      const { data: cData, error: cErr } = await supabase.from('customers').select('*');
      if (cErr) throw cErr;

      setServices(sData.map(s => ({
        id: s.id,
        name: s.name,
        category: 'cabelo',
        description: s.description || '',
        price: Number(s.price),
        durationMinutes: s.duration_minutes,
        pointsReward: 0,
      })));

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

      setAppointments(aData.map(a => ({
        id: a.id,
        customerName: a.customers?.name || 'Cliente',
        customerPhone: a.customers?.phone || '',
        barberId: a.barber_id,
        barberName: a.barbers?.name || '',
        serviceIds: [a.service_id],
        serviceNames: [a.services?.name || ''],
        date: a.appointment_date,
        time: a.appointment_time.substring(0,5),
        totalPrice: Number(a.price),
        totalDurationMinutes: a.duration_minutes,
        paymentMethod: 'presencial',
        paymentStatus: 'pendente',
        status: a.status as any,
        whatsappNotificationSent: false,
        createdAt: a.created_at,
        source: a.source || 'web'
      })));

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao carregar dados do servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const createAppointment = async (apt: Partial<Appointment> & { customerName: string, customerPhone: string, source?: string }) => {
    // 1. Find or create customer
    let customerId = '';
    
    // Check if customer exists by phone
    const { data: existingCust } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', apt.customerPhone.replace(/\D/g, ''))
      .single();
      
    if (existingCust) {
      customerId = existingCust.id;
    } else {
      const { data: newCust, error: custErr } = await supabase
        .from('customers')
        .insert({
          name: apt.customerName,
          phone: apt.customerPhone.replace(/\D/g, '')
        })
        .select('id')
        .single();
        
      if (custErr) throw custErr;
      customerId = newCust.id;
    }

    // 2. Double check availability
    const { data: conflicts } = await supabase
      .from('appointments')
      .select('id')
      .eq('barber_id', apt.barberId)
      .eq('appointment_date', apt.date)
      .eq('appointment_time', apt.time + ':00')
      .neq('status', 'cancelled');
      
    if (conflicts && conflicts.length > 0) {
      throw new Error('Esse horário acabou de ser reservado. Escolha outro horário.');
    }

    // 3. Insert appointment
    const { error: aptErr } = await supabase
      .from('appointments')
      .insert({
        customer_id: customerId,
        service_id: apt.serviceIds?.[0],
        barber_id: apt.barberId,
        appointment_date: apt.date,
        appointment_time: apt.time + ':00',
        status: 'confirmed',
        source: apt.source || 'web',
        price: apt.totalPrice,
        duration_minutes: apt.totalDurationMinutes,
      });

    if (aptErr) throw aptErr;

    // Refresh data
    await fetchData();
  };

  const updateAppointmentStatus = async (id: string, status: 'confirmed' | 'completed' | 'cancelled') => {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);
      
    if (error) throw error;
    await fetchData();
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
        addCustomer: () => {},
        submitReview: () => {},
        transactions: [],
        updateSalonConfig: () => {},
        addTransaction: () => {},
        addService: () => {},
        deleteService: () => {},
        resetAllData: () => {},
        portfolio: [],
        toggleLikePortfolio: () => {},
        setPreselectedBarberId: () => {},
        loyaltyRewards: [],
        redeemLoyaltyReward: () => {},
        reviews: [],

        isLoading,
        error
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
