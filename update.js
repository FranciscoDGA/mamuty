const fs = require('fs');
const file = 'lib/data.ts';
let data = fs.readFileSync(file, 'utf8');

const srv = \export const INITIAL_SERVICES: Service[] = [
  { id: 'srv-1', name: 'Corte', category: 'cabelo', description: 'Corte completo', price: 35, durationMinutes: 40, pointsReward: 35, popular: true },
  { id: 'srv-2', name: 'Barba', category: 'barba', description: 'Barba alinhada', price: 25, durationMinutes: 30, pointsReward: 25 },
  { id: 'srv-3', name: 'Corte + Barba', category: 'combos', description: 'Corte e barba', price: 55, durationMinutes: 70, pointsReward: 55, popular: true }
];\;

const brb = \export const INITIAL_BARBERS: Barber[] = [
  { id: 'barber-1', name: 'João', role: 'Especialista em cortes masculinos', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80', rating: 5.0, reviewsCount: 100, specialties: ['Cortes'], phone: '11999991111', bio: 'Especialista.', availableDays: [1,2,3,4,5,6] },
  { id: 'barber-2', name: 'Carlos', role: 'Especialista em barba e acabamento', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', rating: 4.8, reviewsCount: 85, specialties: ['Barba'], phone: '11999992222', bio: 'Especialista.', availableDays: [1,2,3,4,5,6] },
  { id: 'barber-3', name: 'Pedro', role: 'Especialista em degradê', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80', rating: 4.9, reviewsCount: 92, specialties: ['Degradê'], phone: '11999993333', bio: 'Especialista.', availableDays: [1,2,3,4,5,6] },
  { id: 'any', name: 'Qualquer profissional', role: 'Disponível', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80', rating: 5.0, reviewsCount: 0, specialties: [], phone: '', bio: '', availableDays: [1,2,3,4,5,6] }
];\;

const apt = \export const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: 'apt-1', customerName: 'João Silva', customerPhone: '11999999999', serviceId: 'srv-1', serviceName: 'Corte', servicePrice: 35, serviceDuration: 40, barberId: 'barber-1', barberName: 'João', date: new Date().toISOString().split('T')[0], time: '14:00', status: 'confirmado', paymentMethod: 'no_local', createdAt: new Date().toISOString() },
  { id: 'apt-2', customerName: 'Maria Silva', customerPhone: '11999999999', serviceId: 'srv-2', serviceName: 'Barba', servicePrice: 25, serviceDuration: 30, barberId: 'barber-2', barberName: 'Carlos', date: new Date().toISOString().split('T')[0], time: '15:30', status: 'confirmado', paymentMethod: 'no_local', createdAt: new Date().toISOString() },
  { id: 'apt-3', customerName: 'José Silva', customerPhone: '11999999999', serviceId: 'srv-3', serviceName: 'Corte + Barba', servicePrice: 55, serviceDuration: 70, barberId: 'barber-3', barberName: 'Pedro', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], time: '16:00', status: 'confirmado', paymentMethod: 'no_local', createdAt: new Date().toISOString() }
];\;

data = data.replace(/export const INITIAL_SERVICES: Service\[\] = \[[\s\S]*?\];/, srv);
data = data.replace(/export const INITIAL_BARBERS: Barber\[\] = \[[\s\S]*?\];/, brb);
data = data.replace(/export const INITIAL_APPOINTMENTS: Appointment\[\] = \[[\s\S]*?\];/, apt);

fs.writeFileSync(file, data, 'utf8');
