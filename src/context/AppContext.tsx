import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AppState, User, Vehicle, PricingTable, Coupon, PaymentMethod, PaymentEntry, SpecialClient } from '../types';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  addVehicle: (vehicle: Vehicle) => Promise<void>;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<void>;
  getActiveVehicleByPlate: (plate: string) => Vehicle | undefined;
  getActiveVehicles: () => Vehicle[];
  getPricingTable: (id: string) => PricingTable | undefined;
  getCouponByCode: (code: string) => Coupon | undefined;
  getSpecialClientById: (id: string) => SpecialClient | undefined;
  getSpecialClientByPlate: (plate: string) => SpecialClient | undefined;
  hasPermission: (permission: string) => boolean;
  loading: boolean;
}

type AppAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_VEHICLES'; payload: Vehicle[] }
  | { type: 'ADD_VEHICLE'; payload: Vehicle }
  | { type: 'UPDATE_VEHICLE'; payload: { id: string; updates: Partial<Vehicle> } }
  | { type: 'SET_PRICING_TABLES'; payload: PricingTable[] }
  | { type: 'ADD_PRICING_TABLE'; payload: PricingTable }
  | { type: 'UPDATE_PRICING_TABLE'; payload: { id: string; updates: Partial<PricingTable> } }
  | { type: 'SET_COUPONS'; payload: Coupon[] }
  | { type: 'ADD_COUPON'; payload: Coupon }
  | { type: 'UPDATE_COUPON'; payload: { id: string; updates: Partial<Coupon> } }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: { id: string; updates: Partial<User> } }
  | { type: 'SET_PAYMENT_METHODS'; payload: PaymentMethod[] }
  | { type: 'ADD_PAYMENT_METHOD'; payload: PaymentMethod }
  | { type: 'UPDATE_PAYMENT_METHOD'; payload: { id: string; updates: Partial<PaymentMethod> } }
  | { type: 'SET_SPECIAL_CLIENTS'; payload: SpecialClient[] }
  | { type: 'ADD_SPECIAL_CLIENT'; payload: SpecialClient }
  | { type: 'UPDATE_SPECIAL_CLIENT'; payload: { id: string; updates: Partial<SpecialClient> } }
  | { type: 'UPDATE_TEMPLATES'; payload: { entry?: string; exit?: string } }
  | { type: 'LOAD_ALL_DATA'; payload: Partial<AppState> };

const initialState: AppState = {
  currentUser: null,
  vehicles: [],
  pricingTables: [],
  coupons: [],
  users: [],
  paymentMethods: [],
  specialClients: [],
  receipts: [],
  entryTemplate: '',
  exitTemplate: ''
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state };
    case 'LOGIN':
      return { ...state, currentUser: action.payload };
    case 'LOGOUT':
      return { ...state, currentUser: null };
    case 'SET_VEHICLES':
      return { ...state, vehicles: action.payload };
    case 'ADD_VEHICLE':
      return { ...state, vehicles: [...state.vehicles, action.payload] };
    case 'UPDATE_VEHICLE':
      return {
        ...state,
        vehicles: state.vehicles.map(v => 
          v.id === action.payload.id 
            ? { ...v, ...action.payload.updates }
            : v
        )
      };
    case 'SET_PRICING_TABLES':
      return { ...state, pricingTables: action.payload };
    case 'ADD_PRICING_TABLE':
      return { ...state, pricingTables: [...state.pricingTables, action.payload] };
    case 'UPDATE_PRICING_TABLE':
      return {
        ...state,
        pricingTables: state.pricingTables.map(pt => 
          pt.id === action.payload.id 
            ? { ...pt, ...action.payload.updates }
            : pt
        )
      };
    case 'SET_COUPONS':
      return { ...state, coupons: action.payload };
    case 'ADD_COUPON':
      return { ...state, coupons: [...state.coupons, action.payload] };
    case 'UPDATE_COUPON':
      return {
        ...state,
        coupons: state.coupons.map(c => 
          c.id === action.payload.id 
            ? { ...c, ...action.payload.updates }
            : c
        )
      };
    case 'SET_USERS':
      return { ...state, users: action.payload };
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(u => 
          u.id === action.payload.id 
            ? { ...u, ...action.payload.updates }
            : u
        )
      };
    case 'SET_PAYMENT_METHODS':
      return { ...state, paymentMethods: action.payload };
    case 'ADD_PAYMENT_METHOD':
      return { ...state, paymentMethods: [...state.paymentMethods, action.payload] };
    case 'UPDATE_PAYMENT_METHOD':
      return {
        ...state,
        paymentMethods: state.paymentMethods.map(pm => 
          pm.id === action.payload.id 
            ? { ...pm, ...action.payload.updates }
            : pm
        )
      };
    case 'SET_SPECIAL_CLIENTS':
      return { ...state, specialClients: action.payload };
    case 'ADD_SPECIAL_CLIENT':
      return { ...state, specialClients: [...state.specialClients, action.payload] };
    case 'UPDATE_SPECIAL_CLIENT':
      return {
        ...state,
        specialClients: state.specialClients.map(sc => 
          sc.id === action.payload.id 
            ? { ...sc, ...action.payload.updates }
            : sc
        )
      };
    case 'UPDATE_TEMPLATES':
      return {
        ...state,
        entryTemplate: action.payload.entry || state.entryTemplate,
        exitTemplate: action.payload.exit || state.exitTemplate
      };
    case 'LOAD_ALL_DATA':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [loading, setLoading] = React.useState(true);

  // Load all data from Supabase on mount
  useEffect(() => {
    // Force clear local state first
    dispatch({ type: 'SET_VEHICLES', payload: [] });
    loadAllData();
  }, []);

  // Force reload data when needed
  const forceReloadData = async () => {
    await loadAllData();
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Clear local state first
      dispatch({ type: 'SET_VEHICLES', payload: [] });
      
      // Load all data in parallel
      const [
        vehiclesResult,
        pricingTablesResult,
        couponsResult,
        usersResult,
        paymentMethodsResult,
        specialClientsResult,
        templatesResult
      ] = await Promise.all([
        loadVehicles(),
        loadPricingTables(),
        loadCoupons(),
        loadUsers(),
        loadPaymentMethods(),
        loadSpecialClients(),
        loadTemplates()
      ]);

      dispatch({ type: 'SET_VEHICLES', payload: vehiclesResult });
      dispatch({ type: 'SET_PRICING_TABLES', payload: pricingTablesResult });
      dispatch({ type: 'SET_COUPONS', payload: couponsResult });
      dispatch({ type: 'SET_USERS', payload: usersResult });
      dispatch({ type: 'SET_PAYMENT_METHODS', payload: paymentMethodsResult });
      dispatch({ type: 'SET_SPECIAL_CLIENTS', payload: specialClientsResult });
      dispatch({ type: 'UPDATE_TEMPLATES', payload: templatesResult });
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async (): Promise<Vehicle[]> => {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        vehicle_payments (
          payment_method,
          amount
        )
      `)
      .order('entry_time', { ascending: false });

    if (error) {
      console.error('Error loading vehicles:', error);
      return [];
    }

    return (data || []).map(vehicle => ({
      id: vehicle.id,
      ...vehicle,
      entryTime: new Date(vehicle.entry_time),
      exitTime: vehicle.exit_time ? new Date(vehicle.exit_time) : undefined,
      pricingTableId: vehicle.pricing_table_id,
      couponId: vehicle.coupon_id,
      specialClientId: vehicle.special_client_id,
      totalCost: vehicle.total_cost,
      paymentMethods: vehicle.vehicle_payments || [],
      amountReceived: vehicle.amount_received,
      change: vehicle.change,
      isPaid: vehicle.is_paid
    }));
  };

  const loadPricingTables = async (): Promise<PricingTable[]> => {
    const { data, error } = await supabase
      .from('pricing_tables')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading pricing tables:', error);
      return [];
    }

    return (data || []).map(table => ({
      ...table,
      isDefault: table.is_default
    }));
  };

  const loadCoupons = async (): Promise<Coupon[]> => {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('code');

    if (error) {
      console.error('Error loading coupons:', error);
      return [];
    }

    return (data || []).map(coupon => ({
      ...coupon,
      isActive: coupon.is_active,
      expiresAt: coupon.expires_at ? new Date(coupon.expires_at) : undefined,
      usageCount: coupon.usage_count,
      maxUsage: coupon.max_usage,
      specialPricingTableId: coupon.special_pricing_table_id
    }));
  };

  const loadUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading users:', error);
      return [];
    }

    return (data || []).map(user => ({
      ...user,
      isActive: user.is_active,
      createdAt: new Date(user.created_at)
    }));
  };

  const loadPaymentMethods = async (): Promise<PaymentMethod[]> => {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading payment methods:', error);
      // Return default payment methods if database is empty
      return [
        {
          id: 'cash',
          name: 'Dinheiro',
          isActive: true,
          requiresChange: true,
          settlementDays: 0
        },
        {
          id: 'card',
          name: 'Cartão',
          isActive: true,
          requiresChange: false,
          settlementDays: 0
        }
      ];
    }

    const methods = (data || []).map(method => ({
      ...method,
      isActive: method.is_active,
      requiresChange: method.requires_change,
      settlementDays: method.settlement_days || 0
    }));

    // If no payment methods in database, return defaults
    if (methods.length === 0) {
      return [
        {
          id: 'cash',
          name: 'Dinheiro',
          isActive: true,
          requiresChange: true,
          settlementDays: 0
        },
        {
          id: 'card',
          name: 'Cartão',
          isActive: true,
          requiresChange: false,
          settlementDays: 0
        }
      ];
    }

    return methods;
  };

  const loadSpecialClients = async (): Promise<SpecialClient[]> => {
    const { data, error } = await supabase
      .from('special_clients')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading special clients:', error);
      return [];
    }

    console.log('Raw special clients data from database:', data);

    return (data || []).map(client => ({
      ...client,
      plates: client.plates || [],
      pricingTableId: client.pricing_table_id,
      isActive: client.is_active,
      createdAt: new Date(client.created_at)
    }));
  };

  const loadTemplates = async (): Promise<{ entry?: string; exit?: string }> => {
    const { data, error } = await supabase
      .from('templates')
      .select('*');

    if (error) {
      console.error('Error loading templates:', error);
      return {};
    }

    const entryTemplate = data?.find(t => t.type === 'entry')?.content || '';
    const exitTemplate = data?.find(t => t.type === 'exit')?.content || '';

    return { entry: entryTemplate, exit: exitTemplate };
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login for username:', username);
      
      // Simple direct authentication with users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .eq('is_active', true)
        .maybeSingle();

      console.log('Custom auth result:', { userData, userError });

      if (userError || !userData) {
        console.error('Login failed - user not found or incorrect credentials');
        return false;
      }

      console.log('Login successful for user:', userData.username);

      // Create user session record
      try {
        await supabase
          .from('user_sessions')
          .insert({
            user_id: userData.id,
            login_time: new Date().toISOString(),
            ip_address: 'localhost', // In production, get real IP
            user_agent: navigator.userAgent
          });
      } catch (sessionError) {
        console.error('Error creating user session:', sessionError);
        // Don't fail login if session creation fails
      }
      const user: User = {
        id: userData.id,
        username: userData.username,
        password: '',
        role: userData.role,
        name: userData.name,
        isActive: userData.is_active,
        createdAt: new Date(userData.created_at)
      };

      dispatch({ type: 'LOGIN', payload: user });
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    // Update user session with logout time
    if (state.currentUser) {
      supabase
        .from('user_sessions')
        .update({ logout_time: new Date().toISOString() })
        .eq('user_id', state.currentUser.id)
        .is('logout_time', null)
        .then(() => console.log('Session updated with logout time'))
        .catch(error => console.error('Error updating session:', error));
    }
    
    // Sign out from Supabase Auth
    supabase.auth.signOut();
    dispatch({ type: 'LOGOUT' });
  };

  const addVehicle = async (vehicle: Vehicle): Promise<void> => {
    try {
      console.log('Adding vehicle to database:', vehicle);
      
      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          plate: vehicle.plate,
          entry_time: vehicle.entryTime.toISOString(),
          pricing_table_id: vehicle.pricingTableId,
          coupon_id: vehicle.couponId,
          special_client_id: vehicle.specialClientId,
          total_cost: vehicle.totalCost,
          amount_received: vehicle.amountReceived,
          change: vehicle.change,
          is_paid: vehicle.isPaid || false,
          exit_time: vehicle.exitTime?.toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('Vehicle added to database successfully:', data);

      // Add payment methods if any
      if (vehicle.paymentMethods && vehicle.paymentMethods.length > 0) {
        const paymentInserts = vehicle.paymentMethods.map(pm => ({
          vehicle_id: data.id,
          payment_method: pm.method,
          amount: pm.amount
        }));

        await supabase
          .from('vehicle_payments')
          .insert(paymentInserts);
      }

      // Create vehicle object with database-generated ID
      const vehicleWithId: Vehicle = {
        ...vehicle,
        id: data.id
      };

      dispatch({ type: 'ADD_VEHICLE', payload: vehicleWithId });
    } catch (error) {
      console.error('Error adding vehicle:', error);
      
      // If it's a unique constraint violation, provide more specific error
      if (error.code === '23505' && error.message.includes('vehicles_plate_key')) {
        throw new Error('Veículo já está estacionado. Use a opção de saída primeiro.');
      }
      
      throw error;
    }
  };

  const updateVehicle = async (id: string, updates: Partial<Vehicle>): Promise<void> => {
    try {

      // Update vehicle data
      const updateData: any = {};
      if (updates.exitTime) updateData.exit_time = updates.exitTime.toISOString();
      if (updates.totalCost !== undefined) updateData.total_cost = updates.totalCost;
      if (updates.amountReceived !== undefined) updateData.amount_received = updates.amountReceived;
      if (updates.change !== undefined) updateData.change = updates.change;
      if (updates.isPaid !== undefined) updateData.is_paid = updates.isPaid;
      if (updates.couponId !== undefined) updateData.coupon_id = updates.couponId;
      if (updates.specialClientId !== undefined) updateData.special_client_id = updates.specialClientId;

      const { error: updateError } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      // Update payment methods if provided
      if (updates.paymentMethods) {
        // Delete existing payments
        await supabase
          .from('vehicle_payments')
          .delete()
          .eq('vehicle_id', id);

        // Insert new payments
        if (updates.paymentMethods.length > 0) {
          const paymentInserts = updates.paymentMethods.map(pm => ({
            vehicle_id: id,
            payment_method: pm.method,
            amount: pm.amount
          }));

          await supabase
            .from('vehicle_payments')
            .insert(paymentInserts);
        }
      }

      dispatch({ type: 'UPDATE_VEHICLE', payload: { id, updates } });
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  };

  const addPricingTable = async (table: PricingTable): Promise<void> => {
    try {
      const { error } = await supabase
        .from('pricing_tables')
        .insert({
          id: table.id,
          name: table.name,
          fra15: table.fra15,
          diaria: table.diaria,
          diurno: table.diurno,
          noturno: table.noturno,
          diurno_inicio: table.diurno_inicio,
          diurno_fim: table.diurno_fim,
          noturno_inicio: table.noturno_inicio,
          noturno_fim: table.noturno_fim,
          is_default: table.isDefault || false
        });

      if (error) throw error;

      dispatch({ type: 'ADD_PRICING_TABLE', payload: table });
    } catch (error) {
      console.error('Error adding pricing table:', error);
      throw error;
    }
  };

  const updatePricingTable = async (id: string, updates: Partial<PricingTable>): Promise<void> => {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.fra15 !== undefined) updateData.fra15 = updates.fra15;
      if (updates.diaria !== undefined) updateData.diaria = updates.diaria;
      if (updates.diurno !== undefined) updateData.diurno = updates.diurno;
      if (updates.noturno !== undefined) updateData.noturno = updates.noturno;
      if (updates.diurno_inicio !== undefined) updateData.diurno_inicio = updates.diurno_inicio;
      if (updates.diurno_fim !== undefined) updateData.diurno_fim = updates.diurno_fim;
      if (updates.noturno_inicio !== undefined) updateData.noturno_inicio = updates.noturno_inicio;
      if (updates.noturno_fim !== undefined) updateData.noturno_fim = updates.noturno_fim;
      if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault;

      const { error } = await supabase
        .from('pricing_tables')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'UPDATE_PRICING_TABLE', payload: { id, updates } });
    } catch (error) {
      console.error('Error updating pricing table:', error);
      throw error;
    }
  };

  const addCoupon = async (coupon: Coupon): Promise<void> => {
    try {
      const { error } = await supabase
        .from('coupons')
        .insert({
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          minutes: coupon.minutes,
          is_active: coupon.isActive,
          expires_at: coupon.expiresAt?.toISOString(),
          usage_count: coupon.usageCount,
          max_usage: coupon.maxUsage
        });

      if (error) throw error;

      dispatch({ type: 'ADD_COUPON', payload: coupon });
    } catch (error) {
      console.error('Error adding coupon:', error);
      throw error;
    }
  };

  const updateCoupon = async (id: string, updates: Partial<Coupon>): Promise<void> => {
    try {
      const updateData: any = {};
      if (updates.code !== undefined) updateData.code = updates.code;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.value !== undefined) updateData.value = updates.value;
      if (updates.minutes !== undefined) updateData.minutes = updates.minutes;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.expiresAt !== undefined) updateData.expires_at = updates.expiresAt?.toISOString();
      if (updates.usageCount !== undefined) updateData.usage_count = updates.usageCount;
      if (updates.maxUsage !== undefined) updateData.max_usage = updates.maxUsage;
      if (updates.specialPricingTableId !== undefined) updateData.special_pricing_table_id = updates.specialPricingTableId;

      const { error } = await supabase
        .from('coupons')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'UPDATE_COUPON', payload: { id, updates } });
    } catch (error) {
      console.error('Error updating coupon:', error);
      throw error;
    }
  };

  const addPaymentMethod = async (method: PaymentMethod): Promise<void> => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .insert({
          id: method.id,
          name: method.name,
          is_active: method.isActive,
          requires_change: method.requiresChange,
          settlement_days: method.settlementDays
        });

      if (error) throw error;

      dispatch({ type: 'ADD_PAYMENT_METHOD', payload: method });
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw error;
    }
  };

  const updatePaymentMethod = async (id: string, updates: Partial<PaymentMethod>): Promise<void> => {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.requiresChange !== undefined) updateData.requires_change = updates.requiresChange;
      if (updates.settlementDays !== undefined) updateData.settlement_days = updates.settlementDays;

      const { error } = await supabase
        .from('payment_methods')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'UPDATE_PAYMENT_METHOD', payload: { id, updates } });
    } catch (error) {
      console.error('Error updating payment method:', error);
      throw error;
    }
  };

  const addSpecialClient = async (client: SpecialClient): Promise<void> => {
    try {
      const { error } = await supabase
        .from('special_clients')
        .insert({
          id: client.id,
          name: client.name,
          document: client.document,
          phone: client.phone,
          email: client.email,
          plates: client.plates,
          pricing_table_id: client.pricingTableId || null,
          is_active: client.isActive,
          created_at: client.createdAt.toISOString()
        });

      if (error) throw error;

      dispatch({ type: 'ADD_SPECIAL_CLIENT', payload: client });
    } catch (error) {
      console.error('Error adding special client:', error);
      throw error;
    }
  };

  const updateSpecialClient = async (id: string, updates: Partial<SpecialClient>): Promise<void> => {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.document !== undefined) updateData.document = updates.document;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.plates !== undefined) updateData.plates = updates.plates;
      if (updates.pricingTableId !== undefined) updateData.pricing_table_id = updates.pricingTableId || null;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { error } = await supabase
        .from('special_clients')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'UPDATE_SPECIAL_CLIENT', payload: { id, updates } });
    } catch (error) {
      console.error('Error updating special client:', error);
      throw error;
    }
  };

  const addUser = async (user: User): Promise<void> => {
    try {
      const { error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          username: user.username,
          password: user.password,
          role: user.role,
          name: user.name,
          is_active: user.isActive,
          created_at: user.createdAt.toISOString()
        });

      if (error) throw error;

      dispatch({ type: 'ADD_USER', payload: user });
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, updates: Partial<User>): Promise<void> => {
    try {
      const updateData: any = {};
      if (updates.username !== undefined) updateData.username = updates.username;
      if (updates.password !== undefined && updates.password !== '') updateData.password = updates.password;
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'UPDATE_USER', payload: { id, updates } });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const updateTemplates = async (entry?: string, exit?: string): Promise<void> => {
    try {
      if (entry !== undefined) {
        const { error: entryError } = await supabase
          .from('templates')
          .upsert({
            type: 'entry',
            content: entry
          });

        if (entryError) throw entryError;
      }

      if (exit !== undefined) {
        const { error: exitError } = await supabase
          .from('templates')
          .upsert({
            type: 'exit',
            content: exit
          });

        if (exitError) throw exitError;
      }

      dispatch({ type: 'UPDATE_TEMPLATES', payload: { entry, exit } });
    } catch (error) {
      console.error('Error updating templates:', error);
      throw error;
    }
  };
  const getActiveVehicleByPlate = (plate: string): Vehicle | undefined => {
    return state.vehicles.find(v => v.plate === plate && !v.exitTime);
  };

  const getActiveVehicles = (): Vehicle[] => {
    return state.vehicles.filter(v => !v.exitTime);
  };

  const getPricingTable = (id: string): PricingTable | undefined => {
    return state.pricingTables.find(pt => pt.id === id);
  };

  const getCouponByCode = (code: string): Coupon | undefined => {
    return state.coupons.find(c => c.code === code && c.isActive);
  };

  const getSpecialClientById = (id: string): SpecialClient | undefined => {
    return state.specialClients.find(c => c.id === id && c.isActive);
  };

  const getSpecialClientByPlate = (plate: string): SpecialClient | undefined => {
    console.log('getSpecialClientByPlate called with:', plate);
    console.log('Available special clients:', state.specialClients);
    
    const result = state.specialClients.find(c => {
      const isActive = c.isActive;
      const hasPlates = c.plates && Array.isArray(c.plates);
      const includesPlate = hasPlates && c.plates.includes(plate);
      
      console.log(`Client ${c.name}:`, {
        isActive,
        hasPlates,
        plates: c.plates,
        includesPlate
      });
      
      return isActive && hasPlates && includesPlate;
    });
    
    console.log('getSpecialClientByPlate result:', result);
    return state.specialClients.find(c => 
      c.isActive && 
      c.plates && 
      c.plates.includes(plate)
    );
  };
  const hasPermission = (permission: string): boolean => {
    if (!state.currentUser) return false;
    
    const permissions = {
      administrator: ['all', 'view'],
      manager: ['reports', 'coupons', 'employees', 'view'],
      operator: ['vehicles', 'view']
    };
    
    const userPermissions = permissions[state.currentUser.role] || [];
    return userPermissions.includes('all') || userPermissions.includes(permission);
  };

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      login,
      logout,
      addVehicle,
      updateVehicle,
      addPricingTable,
      updatePricingTable,
      addCoupon,
      updateCoupon,
      addPaymentMethod,
      updatePaymentMethod,
      addSpecialClient,
      updateSpecialClient,
      addUser,
      updateUser,
      updateTemplates,
      getActiveVehicleByPlate,
      getActiveVehicles,
      getPricingTable,
      getCouponByCode,
      getSpecialClientById,
      getSpecialClientByPlate,
      hasPermission,
      loading
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}