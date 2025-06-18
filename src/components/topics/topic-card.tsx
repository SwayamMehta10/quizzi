import { cn } from "@/lib/utils";
import Link from "next/link";

type TopicColors = {
  [key: string]: {
    bg: string;
    icon: React.ReactNode;
  };
};

const topicColors: TopicColors = {
  History: {
    bg: "bg-[var(--topic-history)]",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
        <path d="M12 7v5l2.5 2.5" />
      </svg>
    )
  },
  Science: {
    bg: "bg-[var(--topic-science)]",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M10 2v8.5a2.5 2.5 0 0 1-5 0V2" />
        <path d="M14 2v8.5a2.5 2.5 0 0 0 5 0V2" />
        <path d="M8.5 9.5 14 15" />
        <path d="M3 20h18v2H3z" />
      </svg>
    )
  },
  Movies: {
    bg: "bg-[var(--topic-movies)]",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="M2 8h20" />
        <path d="M6 4v16" />
        <path d="M18 4v16" />
        <path d="M2 12h20" />
        <path d="M2 16h20" />
      </svg>
    )
  },
  Music: {
    bg: "bg-[var(--topic-music)]",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M9 18V5l12-2v13" />
        <path d="M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
        <path d="M18 13a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
      </svg>
    )
  },
  Sports: {
    bg: "bg-[var(--topic-sports)]",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20" />
        <path d="M12 7v5l3 3" />
      </svg>
    )
  },
  Technology: {
    bg: "bg-[var(--topic-tech)]",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    )
  },
  Geography: {
    bg: "bg-[var(--topic-geography)]",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15 15 0 0 0 0 20m0-20a15 15 0 0 1 0 20" />
        <path d="M2 12h20" />
      </svg>
    )
  },
  Gaming: {
    bg: "bg-[var(--topic-tech)]",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M14.5 2H9.5a2 2 0 0 0-2 2v4.5a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
        <path d="M3.5 10H2a2 2 0 0 0-2 2v4.5a2 2 0 0 0 2 2h1.5a2 2 0 0 0 2-2v-4.5a2 2 0 0 0-2-2Z" />
        <path d="M22 10h-1.5a2 2 0 0 0-2 2v4.5a2 2 0 0 0 2 2H22a2 2 0 0 0 2-2v-4.5a2 2 0 0 0-2-2Z" />
        <path d="M9.5 22h5a2 2 0 0 0 2-2v-4.5a2 2 0 0 0-2-2h-5a2 2 0 0 0-2 2V20a2 2 0 0 0 2 2Z" />
      </svg>
    )
  },
  "Food & Drink": {
    bg: "bg-[var(--topic-sports)]",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M18 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    )
  }
};

interface TopicCardProps {
  name: string;
}

export function TopicCard({ name }: TopicCardProps) {
  const topicColor = topicColors[name] || {
    bg: "bg-primary",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    )
  };

  return (
    <Link href={`/topics/${name.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="group cursor-pointer">
        <div className="flex flex-col">
          <div className={cn(
            "relative w-full aspect-square rounded-2xl overflow-hidden flex items-center justify-center text-white",
            topicColor.bg
          )}>
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all"></div>
            <div className="z-10 flex flex-col items-center">
              {topicColor.icon}
              <h3 className="mt-3 text-xl font-bold tracking-tight">{name}</h3>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
