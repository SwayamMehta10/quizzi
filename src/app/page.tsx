"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopicCard } from "@/components/topics/topic-card";
import Link from "next/link";
import { AuthForm } from "@/features/auth/auth-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";
import { LoginFormValues, SignupFormValues, ForgotPasswordValues } from "@/features/auth/schemas";
import { createClient } from "@/lib/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

const TOPICS_DATA = {
  popular: [
    { name: "History" },
    { name: "Science" },
    { name: "Movies" },
    { name: "Geography" }
  ],
  trending: [
    { name: "Music" },
    { name: "Sports" },
    { name: "Technology" },
    { name: "Gaming" }
  ],
  new: [
    { name: "Food & Drink" },
    { name: "Gaming" },
    { name: "Technology" },
    { name: "Geography" }
  ]
};

export default function Home() {
  const supabase = createClient();
  
  const [isSignUpOpen, setIsSignUpOpen] = useState<boolean>(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("Guest");
  const [avatar, setAvatar] = useState<string>("https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png");

  // Check if user is already logged in when the page loads
  useEffect(() => {
    setIsLoading(true);
    
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("Quack! Error checking auth user:", error);
          return;
        }
        
        if (user) {
          setIsLoggedIn(true);
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          // Check for profile error (but ignore "no rows returned" error)
          if (profileError && profileError.code !== 'PGRST116') {
            console.error("Error fetching profile:", profileError);
          }
          
          // If profile exists and has username, set user data
          if (profile && profile.username) {
            setUsername(profile.username);
            setAvatar(profile.avatar_url || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png");
          } else {
            // No profile or no username - redirect to complete profile
            window.location.href = "/complete-profile";
          }
        }
      } catch (err) {
        console.error("Quack! User check error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        console.log("Auth state change:", event, session?.user?.id);
        if (event === 'SIGNED_IN' && session) {
          setIsLoggedIn(true);
          checkUser();
        }
        if (event === 'SIGNED_OUT') {
          setIsLoggedIn(false);
          setUsername("Guest");
          setAvatar("https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png");
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Handler for login submission
  const handleLoginSubmit = async (values: LoginFormValues | SignupFormValues) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
      });
      
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          alert("Invalid email or password. Please try again.");
        } else if (error.message.includes("Email not confirmed")) {
          alert("Your email has not been verified! Check your inbox for the verification link.");
        } else {
          alert(`Login failed: ${error.message}`);
        }
        return;
      }
      
      if (data?.user) {
        setIsLoggedIn(true);
        alert("Logged in successfully!");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("An unexpected error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for signup submission
  const handleSignupSubmit = async (values: LoginFormValues | SignupFormValues) => {
    setIsLoading(true);
    try {
      // Cast values to SignupFormValues to access all fields
      const signupValues = values as SignupFormValues;
      
      const { data, error } = await supabase.auth.signUp({
        email: signupValues.email,
        password: signupValues.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        }
      });
      
      if (error) {
        alert(`Signup failed: ${error.message}`);
        return;
      }
      
      if (data?.user) {
        setIsSignUpOpen(false);
        
        if (data.user.identities?.length === 0) {
          alert("An account with this email already exists.");
          return;
        }
        
        // Show success message - user will complete profile after email confirmation
        alert("Please check your email to verify your account. After confirming, you'll be able to complete your profile setup.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert("An unexpected error occurred during signup.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for forgot password submission
  const handleForgotPasswordSubmit = async (values: ForgotPasswordValues) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(
        values.email, {
          redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        console.error('Error resetting password:', error);
        alert(`Password reset failed: ${error.message}`);
      } else {
        alert('Password reset email sent! Check your inbox.');
        setIsForgotPasswordOpen(false);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      alert('An unexpected error occurred during password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section with Log In Form*/}
      <section className="container py-12 md:py-8">
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tighter">
              CHALLENGE <br className="hidden sm:inline" />
              YOUR FRIENDS
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Test your knowledge in lightning-fast 1v1 trivia battles across hundreds of topics. Who will be the ultimate trivia champion?
            </p>
            <div className="flex flex-col w-full max-w-sm space-y-5">
              {!isLoggedIn ? (
                <div className="border rounded-lg p-5 bg-card shadow-sm">
                  <AuthForm 
                    formType="login" 
                    onSubmit={handleLoginSubmit} 
                    loading={isLoading} 
                    onForgotPassword={ () => setIsForgotPasswordOpen(true)} 
                  />
                  
                  <div className="mt-4 text-center">
                    <Button variant="link" className="text-sm text-primary cursor-pointer" onClick={() => setIsSignUpOpen(true)}>
                      Don&apos;t have an account? Sign up
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg bg-card pb-4 shadow-sm flex flex-col items-center">
                  <p className="text-lg font-medium p-4">Welcome back, {username}!</p>
                  <Avatar className="w-24 h-24 border-2 border-primary">
                    <AvatarImage src={avatar} alt="User Avatar" className="object-cover"/>
                  </Avatar>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-4 h-full">
            <div className="w-full flex-1 bg-primary/10 border-2 border-primary rounded-xl flex items-center justify-center shadow-inner">
              <span className="text-primary text-lg md:text-xl font-semibold opacity-80 p-6">
                Coming Soon
              </span>
            </div>
            <div className="w-full flex-1 bg-primary/10 border-2 border-primary rounded-xl flex items-center justify-center shadow-inner">
              <span className="text-primary text-lg md:text-xl font-semibold opacity-80 p-6">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Sign Up Dialog */}
      <Dialog open={isSignUpOpen} onOpenChange={setIsSignUpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Create an Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <AuthForm formType="signup" onSubmit={handleSignupSubmit} loading={isLoading} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <p className="text-sm text-muted-foreground text-center">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
            <ForgotPasswordForm onSubmit={handleForgotPasswordSubmit} loading={isLoading} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Featured Topics */}
      <section className="container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-extrabold tracking-tight">Featured Topics</h2>
          <Link href="/topics">
            <Button variant="link" className="text-sm text-muted-foreground cursor-pointer">See All</Button>
          </Link>
        </div>
        <Tabs defaultValue="popular" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-3 mb-6 bg-background border">
            <TabsTrigger value="popular" className="data-[state=active]:bg-primary data-[state=active]:text-white">Popular</TabsTrigger>
            <TabsTrigger value="trending" className="data-[state=active]:bg-primary data-[state=active]:text-white">Trending</TabsTrigger>
            <TabsTrigger value="new" className="data-[state=active]:bg-primary data-[state=active]:text-white">New</TabsTrigger>
          </TabsList>
          {Object.entries(TOPICS_DATA).map(([category, topics]) => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {topics.map((topic, i) => (
                  <TopicCard 
                    key={i} 
                    name={topic.name}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </section>
    </div>
  );
}
