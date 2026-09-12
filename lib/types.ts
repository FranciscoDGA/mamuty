export type ServiceCategory = 'cabelo' | 'barba' | 'combos' | 'tratamentos' | 'produtos';

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  price: number;
  durationMinutes: number;
  pointsReward: number;
  popular?: boolean;
  active?: boolean;
}

export interface Barber {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  rating: number;
  reviewsCount: number;
  specialties: string[];
  phone: string;
  bio: string;
  availableDays: number[]; // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  active?: boolean;
}

export type PaymentMethod = 'pix' | 'dinheiro' | 'debito' | 'credito' | 'cartao' | 'presencial';
export type PaymentStatus = 'pendente' | 'pago' | 'no_local';
export type AppointmentStatus = 'aguardando' | 'confirmed' | 'em_andamento' | 'completed' | 'cancelled' | 'nao_compareceu';

export interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  barberId: string;
  barberName: string;
  serviceIds: string[];
  serviceNames: string[];
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  totalPrice: number;
  totalDurationMinutes: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: AppointmentStatus;
  notes?: string;
  whatsappNotificationSent: boolean;
  createdAt: string;
  source?: string;
  pixPayload?: string;
  ratingSubmitted?: boolean;
  arrivalTime?: string; // HH:mm - horário de chegada do cliente
  delayMinutes?: number; // minutos de atraso (negativo = adiantado)
}

export interface Review {
  id: string;
  customerName: string;
  barberId: string;
  barberName: string;
  rating: number; // 1 to 5
  comment: string;
  tags: string[];
  createdAt: string;
  appointmentId?: string;
}

export type CustomerType = 'novo' | 'recorrente' | 'inativo' | 'vip';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalVisits: number;
  totalSpent: number;
  loyaltyStamps: number; // e.g. 0-10
  loyaltyPoints: number;
  tier: 'Bronze' | 'Prata' | 'Ouro VIP';
  customerType?: CustomerType;
  lastVisit?: string;
  preferredBarberId?: string;
  notes?: string;
  birthdate?: string;
  createdAt?: string;
}

export interface LoyaltyReward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  stampsRequired?: number;
  badge: string;
  type: 'stamps' | 'points';
}

export interface FinancialTransaction {
  id: string;
  appointmentId?: string;
  type: 'receita' | 'despesa';
  category: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod | 'dinheiro';
  description: string;
  barberId?: string;
}

export interface PortfolioPhoto {
  id: string;
  barberId: string;
  barberName: string;
  barberAvatar: string;
  title: string;
  styleTag: string; // e.g. "Fade Degradê", "Barba Alinhada", "Corte Social Clássico", "Freestyle Urbano", "Pompadour Texturizado"
  category: 'fade' | 'barba' | 'classico' | 'freestyle' | 'platinado' | 'tratamento';
  imageUrl: string;
  description: string;
  likesCount: number;
  createdAt: string;
  suggestedServiceName?: string;
}

export interface SalonConfig {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  whatsappNumber: string;
  pixKey: string;
  pixKeyType: string;
  pixBeneficiary: string;
  pixCity: string;
  instagram: string;
  openingHours: string;
  loyaltyStampsGoal: number;
  toleranceMinutes: number;
}

export interface BarberSchedule {
  id: string;
  barberId: string;
  dayOff: number[]; // 0=Domingo, 1=Segunda, ..., 6=Sábado
  blockedSlots: BlockedSlot[];
}

export interface BlockedSlot {
  id: string;
  barberId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  reason?: string;
}

export interface ClosedDay {
  id: string;
  date: string; // YYYY-MM-DD
  reason: string;
}
