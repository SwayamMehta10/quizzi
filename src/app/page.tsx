import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopicCard } from "@/components/topics/topic-card";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* QuizUp-style Header */}
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
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="uppercase font-semibold cursor-pointer">Log In</Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 uppercase font-semibold cursor-pointer">Sign Up</Button>
          </div>
        </div>
      </header>

      <section className="container py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tighter">
              CHALLENGE <br className="hidden sm:inline" />
              YOUR FRIENDS
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Test your knowledge in lightning-fast 1v1 trivia battles across hundreds of topics. Who will be the ultimate trivia champion?
            </p>
            <div className="flex flex-col w-full max-w-sm gap-3">
              <Button size="lg" className="bg-primary hover:bg-primary/90 uppercase font-semibold w-full cursor-pointer">
                Sign Up with Email
              </Button>
              <Button variant="outline" size="lg" className="uppercase font-semibold w-full flex items-center justify-center gap-2 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Continue with GitHub
              </Button>
              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              <Button variant="link" className="text-sm text-muted-foreground cursor-pointer">Already have an account? Log In</Button>
            </div>
          </div>
          
          <div className="w-full h-64 md:h-80 bg-primary/10 border-2 border-primary rounded-xl flex items-center justify-center shadow-inner">
            <span className="text-primary text-lg md:text-2xl font-semibold opacity-80 p-6">
              Gameplay Screenshot Coming Soon
            </span>
            </div>
          </div>
      </section>

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

      <footer className="mt-auto border-t border-border/40 py-8">
        <div className="container">
          <div className="flex flex-col items-center mb-6">
            <span className="font-extrabold text-2xl text-primary tracking-tighter mb-2">QUIZZI</span>
            <p className="text-sm text-muted-foreground">Challenge your friends. Test your knowledge.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold uppercase text-sm mb-4">Play</h3>
              <ul className="space-y-2">
                <li><Link href="/topics" className="text-sm text-muted-foreground hover:text-primary">Topics</Link></li>
                <li><Link href="/friends" className="text-sm text-muted-foreground hover:text-primary">Friends</Link></li>
                <li><Link href="/friends" className="text-sm text-muted-foreground hover:text-primary">Find Friends</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold uppercase text-sm mb-4">About</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-sm text-muted-foreground hover:text-primary">Our Story</Link></li>
                <li><Link href="/team" className="text-sm text-muted-foreground hover:text-primary">Team</Link></li>
                <li><Link href="/careers" className="text-sm text-muted-foreground hover:text-primary">Careers</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold uppercase text-sm mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-sm text-muted-foreground hover:text-primary">Help Center</Link></li>
                <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">Contact Us</Link></li>
                <li><Link href="/feedback" className="text-sm text-muted-foreground hover:text-primary">Feedback</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold uppercase text-sm mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
                <li><Link href="/cookies" className="text-sm text-muted-foreground hover:text-primary">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-6 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-center text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Quizzi. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <span className="sr-only">Twitter</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <span className="sr-only">Instagram</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <span className="sr-only">Facebook</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
