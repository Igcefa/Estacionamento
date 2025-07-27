-- Clear all vehicle-related data
DELETE FROM vehicle_payments;
DELETE FROM receipts;
DELETE FROM vehicles;

-- Reset sequences if needed
-- This will ensure clean start for auto-generated IDs