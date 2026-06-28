import { createClient } from "@supabase/supabase-js";
import { useState } from "react";

export function useSupabase() {
  const [supabase] = useState(() =>
    createClient(
      "https://jyyyzkwufgvxlthfwaej.supabase.co",
      "sb_publishable_YquTuzriaXCcFx6pTrhSsg_nuOF9GKo",
    ),
  );
  return supabase;
}
