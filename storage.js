// Shared storage backed by Supabase, so anyone who opens this site with the
// password sees the same journal. Everything is kept in one table (kv_store)
// as a simple key/value pair, matching how the app already reads and writes.

import { supabase } from "./supabaseClient";

export async function storageGet(key) {
  const { data, error } = await supabase
    .from("kv_store")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("not found");
  return { key, value: data.value };
}

export async function storageSet(key, value) {
  const { error } = await supabase
    .from("kv_store")
    .upsert({ key, value, updated_at: new Date().toISOString() });

  if (error) {
    console.error("Storage failed:", error);
    return null;
  }
  return { key, value };
}
