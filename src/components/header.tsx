"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { FaSignOutAlt } from "react-icons/fa";
import { notify } from "@/lib/notifications";
import { useRouter } from "next/navigation";

export default function Header() {
  const supabase = createClient();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        setIsLoggedIn(false);
      } else {
        setIsLoggedIn(true);
      }

      setIsLoading(false);
    }

    checkAuthStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setIsLoggedIn(true);
        } else if (event === 'SIGNED_OUT') {
          setIsLoggedIn(false);
        }
      }
    );

    return () => subscription.unsubscribe();
    
  }, [supabase]);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setIsLoggedIn(false);
      notify.auth.signoutSuccess();
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
      notify.error("Error signing out. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <header className="border-b border-border/40 bg-background">
      <div className="flex h-16 items-center">
        <div className="mr-8 flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-extrabold text-2xl text-primary tracking-tighter">QUIZZI</span>
          </Link>
        </div>
        <nav className="flex items-center space-x-8 text-sm uppercase font-bold flex-1">
          <Link href="/topics" className="transition-colors hover:text-primary">
            Topics
          </Link>
          <Link href="/challenges" className="transition-colors hover:text-primary">
            Challenges
          </Link>
          <Link href="/leaderboard" className="transition-colors hover:text-primary">
            Leaderboard
          </Link>
          <Link href="/friends" className="transition-colors hover:text-primary">
            Friends
          </Link>
          <Link href="/achievements" className="transition-colors hover:text-primary">
            Achievements
          </Link>
        </nav>

        {isLoggedIn ? (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleSignOut} 
            className="text-sm ml-4 cursor-pointer"
            disabled={isLoading}
          >
            <FaSignOutAlt />
          </Button>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
          </svg>
        )}
      </div>
    </header>
  );
}