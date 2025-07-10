import { notify } from "./notifications";

export interface AppError {
  message: string;
  code?: string;
  context?: string;
  originalError?: unknown;
}

/**
 * Centralized error handling utility
 * 
 * Usage Guidelines:
 * - Use errorHandler for: API errors, database errors, authentication errors, unexpected errors
 * - Use notify directly for: Success messages, simple validation feedback, user actions confirmation
 * 
 * errorHandler automatically handles console logging and provides contextual error messages
 */
export const errorHandler = {
  /**
   * Handle authentication errors
   */
  auth: (error: unknown, context?: string): void => {
    console.error(`Auth error${context ? ` in ${context}` : ''}:`, error);
    
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const errorMessage = (error as { message: string }).message;
      
      if (errorMessage.includes("Invalid login credentials")) {
        notify.error("Invalid email or password. Please try again.");
      } else if (errorMessage.includes("Email not confirmed")) {
        notify.error("Your email has not been verified! Check your inbox for the verification link.");
      } else if (errorMessage.includes("User not found")) {
        notify.error("No account found with this email address.");
      } else {
        notify.error(`Authentication failed: ${errorMessage}`);
      }
    } else {
      notify.error("An unexpected authentication error occurred.");
    }
  },

  /**
   * Handle database/API errors
   */
  database: (error: unknown, context?: string): void => {
    console.error(`Database error${context ? ` in ${context}` : ''}:`, error);
    
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const errorMessage = (error as { message: string }).message;
      
      if (errorMessage.includes("duplicate key")) {
        notify.error("This information already exists. Please use different values.");
      } else if (errorMessage.includes("violates foreign key")) {
        notify.error("Invalid reference data. Please refresh and try again.");
      } else if (errorMessage.includes("violates not-null")) {
        notify.error("Required information is missing. Please fill all required fields.");
      } else if (context?.includes("saving profile")) {
        notify.error("Failed to save profile. Please try again.");
      } else {
        notify.error("A database error occurred. Please try again.");
      }
    } else {
      notify.error("A database error occurred. Please try again.");
    }
  },

  /**
   * Handle network errors
   */
  network: (error: unknown, context?: string): void => {
    console.error(`Network error${context ? ` in ${context}` : ''}:`, error);
    notify.error("Network error. Please check your connection and try again.");
  },

  /**
   * Handle generic errors
   */
  generic: (error: unknown, context?: string): void => {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error);
    notify.error("An unexpected error occurred. Please try again.");
  },

  /**
   * Handle validation errors
   */
  validation: (message: string): void => {
    notify.error(message);
  }
};
