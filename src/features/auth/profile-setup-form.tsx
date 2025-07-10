"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useRef } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { profileSetupSchema, ProfileSetupValues } from "./schemas";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { 
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/components/ui/select";
import { CountryDropdown } from "@/components/ui/country-dropdown";
import { createClient } from "@/utils/supabase/client";

import "./datePickerFix.css";

interface ProfileSetupFormProps {
	onSubmit: (values: ProfileSetupValues) => void;
	loading?: boolean;
}

export function ProfileSetupForm({ 
	onSubmit, 
	loading = false 
}: ProfileSetupFormProps) {
	const [profilePicture, setProfilePicture] = useState<string | null>(null);
	const [checkingUsername, setCheckingUsername] = useState(false);
	const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
	const [usernameTimeout, setUsernameTimeout] = useState<NodeJS.Timeout | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const supabase = createClient();

	const form = useForm<ProfileSetupValues>({
		resolver: zodResolver(profileSetupSchema),
		defaultValues: {
			username: "",
			dob: undefined,
			gender: "prefer_not_to_say",
			country: "",
			profilePicture: undefined,
		},
	});

	// Check username availability with debounce
	const checkUsernameAvailability = async (username: string) => {
		if (!username || username.length < 3) {
			setUsernameAvailable(null);
			return;
		}
		
		setCheckingUsername(true);
		try {
			const { error } = await supabase
				.from('profiles')
				.select('username')
				.eq('username', username)
				.single();
				
			if (error && error.code === 'PGRST116') {
				// No matching record found - username is available
				setUsernameAvailable(true);
			} else {
				setUsernameAvailable(false);
			}
		} catch (error) {
			console.error('Error checking username:', error);
		} finally {
			setCheckingUsername(false);
		}
	};
	
	// Handle username change with debounce
	const handleUsernameChange = (value: string) => {
		// Clear any previous timeout
		if (usernameTimeout) {
			clearTimeout(usernameTimeout);
		}
		
		// Only check if username is at least 3 characters (matches schema validation)
		if (value.length >= 3) {
			setCheckingUsername(true);
			// Set a new timeout
			const timeout = setTimeout(() => {
				checkUsernameAvailability(value);
			}, 500); // 500ms debounce
			
			setUsernameTimeout(timeout);
		} else {
			setUsernameAvailable(null);
		}
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				setProfilePicture(e.target?.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSubmit = (values: ProfileSetupValues) => {
		// Prevent submission if username is taken or still checking
		if (usernameAvailable === false || checkingUsername) {
			return;
		}
		
		onSubmit({
			...values,
			profilePicture: profilePicture || undefined
		});
	};

	// Determine if submit button should be disabled
	const isSubmitDisabled = loading || usernameAvailable === false || checkingUsername;
	
	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(handleSubmit)}
				className="space-y-6 w-full"
			>
				{/* Profile Picture Upload */}
				<div className="flex flex-col items-center mb-6">
					<div className="relative">
						<Avatar className="size-20 border-2 border-primary">
							{profilePicture ? (
								<AvatarImage src={profilePicture} alt="Profile picture" />
							) : (
								<AvatarImage 
									src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png" 
									alt="Default profile picture" 
								/>
							)}
						</Avatar>
						<Button
							type="button"
							variant="outline"
							className="absolute -bottom-2 -right-2 size-8 rounded-full p-1"
							onClick={() => fileInputRef.current?.click()}
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
								<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
							</svg>
						</Button>
						{profilePicture && (
							<Button
								type="button"
								variant="destructive"
								className="absolute -bottom-2 -left-2 size-8 rounded-full p-1"
								onClick={() => setProfilePicture(null)}
								title="Remove profile picture"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M3 6h18"></path>
									<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
									<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
								</svg>
							</Button>
						)}
					</div>
					<input 
						type="file" 
						ref={fileInputRef} 
						onChange={handleFileChange}
						className="hidden"
						accept="image/*"
					/>
					<p className="text-xs text-muted-foreground mt-2 text-center">
						{profilePicture 
							? "Click the trash icon to remove or pencil icon to change" 
							: "Click the pencil icon to upload a custom profile picture"}
					</p>
				</div>

				{/* Username Field */}
				<FormField
					control={form.control}
					name="username"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Username<span className="text-red-500 ml-1">*</span></FormLabel>
							<div className="relative">
								<FormControl>
									<Input
										placeholder="cooluser123"
										autoComplete="new-username"
										{...field}
										value={field.value || ""} 
										onChange={(e) => {
											field.onChange(e);
											handleUsernameChange(e.target.value);
										}}
										className={cn(
											usernameAvailable === true && "pr-10 border-green-500",
											usernameAvailable === false && "pr-10 border-red-500"
										)}
									/>
								</FormControl>
								{checkingUsername && (
									<div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
										<Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
									</div>
								)}
								{!checkingUsername && usernameAvailable === true && field.value && (
									<div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
										<Check className="h-4 w-4 text-green-500" />
									</div>
								)}
							</div>
							{usernameAvailable === false && (
								<p className="text-sm text-red-500 mt-1">This username is already taken</p>
							)}
							{usernameAvailable === true && field.value && (
								<p className="text-sm text-green-500 mt-1">Username available!</p>
							)}
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<FormField
						control={form.control}
						name="dob"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormLabel className="flex">
									Date of Birth<span className="text-red-500 ml-1">*</span>
								</FormLabel>
								<Popover>
									<PopoverTrigger asChild>
										<FormControl>
											<Button
												type="button"
												variant={"outline"}
												className={cn(
													"w-full pl-3 text-left font-normal",
													!field.value && "text-muted-foreground"
												)}
											>
												{field.value ? (
													format(field.value, "P")
												) : (
													<span>01/01/2000</span>
												)}
												<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
											</Button>
										</FormControl>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={field.value}
											onSelect={field.onChange}
											disabled={(date) => date > new Date()}
											captionLayout="dropdown"
											className="calendar-dropdown-fix"
										/>
									</PopoverContent>
								</Popover>
								<FormMessage />
							</FormItem>
						)}
					/>
		
					<FormField
						control={form.control}
						name="gender"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormLabel>Gender<span className="text-red-500 ml-1">*</span></FormLabel>
								<Select 
									onValueChange={field.onChange}
									defaultValue={field.value}
									value={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select gender" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value="male">Male</SelectItem>
										<SelectItem value="female">Female</SelectItem>
										<SelectItem value="other">Other</SelectItem>
										<SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
							
					<FormField
						control={form.control}
						name="country"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormLabel>Country<span className="text-red-500 ml-1">*</span></FormLabel>
								<CountryDropdown
									placeholder="Select country"
									defaultValue={field.value}
									onChange={(country) => {
										field.onChange(country.alpha3);
									}}
								/>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<Button
					type="submit"
					className="w-full cursor-pointer"
					disabled={isSubmitDisabled}
				>
					{loading ? "Setting up profile..." : "Complete Profile"}
				</Button>
			</form>
		</Form>
	);
}
