
import { useEffect, useState } from "react";
import { useSupabase } from "./useSuparbase";

type AuthClaims = {
  sub?: string;
  iss?: string;
  aud?: string | string[];
  [key: string]: unknown;
};

export function useUser() {
  const [claims, setClaims] = useState<AuthClaims | null>(null);
  const supabase = useSupabase();

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getClaims().then(({ data }) => {
      if (isMounted) {
        setClaims(data?.claims ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      supabase.auth.getClaims().then(({ data }) => {
        if (isMounted) {
          setClaims(data?.claims ?? null);
        }
      });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return claims;
}
