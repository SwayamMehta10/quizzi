"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loginSchema, LoginFormValues } from "./schemas";

interface LoginFormProps {
	onSubmit: (values: LoginFormValues) => void;
	onForgotPassword?: () => void;
	loading?: boolean;
}

export function LoginForm({ 
	onSubmit, 
	onForgotPassword, 
	loading = false 
}: LoginFormProps) {
	const form = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});	const buttonText = loading ? "Loading..." : "Log In";

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="space-y-5 w-full"
			>
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input
									placeholder="you@example.com"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Password</FormLabel>
							<FormControl>
								<Input
									type="password"
									placeholder="••••••••"
									{...field}
								/>
							</FormControl>
							<FormMessage />							{onForgotPassword && (
								<div className="text-right">
									<Button
										variant="link"
										type="button"
										className="p-0 h-auto text-sm font-normal text-muted-foreground hover:text-primary cursor-pointer"
										onClick={() => onForgotPassword?.()}
									>
										Forgot password?
									</Button>
								</div>
							)}
						</FormItem>
					)}
				/>

				<Button
					type="submit"
					className="w-full cursor-pointer"
					disabled={loading}
					variant="default"
				>
					{buttonText}
				</Button>
			</form>
		</Form>
	);
}
