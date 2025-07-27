import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearData() {
  try {
    console.log('Clearing vehicle payments...');
    const { error: paymentsError } = await supabase
      .from('vehicle_payments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (paymentsError) {
      console.error('Error clearing payments:', paymentsError);
    } else {
      console.log('Vehicle payments cleared');
    }

    console.log('Clearing receipts...');
    const { error: receiptsError } = await supabase
      .from('receipts')
      .delete()
      .neq('id', 'dummy'); // Delete all

    if (receiptsError) {
      console.error('Error clearing receipts:', receiptsError);
    } else {
      console.log('Receipts cleared');
    }

    console.log('Clearing vehicles...');
    const { error: vehiclesError } = await supabase
      .from('vehicles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (vehiclesError) {
      console.error('Error clearing vehicles:', vehiclesError);
    } else {
      console.log('Vehicles cleared');
    }

    console.log('All data cleared successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

clearData();