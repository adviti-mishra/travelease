import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jxhpljnevoqzrecengbs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHBsam5ldm9xenJlY2VuZ2JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4MTI1MzIsImV4cCI6MjA1NzM4ODUzMn0.dzjGs68iQdfq05aoBRjjHaWp5HjZScsPkU1oSID6VR8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);