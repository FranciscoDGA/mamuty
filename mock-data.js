const fs = require('fs');
const file = 'lib/data.ts';
let data = fs.readFileSync(file, 'utf8');

const srv = `export const INITIAL_SERVICES: Service[] = [
  { id: 'srv-1', name: 'Corte', category: 'cabelo', description: 'Corte completo.', price: 35, durationMinutes: 40, pointsReward: 35, popular: true },
  { id: 'srv-2', name: 'Barba', category: 'barba', description: 'Barba alinhada.', price: 25, durationMinutes: 30, pointsReward: 25 },
  { id: 'srv-3', name: 'Corte + Barba', category: 'combos', description: 'Pacote completo.', price: 55, durationMinutes: 70, pointsReward: 55, popular: true }
];`;

const brb = `export const INITIAL_BARBERS: Barber[] = [
  { id: 'barber-1', name: 'João', role: 'Especialista em cortes masculinos', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80', rating: 5.0, reviewsCount: 100, specialties: ['Cortes masculinos'], phone: '11999991111', bio: 'Especialista em cortes masculinos.', availableDays: [1,2,3,4,5,6] },
  { id: 'barber-2', name: 'Carlos', role: 'Especialista em barba e acabamento', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', rating: 4.8, reviewsCount: 85, specialties: ['Barba'], phone: '11999992222', bio: 'Especialista em barba e acabamento.', availableDays: [1,2,3,4,5,6] },
  { id: 'barber-3', name: 'Pedro', role: 'Especialista em degradê', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80', rating: 4.9, reviewsCount: 92, specialties: ['Degradê'], phone: '11999993333', bio: 'Especialista em degradê.', availableDays: [1,2,3,4,5,6] },
];`;

const dateStr = (daysToAdd) => {
  const d = new Date();
  d.setDate(d.getDate() + daysToAdd);
  return d.toISOString().split('T')[0];
};

const apt = `export const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: 'apt-1', customerName: 'João Silva', customerPhone: '11999999999', serviceIds: ['srv-1'], serviceNames: ['Corte'], totalPrice: 35, totalDurationMinutes: 40, barberId: 'barber-1', barberName: 'João', date: dateStr(0), time: '14:00', status: 'confirmado', paymentMethod: 'no_local', paymentStatus: 'no_local', whatsappNotificationSent: false, createdAt: new Date().toISOString() },
  { id: 'apt-2', customerName: 'Carlos Silva', customerPhone: '11999999999', serviceIds: ['srv-2'], serviceNames: ['Barba'], totalPrice: 25, totalDurationMinutes: 30, barberId: 'barber-2', barberName: 'Carlos', date: dateStr(0), time: '15:30', status: 'confirmado', paymentMethod: 'no_local', paymentStatus: 'no_local', whatsappNotificationSent: false, createdAt: new Date().toISOString() },
  { id: 'apt-3', customerName: 'Pedro Silva', customerPhone: '11999999999', serviceIds: ['srv-3'], serviceNames: ['Corte + Barba'], totalPrice: 55, totalDurationMinutes: 70, barberId: 'barber-3', barberName: 'Pedro', date: dateStr(1), time: '16:00', status: 'confirmado', paymentMethod: 'no_local', paymentStatus: 'no_local', whatsappNotificationSent: false, createdAt: new Date().toISOString() }
];`;

data = data.replace(/export const INITIAL_SERVICES: Service\[\] = \[[\s\S]*?\];/, srv);
data = data.replace(/export const INITIAL_BARBERS: Barber\[\] = \[[\s\S]*?\];/, brb);
data = data.replace(/export const INITIAL_APPOINTMENTS: Appointment\[\] = \[[\s\S]*?\];/, apt);

fs.writeFileSync(file, data, 'utf8');
