"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";

export default function AuthTestClient() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Client Component Auth State</h2>
      <p>Status: {user ? "✅ Logged in" : "❌ Not logged in"}</p>
      <p>Loading: {loading ? "⏳ Loading..." : "✅ Ready"}</p>
      {user && (
        <Button 
          onClick={handleSignOut} 
          variant="destructive" 
          size="sm" 
          className="mt-2"
          disabled={loading}
        >
          Sign Out
        </Button>
      )}
    </div>
  );
}
