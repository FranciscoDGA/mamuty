'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Appointment,
  AppointmentStatus,
  Barber,
  Customer,
  FinancialTransaction,
  LoyaltyReward,
  PaymentStatus,
  PortfolioPhoto,
  Review,
  SalonConfig,
  Service,
} from '@/lib/types';
import {
  INITIAL_APPOINTMENTS,
  INITIAL_BARBERS,
  INITIAL_CUSTOMERS,
  INITIAL_LOYALTY_REWARDS,
  INITIAL_PORTFOLIO,
  INITIAL_REVIEWS,
  INITIAL_SALON_CONFIG,
  INITIAL_SERVICES,
  INITIAL_TRANSACTIONS,
} from '@/lib/data';

interface AppContextType {
  services: Service[];
  barbers: Barber[];
  appointments: Appointment[];
  reviews: Review[];
  customers: Customer[];
  loyaltyRewards: LoyaltyReward[];
  transactions: FinancialTransaction[];
  salonConfig: SalonConfig;
  portfolio: PortfolioPhoto[];
  currentCustomer: Customer | null;
  activeTab: 'agendar' | 'meus-agendamentos' | 'galeria' | 'fidelidade' | 'avaliacoes' | 'admin';
  preselectedBarberId: string | null;
  setActiveTab: (tab: 'agendar' | 'meus-agendamentos' | 'galeria' | 'fidelidade' | 'avaliacoes' | 'admin') => void;
  setPreselectedBarberId: (id: string | null) => void;
  toggleLikePortfolio: (id: string) => void;
  setCurrentCustomer: (customer: Customer | null) => void;
  createAppointment: (
    appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'whatsappNotificationSent'>
  ) => Appointment;
  updateAppointmentStatus: (
    id: string,
    status: AppointmentStatus,
    paymentStatus?: PaymentStatus
  ) => void;
  submitReview: (reviewData: Omit<Review, 'id' | 'createdAt'>) => void;
  addTransaction: (txData: Omit<FinancialTransaction, 'id'>) => void;
  updateSalonConfig: (newConfig: Partial<SalonConfig>) => void;
  redeemLoyaltyReward: (rewardId: string, customerId: string) => boolean;
  addCustomer: (customer: {
    name: string;
    phone: string;
    email?: string;
    notes?: string;
    preferredBarberId?: string;
  }) => Customer;
  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (id: string, service: Partial<Service>) => void;
  deleteService: (id: string) => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'mamuty_barbershop_db_v1';

function getSavedData() {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error('Failed to load initial local state', e);
    return null;
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedData] = useState(() => getSavedData());

  const [activeTab, setActiveTab] = useState<
    'agendar' | 'meus-agendamentos' | 'galeria' | 'fidelidade' | 'avaliacoes' | 'admin'
  >('agendar');
  const [preselectedBarberId, setPreselectedBarberId] = useState<string | null>(null);

  const [services, setServices] = useState<Service[]>(() => savedData?.services || INITIAL_SERVICES);
  const [barbers, setBarbers] = useState<Barber[]>(() => savedData?.barbers || INITIAL_BARBERS);
  const [appointments, setAppointments] = useState<Appointment[]>(() => savedData?.appointments || INITIAL_APPOINTMENTS);
  const [reviews, setReviews] = useState<Review[]>(() => savedData?.reviews || INITIAL_REVIEWS);
  const [customers, setCustomers] = useState<Customer[]>(() => savedData?.customers || INITIAL_CUSTOMERS);
  const [loyaltyRewards, setLoyaltyRewards] = useState<LoyaltyReward[]>(() => savedData?.loyaltyRewards || INITIAL_LOYALTY_REWARDS);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => savedData?.transactions || INITIAL_TRANSACTIONS);
  const [salonConfig, setSalonConfig] = useState<SalonConfig>(() => savedData?.salonConfig || INITIAL_SALON_CONFIG);
  const [portfolio, setPortfolio] = useState<PortfolioPhoto[]>(() => savedData?.portfolio || INITIAL_PORTFOLIO);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(() => {
    if (savedData?.currentCustomerId && savedData?.customers) {
      const found = savedData.customers.find((c: Customer) => c.id === savedData.currentCustomerId);
      if (found) return found;
    }
    return savedData?.customers?.[0] || INITIAL_CUSTOMERS[0];
  });

  // Save to localStorage on state change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const payload = {
        services,
        barbers,
        appointments,
        reviews,
        customers,
        loyaltyRewards,
        transactions,
        salonConfig,
        portfolio,
        currentCustomerId: currentCustomer?.id,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to persist state', e);
    }
  }, [
    services,
    barbers,
    appointments,
    reviews,
    customers,
    loyaltyRewards,
    transactions,
    salonConfig,
    portfolio,
    currentCustomer,
  ]);

  const createAppointment = (
    data: Omit<Appointment, 'id' | 'createdAt' | 'whatsappNotificationSent'>
  ): Appointment => {
    const newAppointment: Appointment = {
      ...data,
      id: `apt-${Date.now()}`,
      createdAt: new Date().toISOString(),
      whatsappNotificationSent: true,
    };

    setAppointments((prev) => [newAppointment, ...prev]);

    // Check or update customer record for loyalty and history
    setCustomers((prevCustomers) => {
      const existing = prevCustomers.find(
        (c) =>
          c.phone.replace(/\D/g, '') === data.customerPhone.replace(/\D/g, '') ||
          c.name.toLowerCase() === data.customerName.toLowerCase()
      );

      const pointsToAdd = Math.floor(data.totalPrice);

      if (existing) {
        const nextStamps = (existing.loyaltyStamps + 1) % (salonConfig.loyaltyStampsGoal + 1);
        const nextVisits = existing.totalVisits + 1;
        const nextSpent = existing.totalSpent + data.totalPrice;
        const nextPoints = existing.loyaltyPoints + pointsToAdd;
        const nextTier = nextVisits >= 10 ? 'Ouro VIP' : nextVisits >= 4 ? 'Prata' : 'Bronze';

        const updated: Customer = {
          ...existing,
          name: data.customerName || existing.name,
          email: data.customerEmail || existing.email,
          totalVisits: nextVisits,
          totalSpent: nextSpent,
          loyaltyStamps: nextStamps === 0 ? 1 : nextStamps,
          loyaltyPoints: nextPoints,
          tier: nextTier,
          lastVisit: data.date,
          preferredBarberId: data.barberId,
        };

        if (currentCustomer && currentCustomer.id === existing.id) {
          setCurrentCustomer(updated);
        }

        return prevCustomers.map((c) => (c.id === existing.id ? updated : c));
      } else {
        const newCustomer: Customer = {
          id: `cli-${Date.now()}`,
          name: data.customerName,
          phone: data.customerPhone,
          email: data.customerEmail,
          totalVisits: 1,
          totalSpent: data.totalPrice,
          loyaltyStamps: 1,
          loyaltyPoints: pointsToAdd,
          tier: 'Bronze',
          lastVisit: data.date,
          preferredBarberId: data.barberId,
        };

        setCurrentCustomer(newCustomer);
        return [newCustomer, ...prevCustomers];
      }
    });

    // If paid via PIX or Cartão, register revenue transaction immediately
    if (data.paymentStatus === 'pago') {
      const newTx: FinancialTransaction = {
        id: `tx-${Date.now()}`,
        appointmentId: newAppointment.id,
        type: 'receita',
        category: 'Serviços de Barbearia',
        amount: data.totalPrice,
        date: data.date,
        paymentMethod: data.paymentMethod,
        description: `Agendamento ${data.customerName} (${data.serviceNames.join(', ')})`,
        barberId: data.barberId,
      };
      setTransactions((prev) => [newTx, ...prev]);
    }

    return newAppointment;
  };

  const updateAppointmentStatus = (
    id: string,
    status: AppointmentStatus,
    paymentStatus?: PaymentStatus
  ) => {
    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id === id) {
          const updated = {
            ...apt,
            status,
            paymentStatus: paymentStatus !== undefined ? paymentStatus : apt.paymentStatus,
          };

          // If transitioning to paid and was not paid, add revenue transaction
          if (apt.paymentStatus !== 'pago' && paymentStatus === 'pago') {
            const newTx: FinancialTransaction = {
              id: `tx-${Date.now()}`,
              appointmentId: apt.id,
              type: 'receita',
              category: 'Serviços de Barbearia',
              amount: apt.totalPrice,
              date: apt.date,
              paymentMethod: apt.paymentMethod,
              description: `Pagamento recebido: ${apt.customerName} (${apt.serviceNames.join(', ')})`,
              barberId: apt.barberId,
            };
            setTransactions((txs) => [newTx, ...txs]);
          }

          return updated;
        }
        return apt;
      })
    );
  };

  const submitReview = (reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    const newReview: Review = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setReviews((prev) => [newReview, ...prev]);

    // Recalculate barber rating
    setBarbers((prevBarbers) =>
      prevBarbers.map((b) => {
        if (b.id === reviewData.barberId) {
          const barberReviews = reviews.filter((r) => r.barberId === b.id);
          const totalScore = barberReviews.reduce((acc, r) => acc + r.rating, reviewData.rating);
          const newCount = b.reviewsCount + 1;
          const newAvg = Number((totalScore / (barberReviews.length + 1)).toFixed(2));
          return {
            ...b,
            rating: newAvg,
            reviewsCount: newCount,
          };
        }
        return b;
      })
    );

    // If linked to appointment, mark ratingSubmitted
    if (reviewData.appointmentId) {
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === reviewData.appointmentId ? { ...apt, ratingSubmitted: true } : apt
        )
      );
    }
  };

  const addTransaction = (txData: Omit<FinancialTransaction, 'id'>) => {
    const newTx: FinancialTransaction = {
      ...txData,
      id: `tx-${Date.now()}`,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const updateSalonConfig = (newConfig: Partial<SalonConfig>) => {
    setSalonConfig((prev) => ({ ...prev, ...newConfig }));
  };

  const redeemLoyaltyReward = (rewardId: string, customerId: string): boolean => {
    const reward = loyaltyRewards.find((r) => r.id === rewardId);
    const customer = customers.find((c) => c.id === customerId);
    if (!reward || !customer) return false;

    if (reward.type === 'points') {
      if (customer.loyaltyPoints < reward.pointsCost) return false;
      const updated: Customer = {
        ...customer,
        loyaltyPoints: customer.loyaltyPoints - reward.pointsCost,
      };
      setCustomers((prev) => prev.map((c) => (c.id === customer.id ? updated : c)));
      if (currentCustomer && currentCustomer.id === customer.id) {
        setCurrentCustomer(updated);
      }
      return true;
    } else {
      // stamps
      const required = reward.stampsRequired || 5;
      if (customer.loyaltyStamps < required) return false;
      const updated: Customer = {
        ...customer,
        loyaltyStamps: customer.loyaltyStamps - required,
      };
      setCustomers((prev) => prev.map((c) => (c.id === customer.id ? updated : c)));
      if (currentCustomer && currentCustomer.id === customer.id) {
        setCurrentCustomer(updated);
      }
      return true;
    }
  };

  const addCustomer = (
    customerData: Omit<
      Customer,
      'id' | 'createdAt' | 'loyaltyPoints' | 'loyaltyStamps' | 'tier' | 'totalVisits' | 'totalSpent'
    >
  ): Customer => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      loyaltyPoints: 50, // Welcome gift points
      loyaltyStamps: 0,
      tier: 'Bronze',
      totalVisits: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  };

  const addService = (serviceData: Omit<Service, 'id'>) => {
    const newService: Service = {
      ...serviceData,
      id: `srv-${Date.now()}`,
    };
    setServices((prev) => [...prev, newService]);
  };

  const updateService = (id: string, updatedFields: Partial<Service>) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updatedFields } : s)));
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleLikePortfolio = (photoId: string) => {
    setPortfolio((prev) =>
      prev.map((item) => {
        if (item.id === photoId) {
          return { ...item, likesCount: item.likesCount + 1 };
        }
        return item;
      })
    );
  };

  const resetAllData = () => {
    setServices(INITIAL_SERVICES);
    setBarbers(INITIAL_BARBERS);
    setAppointments(INITIAL_APPOINTMENTS);
    setReviews(INITIAL_REVIEWS);
    setCustomers(INITIAL_CUSTOMERS);
    setLoyaltyRewards(INITIAL_LOYALTY_REWARDS);
    setTransactions(INITIAL_TRANSACTIONS);
    setSalonConfig(INITIAL_SALON_CONFIG);
    setPortfolio(INITIAL_PORTFOLIO);
    setCurrentCustomer(INITIAL_CUSTOMERS[0]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <AppContext.Provider
      value={{
        services,
        barbers,
        appointments,
        reviews,
        customers,
        loyaltyRewards,
        transactions,
        salonConfig,
        portfolio,
        currentCustomer,
        activeTab,
        preselectedBarberId,
        setActiveTab,
        setPreselectedBarberId,
        toggleLikePortfolio,
        setCurrentCustomer,
        createAppointment,
        updateAppointmentStatus,
        submitReview,
        addTransaction,
        updateSalonConfig,
        redeemLoyaltyReward,
        addCustomer,
        addService,
        updateService,
        deleteService,
        resetAllData,
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
