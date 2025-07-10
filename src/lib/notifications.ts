"use client";

import { toast } from "sonner";

/**
 * Centralized notification system using sonner
 */
export const notify = {
  success: (message: string) => {
    toast.success(message);
  },
  
  error: (message: string) => {
    toast.error(message);
  },
  
  info: (message: string) => {
    toast.info(message);
  },
  
  warning: (message: string) => {
    toast.warning(message);
  },
  
  // Authentication specific messages
  auth: {
    loginSuccess: () => toast.success("Logged in successfully!"),
    loginFailed: (error: string) => toast.error(`Login failed: ${error}`),
    signupSuccess: () => toast.success("Please check your email to verify your account. After confirming, you'll be able to complete your profile setup."),
    signupFailed: (error: string) => toast.error(`Signup failed: ${error}`),
    signoutSuccess: () => toast.success("Signed out successfully!"),
    passwordResetSent: () => toast.success("Password reset email sent! Check your inbox."),
    profileUpdateSuccess: () => toast.success("Profile updated successfully!"),
    profileUpdateFailed: () => toast.error("Failed to update profile. Please try again."),
  },
  
  // Friend system messages
  friends: {
    requestSent: () => toast.success("Friend request sent!"),
    requestAccepted: () => toast.success("Friend request accepted!"),
    requestDeclined: () => toast.success("Friend request declined."),
    challengeSent: (username: string) => toast.success(`Challenge sent to ${username}!`),
    challengeFailed: () => toast.error("Failed to send challenge. Please try again."),
  }
};
