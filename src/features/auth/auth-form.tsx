"use client";

import { LoginFormValues, SignupFormValues } from "./schemas";
import { LoginForm } from "./login-form";
import { SignupForm } from "./signup-form";

interface LoginAuthFormProps {
  formType: "login";
  onSubmit: (values: LoginFormValues) => void;
  onForgotPassword?: () => void;
  loading?: boolean;
}

interface SignupAuthFormProps {
  formType: "signup";
  onSubmit: (values: SignupFormValues) => void;
  onForgotPassword?: never;
  loading?: boolean;
}

type AuthFormProps = LoginAuthFormProps | SignupAuthFormProps;

export function AuthForm(props: AuthFormProps) {
  const { formType, onSubmit, loading = false } = props;
  
  if (formType === "login") {
    return (
      <LoginForm
        onSubmit={onSubmit}
        onForgotPassword={props.onForgotPassword}
        loading={loading}
      />
    );
  } else {
    return (
      <SignupForm
        onSubmit={onSubmit}
        loading={loading}
      />
    );
  }
}
