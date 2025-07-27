/*
  # Add plate support to special clients

  1. Changes
    - Add plates column to special_clients table to store multiple plates per client
    - Add index for faster plate lookups
    - Update RLS policies

  2. Security
    - Maintain existing RLS policies
    - Add index for performance
*/

-- Add plates column to store array of plates
ALTER TABLE special_clients 
ADD COLUMN IF NOT EXISTS plates text[] DEFAULT '{}';

-- Add index for faster plate searches
CREATE INDEX IF NOT EXISTS idx_special_clients_plates 
ON special_clients USING GIN (plates);

-- Add comment
COMMENT ON COLUMN special_clients.plates IS 'Array of vehicle plates associated with this special client';