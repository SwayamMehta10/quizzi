"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import AuthTestClient from "@/components/auth-test-client";
import type { User } from "@supabase/supabase-js";

export default function TestAuthPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();
  }, [supabase]);

  const isLoggedIn = !!user;
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      
      <div className="grid gap-4">
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Client Component Auth State</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              <p>Client-side auth check: {isLoggedIn ? "✅ Logged in" : "❌ Not logged in"}</p>
              <p className="text-sm text-muted-foreground">This page was client-side rendered!</p>
            </>
          )}
        </div>
        
        <AuthTestClient />
      </div>
    </div>
  );
}
