import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Client sem tipos para queries com joins complexos
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as ReturnType<typeof createClient<any>>;
