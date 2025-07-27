/*
  # Create Parking System Database Schema

  1. New Tables
    - `pricing_tables` - Pricing configurations with time-based rates
    - `coupons` - Discount coupons with usage tracking  
    - `users` - System users with roles and permissions
    - `payment_methods` - Available payment options
    - `vehicles` - Vehicle entries/exits with pricing calculations
    - `vehicle_payments` - Multiple payment methods per vehicle (related to vehicles)
    - `receipts` - Generated receipt records
    - `templates` - Configurable receipt templates

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  3. Default Data
    - Insert default pricing table, payment methods, users, and templates
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create pricing_tables table
CREATE TABLE IF NOT EXISTS public.pricing_tables (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    fra15 NUMERIC(10, 2) NOT NULL,
    diaria NUMERIC(10, 2) NOT NULL,
    diurno NUMERIC(10, 2) NOT NULL,
    noturno NUMERIC(10, 2) NOT NULL,
    diurno_inicio TEXT NOT NULL,
    diurno_fim TEXT NOT NULL,
    noturno_inicio TEXT NOT NULL,
    noturno_fim TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.pricing_tables ENABLE ROW LEVEL SECURITY;

-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    value NUMERIC(10, 2) NOT NULL,
    minutes INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    max_usage INTEGER
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    requires_change BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Create vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate TEXT UNIQUE NOT NULL,
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    exit_time TIMESTAMP WITH TIME ZONE,
    pricing_table_id TEXT REFERENCES public.pricing_tables(id),
    coupon_id TEXT REFERENCES public.coupons(id),
    total_cost NUMERIC(10, 2),
    amount_received NUMERIC(10, 2),
    change NUMERIC(10, 2),
    is_paid BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Create vehicle_payments table (related to vehicles)
CREATE TABLE IF NOT EXISTS public.vehicle_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL
);

ALTER TABLE public.vehicle_payments ENABLE ROW LEVEL SECURITY;

-- Create receipts table
CREATE TABLE IF NOT EXISTS public.receipts (
    id TEXT PRIMARY KEY,
    vehicle_id UUID REFERENCES public.vehicles(id),
    type TEXT NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    content TEXT NOT NULL
);

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Create templates table
CREATE TABLE IF NOT EXISTS public.templates (
    type TEXT PRIMARY KEY,
    content TEXT NOT NULL
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all tables
CREATE POLICY "Allow all operations for authenticated users" ON public.pricing_tables FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.coupons FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.users FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.payment_methods FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.vehicles FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.vehicle_payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.receipts FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.templates FOR ALL TO authenticated USING (true);

-- Insert default data
INSERT INTO public.pricing_tables (id, name, fra15, diaria, diurno, noturno, diurno_inicio, diurno_fim, noturno_inicio, noturno_fim, is_default) VALUES
('default', 'Tabela Padrão', 5.00, 25.00, 3.00, 2.00, '06:00', '18:00', '18:01', '05:59', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.payment_methods (id, name, is_active, requires_change) VALUES
('cash', 'Dinheiro', true, true),
('card', 'Cartão', true, false),
('pix', 'PIX', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, username, password, role, name, is_active) VALUES
('admin', 'admin', 'admin123', 'admin', 'Administrador', true),
('manager', 'gerente', 'gerente123', 'manager', 'Gerente', true),
('operator', 'operador', 'operador123', 'operator', 'Operador', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.templates (type, content) VALUES
('entry', 'Recibo de Entrada\n\nPlaca: {PLATE}\nEntrada: {ENTRY_TIME}\nTabela: {PRICING_TABLE}\n\nData: {DATE} Hora: {TIME}'),
('exit', 'Recibo de Saída\n\nPlaca: {PLATE}\nEntrada: {ENTRY_TIME}\nSaída: {EXIT_TIME}\nDuração: {DURATION}\nTotal: {TOTAL}\nDesconto: {DISCOUNT}\nPagamento: {PAYMENT_METHOD}\nRecebido: {AMOUNT_RECEIVED}\nTroco: {CHANGE}\n\nData: {DATE} Hora: {TIME}')
ON CONFLICT (type) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON public.vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_entry_time ON public.vehicles(entry_time);
CREATE INDEX IF NOT EXISTS idx_vehicles_exit_time ON public.vehicles(exit_time);
CREATE INDEX IF NOT EXISTS idx_vehicle_payments_vehicle_id ON public.vehicle_payments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_receipts_vehicle_id ON public.receipts(vehicle_id);