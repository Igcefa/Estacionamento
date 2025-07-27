// Core types for the parking management system
export interface Vehicle {
  id?: string; // Unique identifier for each parking session
  plate: string;
  entryTime: Date;
  exitTime?: Date;
  pricingTableId: string;
  couponId?: string;
  specialClientId?: string;
  totalCost?: number;
  paymentMethods?: PaymentEntry[];
  amountReceived?: number;
  change?: number;
  isPaid?: boolean;
}

export interface SpecialClient {
  id: string;
  name: string;
  document?: string;
  phone?: string;
  email?: string;
  plates: string[]; // Array of vehicle plates
  pricingTableId?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface PaymentEntry {
  method: string;
  amount: number;
}

export interface PricingTable {
  id: string;
  name: string;
  fra15: number; // Price per 15-minute fraction
  diaria: number; // Daily rate (24h)
  diurno: number; // Diurnal fixed price
  noturno: number; // Nocturnal fixed price
  diurno_inicio: string; // "06:00"
  diurno_fim: string; // "20:00"
  noturno_inicio: string; // "18:00"
  noturno_fim: string; // "06:00"
  isDefault?: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'fixed' | 'percentage';
  value: number; // Fixed value in R$ or percentage (0-100)
  minutes?: number; // For fixed coupons, valid period
  isActive: boolean;
  expiresAt?: Date;
  usageCount: number;
  maxUsage?: number;
  specialPricingTableId?: string; // For coupons that grant special pricing table
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'administrator' | 'manager' | 'operator';
  name: string;
  isActive: boolean;
  createdAt: Date;
}

export interface PaymentMethod {
  id: string;
  name: string;
  isActive: boolean;
  requiresChange: boolean; // For cash payments
  settlementDays: number; // Days until payment is received (0 = instant)
}

export interface Receipt {
  id: string;
  vehicleId: string;
  type: 'entry' | 'exit';
  generatedAt: Date;
  content: string;
}

export interface FinancialReport {
  date: string;
  totalVehicles: number;
  totalRevenue: number;
  paymentMethods: Record<string, { count: number; total: number }>;
  couponsUsed: number;
  averageStay: number;
  grossIncome: number;
  netIncome: number;
}

export interface AppState {
  currentUser: User | null;
  vehicles: Vehicle[];
  pricingTables: PricingTable[];
  coupons: Coupon[];
  users: User[];
  paymentMethods: PaymentMethod[];
  specialClients: SpecialClient[];
  receipts: Receipt[];
  entryTemplate: string;
  exitTemplate: string;
}

export interface PricingCalculationResult {
  totalCost: number;
  breakdown: {
    method: string;
    periods: Array<{
      start: Date;
      end: Date;
      cost: number;
      description: string;
    }>;
  };
  couponApplied?: {
    originalCost: number;
    discount: number;
    finalCost: number;
  };
}