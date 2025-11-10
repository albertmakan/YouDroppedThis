import { createClient, SupabaseClient } from "supabase";

let supabaseClient: SupabaseClient;

export function initSupabase() {
  console.log("Init supabase...");
  supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_KEY") || ""
  );
  console.log("Supabase client is created");
}

export function getSupabase() {
  return supabaseClient;
}
