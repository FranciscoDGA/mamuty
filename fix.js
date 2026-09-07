const fs = require('fs');

let data = fs.readFileSync('lib/data.ts', 'utf8');
data = data.replace(/paymentMethod: 'no_local'/g, "paymentMethod: 'presencial'");
data = data.replace(/paymentMethod: "no_local"/g, 'paymentMethod: "presencial"');
data = data.replace(/dateStr/g, "new Date().toISOString().split('T')[0]");
fs.writeFileSync('lib/data.ts', data);

let wizard = fs.readFileSync('components/booking/BookingWizard.tsx', 'utf8');
wizard = wizard.replace(/'cancelado'/g, "'cancelled'");
fs.writeFileSync('components/booking/BookingWizard.tsx', wizard);

let whatsapp = fs.readFileSync('app/whatsapp/page.tsx', 'utf8');
whatsapp = whatsapp.replace(/'cancelado'/g, "'cancelled'");
fs.writeFileSync('app/whatsapp/page.tsx', whatsapp);

let ctx = fs.readFileSync('context/AppContext.tsx', 'utf8');
ctx = ctx.replace(/paymentMethod: 'no_local'/g, "paymentMethod: 'presencial'");
fs.writeFileSync('context/AppContext.tsx', ctx);

console.log('Fixed');
