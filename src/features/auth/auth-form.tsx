"use client";

import { LoginFormValues, SignupFormValues } from "./schemas";
import { LoginForm } from "./login-form";
import { SignupForm } from "./signup-form";

// Union type for both form types
type FormValues = LoginFormValues | SignupFormValues;

interface AuthFormProps {
	formType: "login" | "signup";
	onSubmit: (values: FormValues) => void;
	onForgotPassword?: () => void;
	loading?: boolean;
}

export function AuthForm({ 
	formType: type, 
	onSubmit, 
	onForgotPassword, 
	loading = false 
}: AuthFormProps) {
	const isLogin = type === "login";
	return (
		<>
			{isLogin ? (
				<LoginForm
					onSubmit={onSubmit as (values: LoginFormValues) => void}
					onForgotPassword={onForgotPassword}
					loading={loading}
				/>
			) : (
				<SignupForm
					onSubmit={onSubmit as (values: SignupFormValues) => void}
					loading={loading}
				/>
			)}
		</>
	);
}
