'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appointment, Barber, Customer, Service, SalonConfig } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import {
  INITIAL_SALON_CONFIG,
  INITIAL_SERVICES,
  INITIAL_BARBERS,
  INITIAL_CUSTOMERS,
  INITIAL_APPOINTMENTS,
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
  createCustomer: (name: string, phone: string) => Promise<any>;
  
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

      // Insert appointment in Supabase
      const { error: aptErr } = await supabase
        .from('appointments')
        .insert({
          customer_id: customerId || null,
          service_id: apt.serviceIds?.[0] || null,
          barber_id: apt.barberId || null,
          appointment_date: apt.date,
          appointment_time: (apt.time?.length === 5 ? apt.time + ':00' : apt.time) || '10:00:00',
          status: 'confirmed',
          source: apt.source || 'web',
          price: apt.totalPrice || 0,
          duration_minutes: apt.totalDurationMinutes || 30,
        });

      if (aptErr) {
        console.warn('Supabase insert note:', aptErr);
      }
    } catch (err) {
      console.warn('Error saving to Supabase, saving in memory state:', err);
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

        addCustomer: (cust: any) => {
          createCustomer(cust.name, cust.phone);
        },
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
