"use client"

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Session } from "@supabase/supabase-js";
import Header from "@/components/header";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const supabase = createClient();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Check if user is already logged in when the component loads
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error checking auth session:", error);
          return;
        }
        
        if (session) {
          setIsLoggedIn(true);
        }
      } catch (err) {
        console.error("Session check error:", err);
      }
    };
    
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        if (event === 'SIGNED_IN' && session) {
          setIsLoggedIn(true);
        }
        if (event === 'SIGNED_OUT') {
          setIsLoggedIn(false);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Handler for sign out
  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      } else {
        setIsLoggedIn(false);
        window.location.href = "/";
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-screen-xl mx-auto min-h-screen flex flex-col">
      <Header 
        isLoggedIn={isLoggedIn} 
        isLoading={isLoading} 
        onSignOut={handleSignOut} 
      />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
