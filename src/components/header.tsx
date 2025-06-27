import Link from "next/link";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  isLoggedIn?: boolean;
  isLoading?: boolean;
  onSignOut?: () => void;
}

export default function Header({ isLoggedIn = false, isLoading = false, onSignOut }: HeaderProps) {
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

		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
			<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
		</svg>
        
        {isLoggedIn && onSignOut && (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={onSignOut} 
            className="text-sm ml-4 cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? "Signing out..." : "Sign Out"}
          </Button>
        )}
      </div>
    </header>
  );
}