"use client"

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthForm } from "@/features/auth/auth-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";
import { LoginFormValues, SignupFormValues, ForgotPasswordValues } from "@/features/auth/schemas";
import { createClient } from "@/utils/supabase/client";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { notify } from "@/lib/notifications";
import { Session } from "@supabase/supabase-js";
import { UserProfile } from "@/types/friends";
import Loader from "@/components/loader";
import { useOptimizedAuth } from "@/hooks/use-optimized-auth";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Timer,
  Crown
} from "lucide-react";
import { 
  FaGamepad, 
  FaRocket, 
  FaLightbulb, 
  FaMedal, 
  FaAtom, 
  FaChess, 
  FaGlobeAmericas, 
  FaMusic, 
  FaFilm, 
  FaFootballBall, 
  FaBook, 
  FaMicroscope 
} from "react-icons/fa";
import { IconType } from "react-icons";
import { PlayIcon, UsersIcon, GamepadIcon, SwordsIcon } from "lucide-react";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Floating icons data
  const floatingIcons = [
    { Icon: FaGamepad, color: "text-blue-400", delay: 0 },
    { Icon: FaRocket, color: "text-purple-400", delay: 0.5 },
    { Icon: FaLightbulb, color: "text-yellow-400", delay: 1 },
    { Icon: FaMedal, color: "text-orange-400", delay: 1.5 },
    { Icon: FaAtom, color: "text-green-400", delay: 2 },
    { Icon: FaChess, color: "text-red-400", delay: 2.5 },
    { Icon: FaGlobeAmericas, color: "text-cyan-400", delay: 3 },
    { Icon: FaMusic, color: "text-pink-400", delay: 3.5 },
    { Icon: FaFilm, color: "text-indigo-400", delay: 4 },
    { Icon: FaFootballBall, color: "text-emerald-400", delay: 4.5 },
    { Icon: FaBook, color: "text-violet-400", delay: 5 },
    { Icon: FaMicroscope, color: "text-teal-400", delay: 5.5 },
  ];

  // Floating icon component
  const FloatingIcon = ({ Icon, color, delay }: { Icon: IconType, color: string, delay: number }) => {
    const [dimensions, setDimensions] = useState({ width: 1200, height: 800 }); // Default fallback values
    const [positions, setPositions] = useState<{
      startPos: { x: number, y: number },
      endPos: { x: number, y: number }
    } | null>(null);

    useEffect(() => {
      // Set dimensions after component mounts
      const updateDimensions = () => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight
        });
      };

      updateDimensions();
      window.addEventListener('resize', updateDimensions);

      return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    useEffect(() => {
      if (dimensions.width && dimensions.height) {
        // Random starting positions from all sides
        const startPositions = [
          { x: -100, y: Math.random() * dimensions.height }, // Left side
          { x: dimensions.width + 100, y: Math.random() * dimensions.height }, // Right side
          { x: Math.random() * dimensions.width, y: -100 }, // Top
          { x: Math.random() * dimensions.width, y: dimensions.height + 100 }, // Bottom
        ];
        
        const startPos = startPositions[Math.floor(Math.random() * startPositions.length)];
        
        // Random end positions
        const endPositions = [
          { x: -200, y: Math.random() * dimensions.height },
          { x: dimensions.width + 200, y: Math.random() * dimensions.height },
          { x: Math.random() * dimensions.width, y: -200 },
          { x: Math.random() * dimensions.width, y: dimensions.height + 200 },
        ];
        
        const endPos = endPositions[Math.floor(Math.random() * endPositions.length)];
        
        setPositions({ startPos, endPos });
      }
    }, [dimensions]);

    // Don't render until positions are calculated
    if (!positions) {
      return null;
    }

    const { startPos, endPos } = positions;
    
    return (
      <motion.div
        initial={{ 
          opacity: 0,
          x: startPos.x,
          y: startPos.y,
          rotate: Math.random() * 360,
          scale: 0.3
        }}
        animate={{ 
          opacity: [0, 0.6, 0.8, 0.6, 0],
          x: [
            startPos.x,
            startPos.x + (Math.random() - 0.5) * 300,
            startPos.x + (Math.random() - 0.5) * 500,
            endPos.x + (Math.random() - 0.5) * 200,
            endPos.x
          ],
          y: [
            startPos.y,
            startPos.y + (Math.random() - 0.5) * 300,
            startPos.y + (Math.random() - 0.5) * 500,
            endPos.y + (Math.random() - 0.5) * 200,
            endPos.y
          ],
          rotate: [
            Math.random() * 360,
            Math.random() * 720,
            Math.random() * 1080,
            Math.random() * 1440,
            Math.random() * 1800
          ],
          scale: [0.3, 0.8, 1.2, 0.9, 0.2]
        }}
        transition={{
          duration: 12 + Math.random() * 8, // Random duration between 12-20 seconds
          delay: delay,
          repeat: Infinity,
          repeatDelay: Math.random() * 5, // Random delay between repeats
          ease: "easeInOut"
        }}
        className={`fixed text-4xl ${color} opacity-15 pointer-events-none z-0`}
      >
        <Icon />
      </motion.div>
    );
  };

  useEffect(() => {
    const error = searchParams.get("error");
    const error_code = searchParams.get("error_code");
    
    if (error === "access_denied" && error_code === "otp_expired") {
      router.replace("/auth/auth-code-error");
    } else if (error === "server_error" && error_code === "unexpected_failure") {
      // Handle OAuth errors
      notify.error("Authentication failed. Please try again.");
      // Clean up URL
      router.replace("/");
    }
  }, [searchParams, router]);

  const supabase = createClient();
  
  const [isSignUpOpen, setIsSignUpOpen] = useState<boolean>(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useOptimizedAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Load profile when user changes (using optimized auth)
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setProfile(null);
        return;
      }
      
      try {
        // First attempt to get profile
        let { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        // If profile doesn't exist, wait a bit and try again (for OAuth users)
        if (profileError && profileError.code === 'PGRST116') {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const retry = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          profileData = retry.data;
          profileError = retry.error;
        }
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching profile:", profileError);
          return;
        }
        
        setProfile(profileData);
        
        if (!profileData || !profileData.username) {
          router.push("/complete-profile");
        }
      } catch (err) {
        console.error("Profile loading error:", err);
        setProfile(null);
      }
    };

    loadProfile();
    
    // Auth state listener for password recovery and OAuth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        if (event === "PASSWORD_RECOVERY") {
          router.push("/reset-password");
        } else if (event === 'SIGNED_IN' && session) {
          const isOAuthSignIn = session.user.app_metadata.provider !== 'email';
          
          // Wait a bit for profile to be created by trigger
          await new Promise(resolve => setTimeout(resolve, isOAuthSignIn ? 2000 : 1000));
          
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError && profileError.code !== 'PGRST116') {
            console.error("Error fetching profile after sign-in:", profileError);
          }
          
          setProfile(profileData);
          
          // Redirect to complete-profile if profile is missing or incomplete
          if (!profileData || !profileData.username) {
            router.push("/complete-profile");
          }
          // For OAuth users with complete profiles, they'll stay on home page
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user, supabase, router]);  
  
  const isLoggedIn = !!user;

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
        setIsLoading(false);
        return;
      }
      
      if (data?.user) {
        notify.auth.loginSuccess();
        
        // Check if user has a complete profile but don't redirect
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (!profileData || !profileData.username) {
          router.push("/complete-profile");
        } else {
          // User has complete profile, update local state
          setProfile(profileData);
        }
        // If user has complete profile, stay on home page to show welcome message
      }
    } catch (error) {
      console.error("Login error:", error);
      notify.error("An unexpected error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for Google sign-in
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        notify.error("Google sign-in failed: " + error.message);
      }
    } catch (err) {
        notify.error("Unexpected error during Google sign-in. ");
        console.log("Google sign-in error:", err);
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
    <div className="flex flex-col flex-1 bg-background relative overflow-hidden">
      {/* Floating Icons Background */}
      <div className="absolute inset-0 pointer-events-none">
        {floatingIcons.map((iconData, index) => (
          <FloatingIcon
            key={index}
            Icon={iconData.Icon}
            color={iconData.color}
            delay={iconData.delay}
          />
        ))}
      </div>

      {/* Hero Section with Log In Form*/}
      <section className="container p-2 relative z-10 min-h-[calc(100vh-8rem)]">
        <div className="grid md:grid-cols-2 gap-8 items-stretch h-full">
          <div className="flex flex-col gap-8 justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tighter mb-2">
                CHALLENGE <br className="hidden sm:inline" />
                YOUR FRIENDS
              </h1>
              <div className="space-y-2 text-lg text-muted-foreground">
                <p>
                  Test your knowledge in lightning-fast 1v1 trivia battles across a plethora of topics. 7 Rounds, 10 seconds each! Who will be the ultimate trivia champion?
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-col w-full space-y-5"
            >
              {!isLoggedIn ? (
                <div className="border rounded-lg p-6 backdrop-blur-sm bg-card/95 shadow-lg">
                  <AuthForm 
                    formType="login" 
                    onSubmit={handleLoginSubmit} 
                    loading={isLoading} 
                    onForgotPassword={ () => setIsForgotPasswordOpen(true)} 
                  />
                  <div className="mt-4 text-center">
                    <Button
                      variant="ghost"
                      className="w-full cursor-pointer bg-[#131314] flex items-center justify-center gap-2"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                    >
                      <Image src="/web_dark_rd_na.svg" alt="Google Logo" width={24} height={24} />
                      Sign in with Google
                    </Button>
                  </div>
                  
                  <div className="mt-3 text-center">
                    <Button variant="link" className="text-sm text-primary cursor-pointer" onClick={() => setIsSignUpOpen(true)}>
                      Don&apos;t have an account? Sign up
                    </Button>
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ scale: 1.02, y: -2, transition: { duration: 0.4, delay: 0 } }}
                  className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-200/20 rounded-xl p-6 group backdrop-blur-sm bg-card/50"
                >
                  <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-24 h-24 border-2 border-purple-400/50 shadow-lg group-hover:border-purple-400/70 transition-colors">
                    <AvatarImage 
                      src={profile?.avatar_url || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"} 
                      alt="User Avatar" 
                      className="object-cover"
                    />
                  </Avatar>
                  <div>
                    <h3 className="text-2xl font-semibold cursor-default">
                      Welcome back, <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">{profile?.username || 'User'}</span>!
                    </h3>
                    <p className="text-base text-muted-foreground cursor-default">Ready to train your brain or learn something new today?</p>
                    <p className="text-sm text-muted-foreground/70 cursor-default mt-1">Pick a topic and keep your mind sharp!</p>
                  </div>
                  </div>

                  {/* Random Quote */}
                  <div className="mt-4 w-full">
                    <div className="bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-lg p-4 border border-purple-200/10 group-hover:border-purple-200/20 transition-colors">
                      <blockquote className="text-base font-medium italic text-muted-foreground/90">
                        {[
                          "Honey never spoils. Archaeologists have discovered pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible due to honey’s natural composition and low moisture content.",
                          "The shortest war in history occurred in 1896 between Britain and Zanzibar. The conflict lasted only 38 minutes, ending with a decisive British victory and the surrender of Zanzibar.",
                          "Octopuses possess three hearts: two pump blood to the gills, while the third pumps it to the rest of the body. Their blood is blue because it contains copper-based hemocyanin instead of iron-based hemoglobin.",
                          "Bananas are classified as berries according to botanical definitions, while strawberries are not. This is due to the way their seeds are distributed and how the fruit develops from the flower.",
                          "During hot days, the Eiffel Tower can grow up to 15 centimeters taller. This happens because the metal expands in the heat, a phenomenon known as thermal expansion.",
                          "A group of flamingos is called a 'flamboyance.' Flamingos get their pink color from the carotenoid pigments in the food they eat, such as shrimp and algae.",
                          "Taumatawhakatangihangakoauauotamateaturipukakapikimaungahoronukupokaiwhenuakitanatahu is the longest place name in the world, with 85 letters. It refers to a hill in New Zealand and translates to 'The place where Tamatea, the man with the big knees, who slid, climbed and swallowed mountains, known as the land-eater, played his nose flute to his loved one.'",
                          "The inventor of the frisbee, Walter Morrison, was so passionate about his creation that after he died, his ashes were molded into frisbees and given to family and friends.",
                          "There are more possible iterations of a game of chess than there are atoms in the observable universe. The number of unique chess games is estimated to be 10^120, while the number of atoms is around 10^80.",
                          "Wombats produce cube-shaped poop. This unusual trait helps the poop stay in place and mark territory, preventing it from rolling away on uneven ground.",
                          "Venus is the only planet in our solar system that rotates clockwise on its axis, a phenomenon known as retrograde rotation. All other planets rotate counterclockwise.",
                          "A single bolt of lightning contains enough energy to toast 100,000 slices of bread. Lightning can reach temperatures of 30,000 Kelvin, which is five times hotter than the surface of the sun.",
                          "The heart of a shrimp is located in its head. Shrimp also have open circulatory systems, meaning their organs are bathed directly in blood.",
                          "The unicorn is the national animal of Scotland. It was chosen because it is a symbol of purity, innocence, and power in Celtic mythology.",
                          "Hot water can freeze faster than cold water under certain conditions, a phenomenon known as the Mpemba effect. Scientists are still investigating the exact reasons why this happens.",
                          "The tongue is the only muscle in your body that is attached at only one end. It is made up of eight different muscles that intertwine, allowing for a wide range of movements.",
                          "The world’s deepest postbox is located in Susami Bay, Japan, 10 meters underwater. Divers use it to send waterproof postcards as a tourist attraction.",
                          "The dot over the letter 'i' and 'j' is called a tittle. The word comes from the Latin 'titulus,' meaning inscription or heading.",
                          "A snail can sleep for up to three years at a time. During periods of extreme weather, snails enter a state of hibernation to survive.",
                          "Koalas have fingerprints that are so similar to humans that even under a microscope, they can be difficult to distinguish. This has occasionally confused crime scene investigators in Australia."
                        ][Math.floor(Math.random() * 20)]}
                      </blockquote>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
          
          {/* Interactive Action Section - Right side of hero */}
          <div className="flex flex-col gap-8 h-full justify-center pt-4">
            <div className="space-y-8">
              {/* Quick Match - Disabled */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                whileHover={{ scale: 1.02, y: -2, transition: { duration: 0.4, delay: 0 } }}
                className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-200/20 rounded-xl p-6 backdrop-blur-sm bg-card/50 opacity-60"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <PlayIcon className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold cursor-default">Quick Play</h3>
                    <p className="text-sm text-muted-foreground cursor-default">Compete online to climb up the leaderboard</p>
                    <p className="text-xs text-muted-foreground/70 cursor-default mt-1">Match with players worldwide</p>
                  </div>
                </div>
                <Button disabled className="w-full h-12 bg-green-500 hover:bg-green-600 text-base">
                  <GamepadIcon className="w-5 h-5 mr-2" />
                  Coming Soon
                </Button>
              </motion.div>

              {/* Challenge Friends */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                whileHover={{ scale: 1.02, y: -2, transition: { duration: 0.4, delay: 0 } }}
                className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-200/20 rounded-xl p-6 group backdrop-blur-sm bg-card/50"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                    <UsersIcon className="w-8 h-8 text-blue-400 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold cursor-default">Battle Mode</h3>
                    <p className="text-sm text-muted-foreground cursor-default">Challenge your friends</p>
                    <p className="text-xs text-muted-foreground/70 cursor-default mt-1">No need for them to be online at the same time</p>
                  </div>
                </div>
                <Button className="w-full h-12 bg-blue-500/50 group-hover:bg-blue-600 cursor-pointer hover:bg-blue-600 text-base" onClick={() => router.push("/friends")}>
                  <SwordsIcon className="w-5 h-5 mr-2" />
                  Challenge Friends
                </Button>
              </motion.div>

              {/* Tournaments */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                whileHover={{ scale: 1.02, y: -2, transition: { duration: 0.4, delay: 0 } }}
                className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-200/20 rounded-xl p-6 backdrop-blur-sm bg-card/50 opacity-60"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-yellow-500/20 rounded-lg">
                    <Crown className="w-8 h-8 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold cursor-default">Tournaments</h3>
                    <p className="text-sm text-muted-foreground cursor-default">Compete for glory</p>
                    <p className="text-xs text-muted-foreground/70 cursor-default mt-1">Weekly competitions with prizes</p>
                  </div>
                </div>
                <Button disabled className="w-full h-12 text-base bg-yellow-400">
                  <Timer className="w-5 h-5 mr-2" />
                  Coming Soon
                </Button>
              </motion.div>
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

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-6rem)] flex items-center justify-center"><Loader /></div>}>
      <HomeContent />
    </Suspense>
  );
}
