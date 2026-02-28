import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkColumns() {
    const { data, error } = await supabase.from('customers').select('*').limit(1);
    if (error) {
        console.error('Error fetching customers:', error);
    } else if (data.length > 0) {
        console.log('Columns in customers table:', Object.keys(data[0]));
    } else {
        console.log('No data in customers table. Cannot infer columns.');
    }
}

checkColumns();
