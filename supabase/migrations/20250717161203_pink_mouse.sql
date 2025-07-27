/*
  # Reset all vehicle data

  1. Clear Data
    - Delete all vehicle payments
    - Delete all vehicles
    - Reset system for fresh start

  2. Security
    - Maintains table structure
    - Preserves RLS policies
    - Only clears data records
*/

-- Delete all vehicle payments first (foreign key dependency)
DELETE FROM vehicle_payments;

-- Delete all vehicle records
DELETE FROM vehicles;

-- Reset any sequences if needed (PostgreSQL auto-generates new IDs)
-- No need to reset sequences as we use UUIDs