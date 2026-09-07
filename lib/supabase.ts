import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mjyhlzajiijtyswaxyaz.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qeWhsemFqaWlqdHlzd2F4eWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MTAwMzgsImV4cCI6MjEwNDM4NjAzOH0.fBaP2KoUTPcT40ZK3zTxVatJ0S8B5IWP-UeEc_nzFQU';

export const supabase = createClient(supabaseUrl, supabaseKey);
