import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    const { data, error } = await supabase.from('customers').select('id').limit(10000);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Total customers fetched with limit(10000):', data.length);
    }
}
run();
