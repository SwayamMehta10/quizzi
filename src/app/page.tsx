"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopicCard } from "@/components/topics/topic-card";
import Link from "next/link";
import { AuthForm, LoginFormValues, SignupFormValues } from "@/features/auth/auth-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Home() {
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSubmit = (values: LoginFormValues | SignupFormValues) => {
    setIsLoading(true);
    try {
      console.log("Login values:", values);
      // Here you would add your login logic with Supabase
      // supabase.auth.signInWithPassword({ email: values.email, password: values.password });
      setIsLoggedIn(true); // Set logged in state to true on successful login
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = (values: LoginFormValues | SignupFormValues) => {
    setIsLoading(true);
    try {
      console.log("Signup values:", values);
      // Here you would add your signup logic with Supabase
      // supabase.auth.signUp({ email: values.email, password: values.password });
      setIsSignUpOpen(false);
      setIsLoggedIn(true); // Set logged in state to true on successful signup
    } catch (error) {
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-border/40 bg-background">
        <div className="container flex h-16 max-w-screen-xl items-center">
          <div className="mr-8 flex">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-extrabold text-2xl text-primary tracking-tighter">QUIZZI</span>
            </Link>
          </div>
          <nav className="flex items-center space-x-8 text-sm uppercase font-bold flex-1">
            <Link href="/topics" className="transition-colors hover:text-primary">
              Topics
            </Link>
            <Link href="/leaderboard" className="transition-colors hover:text-primary">
              Leaderboard
            </Link>
            <Link href="/friends" className="transition-colors hover:text-primary">
              Friends
            </Link>
            <Link href="/friends" className="transition-colors hover:text-primary">
              Achievements
            </Link>
          </nav>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600 mr-2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
            </svg>
          </div>
          
          <span className="">{isLoggedIn ? "username" : "Guest"}</span>
        </div>
      </header>

      {/* Hero Section */}
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
              <div className="border rounded-lg p-5 bg-card shadow-sm">
                <h3 className="text-lg font-bold mb-4">Log In</h3>
                <AuthForm type="login" onSubmit={handleLoginSubmit} loading={isLoading} />
                
                <div className="mt-4 text-center">
                  <Button variant="link" className="text-sm text-primary cursor-pointer" onClick={() => setIsSignUpOpen(true)}>
                    Don&apos;t have an account? Sign up
                  </Button>
                </div>
              </div>
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
            <AuthForm type="signup" onSubmit={handleSignupSubmit} loading={isLoading} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Featured Topics Section */}
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
          <TabsContent value="popular">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { name: "History" },
                { name: "Science" },
                { name: "Movies" },
                { name: "Geography" }
              ].map((topic, i) => (
                <TopicCard 
                  key={i} 
                  name={topic.name}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="trending">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { name: "Music" },
                { name: "Sports" },
                { name: "Technology" },
                { name: "Gaming" }
              ].map((topic, i) => (
                <TopicCard 
                  key={i} 
                  name={topic.name}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="new">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { name: "Food & Drink" },
                { name: "Gaming" },
                { name: "Technology" },
                { name: "Geography" }
              ].map((topic, i) => (
                <TopicCard 
                  key={i} 
                  name={topic.name}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
