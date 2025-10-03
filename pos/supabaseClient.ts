import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wpnyxnwjrcqzhuuhoghw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwbnl4bndqcmNxemh1dWhvZ2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NTg3NzQsImV4cCI6MjA3NTAzNDc3NH0.4rQaPA9fBdOhVomW3l4dskor15UPPJWWuV1ffXwPzmc';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key must be provided.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
