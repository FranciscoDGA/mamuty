const fs = require('fs');

let ctx = fs.readFileSync('context/AppContext.tsx', 'utf8');

// Insert dummy functions into AppContextType interface
const interfaceInjection = `
  addCustomer: () => void;
  submitReview: () => void;
  transactions: any[];
  updateSalonConfig: () => void;
  addTransaction: () => void;
  addService: () => void;
  deleteService: () => void;
  resetAllData: () => void;
  portfolio: any[];
  toggleLikePortfolio: () => void;
  setPreselectedBarberId: () => void;
  loyaltyRewards: any[];
  redeemLoyaltyReward: () => void;
  reviews: any[];
  isLoading: boolean;
`;

ctx = ctx.replace('isLoading: boolean;', interfaceInjection);

// Insert dummy functions into AppContext.Provider value
const valueInjection = `
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
`;

ctx = ctx.replace('updateAppointmentStatus,', valueInjection);

fs.writeFileSync('context/AppContext.tsx', ctx);
console.log('Context fixed');
