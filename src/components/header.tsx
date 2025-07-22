"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { FaSignOutAlt } from "react-icons/fa";
import { notify } from "@/lib/notifications";
import { AnimatePresence, motion } from "framer-motion";
import { MdOutlineLeaderboard, MdOutlineTopic } from "react-icons/md";
import { GiAchievement } from "react-icons/gi";
import { useOptimizedAuth, clearAuthCache } from "@/hooks/use-optimized-auth";
import { UsersIcon, SwordsIcon } from "lucide-react";

export default function Header() {
  const supabase = createClient();
  const { user } = useOptimizedAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isLoggedIn = !!user;

  // Close mobile menu on route change and handle body scroll
  useEffect(() => {
    // Close mobile menu when pressing escape key
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    // Prevent body scroll when mobile menu is open
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscapeKey);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isMobileMenuOpen]);

  const handleSignOut = async () => {
    setIsLoading(true);
    setIsMobileMenuOpen(false); // Close mobile menu on sign out
    try {
      console.log("Starting sign out process...");
      
      // Sign out with local scope to ensure it works for OAuth users
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      if (error) {
        console.error("Supabase signout error:", error);
        throw error;
      }
      
      // Clear the auth cache after successful signout
      clearAuthCache();
      
      console.log("Signout successful, showing notification...");
      notify.auth.signoutSuccess();
      
      // Force page refresh to ensure clean state
      window.location.href = "/";
      
    } catch (error) {
      console.error("Sign out error:", error);
      notify.error("Error signing out. Please try again.");
      setIsLoading(false); // Only reset loading on error since we redirect on success
    }
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="border-b border-border/40 bg-background relative z-50">
        <div className="flex h-14 sm:h-16 items-center px-2">
          <div className="mr-4 sm:mr-8 flex">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-extrabold text-xl sm:text-2xl text-primary tracking-tighter">QUIZZI</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 text-xs sm:text-sm uppercase font-semibold tracking-wide flex-1">
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

          {/* Mobile menu button */}
          <div className="md:hidden flex-1 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMobileMenuToggle}
              className="p-2 h-8 w-8"
              aria-label="Toggle mobile menu"
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.svg
                    key="close"
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 180 }}
                    exit={{ rotate: 0 }}
                    transition={{ duration: 0.2 }}
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-primary"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </motion.svg>
                ) : (
                  <motion.svg
                    key="menu"
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 0 }}
                    exit={{ rotate: 180 }}
                    transition={{ duration: 0.2 }}
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-primary"
                  >
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </motion.svg>
                )}
              </AnimatePresence>
            </Button>
          </div>

          {/* Desktop Auth Button */}
          <div className="hidden md:block">
            {isLoggedIn ? (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleSignOut} 
                className="text-xs sm:text-sm ml-2 sm:ml-4 cursor-pointer h-8 w-8 sm:h-auto sm:w-auto p-2 sm:px-3"
                disabled={isLoading}
              >
                <FaSignOutAlt className="sm:mr-0" />
              </Button>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary ml-2 sm:ml-4">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
              </svg>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={handleMobileMenuToggle}
            />
            
            {/* Mobile Menu */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-64 bg-background border-l border-border z-50 md:hidden safe-top safe-bottom"
            >
              <div className="flex flex-col h-full">
                {/* Menu Header */}
                <div className="p-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg text-primary tracking-tight px-4">Menu</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMobileMenuToggle}
                      className="p-2 h-8 w-8"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </Button>
                  </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 p-4">
                  <div className="space-y-2">
                    <Link 
                      href="/topics" 
                      className="flex items-center px-4 py-3 text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors font-medium"
                      onClick={handleMobileNavClick}
                    >
                      <MdOutlineTopic className="w-6 h-6 text-primary mr-3" />
                      Topics
                    </Link>
                    <Link 
                      href="/challenges" 
                      className="flex items-center px-4 py-3 text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors font-medium"
                      onClick={handleMobileNavClick}
                    >
                      <SwordsIcon className="w-6 h-6 text-primary mr-3" />
                      Challenges
                    </Link>
                    <Link 
                      href="/leaderboard" 
                      className="flex items-center px-4 py-3 text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors font-medium"
                      onClick={handleMobileNavClick}
                    >
                      <MdOutlineLeaderboard className="w-6 h-6 text-primary mr-3" />
                      Leaderboard
                    </Link>
                    <Link 
                      href="/friends" 
                      className="flex items-center px-4 py-3 text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors font-medium"
                      onClick={handleMobileNavClick}
                    >
                      <UsersIcon className="w-6 h-6 text-primary mr-3"/>
                      Friends
                    </Link>
                    <Link 
                      href="/achievements" 
                      className="flex items-center px-4 py-3 text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors font-medium"
                      onClick={handleMobileNavClick}
                    >
                      <GiAchievement className="w-6 h-6 text-primary mr-3"/>
                      Achievements
                    </Link>
                  </div>
                </nav>

                {/* Mobile Auth Section */}
                <div className="px-8 py-4 border-t border-border">
                  {isLoggedIn ? (
                    <Button 
                      variant="destructive" 
                      onClick={handleSignOut} 
                      className="w-full font-medium"
                      disabled={isLoading}
                    >
                      <FaSignOutAlt />
                      Sign Out
                    </Button>
                  ) : (
                    <div className="text-center text-sm text-muted-foreground">
                      Sign in to access all features
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}