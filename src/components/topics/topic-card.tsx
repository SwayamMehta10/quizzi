"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FriendsList from "@/features/friends/friends-list";
import { ChevronDownIcon, PlayIcon, UsersIcon, GamepadIcon, SwordsIcon } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

interface TopicCardProps {
	name: string;
	iconUrl?: string | null;
	topicId: string;
}

export function TopicCard({ name, iconUrl, topicId }: TopicCardProps) {
	const [showDropdown, setShowDropdown] = useState(false);
	const [showFriendsList, setShowFriendsList] = useState(false);
	const cardRef = useRef<HTMLDivElement>(null);
	const router = useRouter();
	
	// Format the URL-friendly version of the topic name
	const topicSlug = name.toLowerCase().replace(/\s+/g, "-");

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
				setShowDropdown(false);
			}
		};

		if (showDropdown) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showDropdown]);

	const handlePlay = () => {
		// Navigate to solo play
		router.push(`/topics/${topicSlug}/play`);
	};

	const handleChallenge = () => {
		setShowFriendsList(true);
		setShowDropdown(false);
	};

	const handleCardClick = (e: React.MouseEvent) => {
		e.preventDefault();
		setShowDropdown(!showDropdown);
	};

	return (
		<div className="relative" ref={cardRef}>
			<div className="group cursor-pointer" onClick={handleCardClick}>
				<div className={`relative w-full sm:w-60 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${showDropdown ? 'ring-2 ring-primary/50 shadow-lg' : ''}`}>
					{/* Icon Container */}
					<div className="w-full h-24 sm:h-32 bg-gradient-to-br from-muted/50 to-muted/80 flex items-center justify-center p-3 sm:p-4 group-hover:from-primary/10 group-hover:to-primary/20 transition-all duration-200">
						<Avatar className="w-16 h-16 sm:w-20 sm:h-20 rounded-full">
							{iconUrl && (
								<AvatarImage 
									src={iconUrl} 
									alt={`${name} icon`}
									className="object-cover w-full h-full"
								/>
							)}
							<AvatarFallback className="bg-primary/20 text-primary rounded-full">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="w-8 h-8 sm:w-10 sm:h-10"
								>
									<circle cx="12" cy="12" r="10" />
									<path d="M12 16v-4" />
									<path d="M12 8h.01" />
								</svg>
							</AvatarFallback>
						</Avatar>
					</div>
					
					{/* Text Container */}
					<div className="p-3 sm:p-4 bg-card">
						<div className="flex items-center justify-between">
							<h3 className="text-sm sm:text-base font-semibold text-card-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1">
								{name}
							</h3>
							<div className="flex items-center gap-1">
								<ChevronDownIcon className={`w-4 h-4 text-muted-foreground transition-all duration-200 ${showDropdown ? 'rotate-180 text-primary' : 'group-hover:text-primary'}`} />
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Dropdown Menu */}
			{showDropdown && (
				<div className="absolute top-full left-0 right-0 z-50 mt-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden dropdown-enter">
					<Button
						variant="ghost"
						className="w-full justify-between gap-2 sm:gap-3 p-3 sm:p-4 h-auto hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-950 rounded-none border-b border-border transition-all duration-200 cursor-pointer"
						onClick={handlePlay}
					>
						<div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center group-hover:bg-green-200">
							<PlayIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
						</div>
						<div className="text-left flex-1">
							<div className="font-semibold text-foreground text-sm sm:text-base">Quick Play</div>
							<div className="text-xs sm:text-sm text-muted-foreground">Compete online</div>
						</div>
						<div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
							<GamepadIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
						</div>
					</Button>
					<Button
						variant="ghost"
						className="w-full justify-between gap-2 sm:gap-3 p-3 sm:p-4 h-auto hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950 rounded-none border-t border-border transition-all duration-200 cursor-pointer"
						onClick={handleChallenge}
					>
						<div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
							<UsersIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
						</div>
						<div className="text-left flex-1">
							<div className="font-semibold text-foreground text-sm sm:text-base">Battle Mode</div>
							<div className="text-xs sm:text-sm text-muted-foreground">Challenge a friend</div>
						</div>
						<div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
							<SwordsIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
						</div>
					</Button>
				</div>
			)}

			{/* Friends List Dialog */}
			<Dialog open={showFriendsList} onOpenChange={setShowFriendsList}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="text-center flex items-center justify-center gap-2">
							<div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
								<UsersIcon className="w-4 h-4 text-blue-600" />
							</div>
							Challenge a Friend
						</DialogTitle>
						<p className="text-center text-muted-foreground">Choose a friend to challenge in <span className="font-semibold text-primary">{name}</span></p>
					</DialogHeader>
					<div className="mt-4">
						<FriendsListForChallenge topicId={topicId} topicName={name} onClose={() => setShowFriendsList(false)} />
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// Enhanced FriendsList component specifically for challenges
function FriendsListForChallenge({ topicId, topicName, onClose }: { topicId: string; topicName: string; onClose: () => void }) {
	const [user, setUser] = useState<User | null>(null);
	const supabase = createClient();

	useEffect(() => {
		const checkAuth = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			setUser(user);
		};
		checkAuth();
	}, [supabase]);
	
	const handleChallengeSent = () => {
		// Show success toast
		toast.success("Challenge sent!", {
			description: `Your friend has been challenged to a ${topicName} duel!`,
			duration: 5000,
		});
		onClose();
	};
	
	if (!user) {
		return <div className="p-4 text-center text-muted-foreground">Please log in to challenge friends.</div>;
	}
	
	return (
		<div className="space-y-2">
			<FriendsList 
				userId={user.id} 
				mode="challenge"
				topicId={topicId}
				topicName={topicName}
				onChallengeSent={handleChallengeSent}
			/>
			<div className="text-center text-xs text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg border-l-4 border-blue-500">
				<div className="flex items-center justify-center gap-2 mb-1">
					<SwordsIcon className="w-4 h-4 text-blue-500" />
					<span className="font-semibold">Battle Mode</span>
				</div>
				<p>Beat your friends at {topicName} and flex those bragging rights!</p>
			</div>
		</div>
	);
}
