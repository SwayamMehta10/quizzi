"use client"

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthForm } from "@/features/auth/auth-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";
import { LoginFormValues, SignupFormValues, ForgotPasswordValues } from "@/features/auth/schemas";
import { createClient } from "@/utils/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { notify } from "@/lib/notifications";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    const error_code = searchParams.get("error_code");
    if (
      error === "access_denied" &&
      error_code === "otp_expired"
    ) {
      router.replace("/auth/auth-code-error");
    }
  }, [searchParams, router]);

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
        
        if (error || !user) {
          console.error("Quack! Error checking auth user:", error);
          return;
        }
        
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
        if (event == "PASSWORD_RECOVERY") {
          router.push("/reset-password");
        } else if (event === 'SIGNED_IN' && session) {
          setIsLoggedIn(true);
          checkUser();
        } else if (event === 'SIGNED_OUT') {
          setIsLoggedIn(false);
          setUsername("Guest");
          setAvatar("https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png");
        }
        
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

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
          notify.error("Invalid email or password. Please try again.");
        } else if (error.message.includes("Email not confirmed")) {
          notify.info("Your email has not been verified! Check your inbox for the verification link.");
        } else {
          notify.auth.loginFailed(error.message);
        }
        return;
      }
      
      if (data?.user) {
        setIsLoggedIn(true);
        notify.auth.loginSuccess();
      }
    } catch (error) {
      console.error("Login error:", error);
      notify.error("An unexpected error occurred during login.");
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
        password: signupValues.password
      });
      
      if (error) {
        notify.auth.signupFailed(error.message);
        return;
      }
      
      if (data?.user) {
        setIsSignUpOpen(false);
        
        if (data.user.identities?.length === 0) {
          notify.info("An account with this email already exists.");
          return;
        }
        
        // Show success message - user will complete profile after email confirmation
        notify.auth.signupSuccess();
      }
    } catch (error) {
      console.error("Signup error:", error);
      notify.error("An unexpected error occurred during signup.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for forgot password submission
  const handleForgotPasswordSubmit = async (values: ForgotPasswordValues) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.resetPasswordForEmail(values.email);
      
      if (error || !data) {
        console.error('Error resetting password:', error);
        notify.error('An error occurred while resetting your password.');
      } else {
        notify.auth.passwordResetSent();
        setIsForgotPasswordOpen(false);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      notify.error('An unexpected error occurred during password reset.');
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
    </div>
  );
}
