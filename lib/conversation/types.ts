import { Appointment, Barber, Customer, PaymentMethod, Service } from '../types';
import { ResultadoDisponibilidade } from '../availability';

export type IntentType =
  | 'BUSINESS_STATUS'
  | 'BUSINESS_HOURS'
  | 'SERVICE_LIST'
  | 'SERVICE_PRICE'
  | 'BARBER_LIST'
  | 'ADDRESS'
  | 'PAYMENT_METHODS'
  | 'CHECK_AVAILABILITY'
  | 'START_BOOKING'
  | 'SELECT_SERVICE'
  | 'SELECT_BARBER'
  | 'SELECT_TIME'
  | 'CONFIRM_BOOKING'
  | 'CANCEL_APPOINTMENT'
  | 'RESCHEDULE_APPOINTMENT'
  | 'CHECK_MY_APPOINTMENT'
  | 'GREETING'
  | 'THANKS'
  | 'GOODBYE'
  | 'HUMAN_HANDOFF'
  | 'UNKNOWN'
  // Sprint 5: Intenções Comerciais
  | 'OBJECTION_HANDLING'
  | 'SALES_INTENT'
  | 'UPSELL_SUGGESTION'
  | 'CROSSSELL_SUGGESTION'
  | 'CLOSE_SALE'
  | 'LEAD_QUALIFICATION'
  // Sprint 6: Automação e Pós-Venda
  | 'RATING_RECEIVED'
  | 'FEEDBACK_RECEIVED'
  | 'AUTOMATION_STATUS'
  | 'SCHEDULE_OPPORTUNITY'
  | 'SCHEDULE_CHECK'
  | 'RECOVERY_CHECK'
  | 'POST_SALE'
  | 'REMINDER'
  // Legacy compat
  | 'HORARIO_FUNCIONAMENTO'
  | 'CONSULTAR_SERVICOS'
  | 'CONSULTAR_DISPONIBILIDADE'
  | 'INICIAR_AGENDAMENTO'
  | 'CONFIRMAR_AGENDAMENTO'
  | 'REAGENDAR'
  | 'INFORMACOES_GERAIS'
  | 'FALAR_COM_HUMANO'
  | 'SAUDACAO'
  | 'OUTROS';

export type DialogStep =
  | 'IDLE'
  | 'AWAITING_SERVICE'
  | 'AWAITING_BARBER'
  | 'AWAITING_DATE'
  | 'AWAITING_TIME'
  | 'AWAITING_PAYMENT'
  | 'AWAITING_CUSTOMER_DATA'
  | 'AWAITING_CONFIRMATION'
  | 'AWAITING_CANCEL_CONFIRMATION'
  | 'AWAITING_RESCHEDULE_DATE';

export interface BookingDraft {
  service?: Service;
  barber?: Barber;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  paymentMethod?: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  existingCustomer?: Customer | null;
  rescheduleAppointmentId?: string;
}

export interface QuickReply {
  label: string;
  action: string;
  payload?: any;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'marcos' | 'system';
  text: string;
  timestamp: string; // HH:mm
  intent?: IntentType;
  quickReplies?: QuickReply[];
  component?: 
    | 'services_list'
    | 'barbers_list'
    | 'dates_list'
    | 'slots_list'
    | 'payment_methods'
    | 'summary_card'
    | 'confirmed_card'
    | 'cancel_card'
    | 'human_handoff';
  payload?: any;
}
