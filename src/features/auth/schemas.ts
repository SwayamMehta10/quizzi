import { z } from "zod";

export const PASSWORD_REGEX = {
  UPPERCASE: /[A-Z]/,
  LOWERCASE: /[a-z]/,
  NUMBER: /[0-9]/,
  SPECIAL: /[^A-Za-z0-9]/
};

export const emailSchema = z.string().email({ 
  message: "Please enter a valid email address" 
});

export const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .refine(
    (password) => {
      return PASSWORD_REGEX.UPPERCASE.test(password) && 
              PASSWORD_REGEX.LOWERCASE.test(password) && 
              PASSWORD_REGEX.NUMBER.test(password) && 
              PASSWORD_REGEX.SPECIAL.test(password);
    },
    { 
      message: "Password must contain at least 8 characters including one uppercase letter, one lowercase letter, one number, and one special character"
    }
  );

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
}).refine(
  (data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }
);

export const profileSetupSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  dob: z.date({
    required_error: "Date of birth is required",
    invalid_type_error: "Date of birth must be a valid date",
  }),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"], {
    required_error: "Please select a gender",
  }),
  country: z.string().min(1, { message: "Please enter your country" }),
  profilePicture: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type ProfileSetupValues = z.infer<typeof profileSetupSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
