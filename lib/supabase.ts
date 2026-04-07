import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://scnrhnbfyevibzesvaca.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbnJobmJmeWV2aWJ6ZXN2YWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MDAzMDMsImV4cCI6MjA5MDQ3NjMwM30.fOYA27iIU5l4DLy9uFv70hJvq1ealGHnoyui9BfPQkg"

export const supabase = createClient(supabaseUrl, supabaseKey)