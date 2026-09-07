const fs = require('fs');

// Fix AppContext.tsx dummy functions signature
let ctx = fs.readFileSync('context/AppContext.tsx', 'utf8');
ctx = ctx.replace(/addCustomer: \(\) => void;/g, 'addCustomer: (...args: any[]) => any;');
ctx = ctx.replace(/submitReview: \(\) => void;/g, 'submitReview: (...args: any[]) => any;');
ctx = ctx.replace(/updateSalonConfig: \(\) => void;/g, 'updateSalonConfig: (...args: any[]) => any;');
ctx = ctx.replace(/addTransaction: \(\) => void;/g, 'addTransaction: (...args: any[]) => any;');
ctx = ctx.replace(/addService: \(\) => void;/g, 'addService: (...args: any[]) => any;');
ctx = ctx.replace(/deleteService: \(\) => void;/g, 'deleteService: (...args: any[]) => any;');
ctx = ctx.replace(/resetAllData: \(\) => void;/g, 'resetAllData: (...args: any[]) => any;');
ctx = ctx.replace(/toggleLikePortfolio: \(\) => void;/g, 'toggleLikePortfolio: (...args: any[]) => any;');
ctx = ctx.replace(/setPreselectedBarberId: \(\) => void;/g, 'setPreselectedBarberId: (...args: any[]) => any;');
ctx = ctx.replace(/redeemLoyaltyReward: \(\) => void;/g, 'redeemLoyaltyReward: (...args: any[]) => any;');
fs.writeFileSync('context/AppContext.tsx', ctx);

// Fix app/whatsapp/page.tsx import Scissors
let whatsapp = fs.readFileSync('app/whatsapp/page.tsx', 'utf8');
if (!whatsapp.includes('Scissors')) {
   whatsapp = whatsapp.replace('CheckCheck, Loader2 }', 'CheckCheck, Loader2, Scissors }');
} else if (whatsapp.includes('CheckCheck, Loader2 }') && !whatsapp.includes('Scissors }', whatsapp.indexOf('CheckCheck'))) {
   whatsapp = whatsapp.replace('CheckCheck, Loader2 }', 'CheckCheck, Loader2, Scissors }');
}
fs.writeFileSync('app/whatsapp/page.tsx', whatsapp);

// Fix lib/data.ts
let dataTs = fs.readFileSync('lib/data.ts', 'utf8');
dataTs = dataTs.replace(/new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\(\)/g, "new Date().toISOString().split('T')[0]");
dataTs = dataTs.replace(/'confirmado'/g, "'confirmed'");
fs.writeFileSync('lib/data.ts', dataTs);

// Fix old components translations
const filesToTranslate = [
  'components/admin/AdminDashboard.tsx',
  'components/appointments/MyAppointments.tsx',
  'components/BottomNav.tsx'
];

for (const file of filesToTranslate) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/'confirmado'/g, "'confirmed'");
  content = content.replace(/'concluido'/g, "'completed'");
  content = content.replace(/'cancelado'/g, "'cancelled'");
  content = content.replace(/"confirmado"/g, '"confirmed"');
  content = content.replace(/"concluido"/g, '"completed"');
  content = content.replace(/"cancelado"/g, '"cancelled"');
  fs.writeFileSync(file, content);
}

// Fix ReviewsView.tsx (implicit any)
let rev = fs.readFileSync('components/reviews/ReviewsView.tsx', 'utf8');
rev = rev.replace(/map\(\(t, i\)/g, 'map((t: string, i: number)');
fs.writeFileSync('components/reviews/ReviewsView.tsx', rev);

console.log('Fixed more types');
