/*
  # Remove unique constraint on vehicle plates

  1. Changes
    - Remove unique constraint on vehicles.plate column
    - This allows multiple entries for the same plate (for re-entries)
    - Each entry/exit cycle will be a separate record

  2. Security
    - Maintains all existing RLS policies
    - No changes to permissions or access control
*/

-- Remove the unique constraint on plate
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_plate_key;

-- Remove the unique index on plate  
DROP INDEX IF EXISTS vehicles_plate_key;