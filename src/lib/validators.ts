/**
 * Validation utilities for user inputs
 */
export const validators = {
  /**
   * Validate username format
   */
  username: (username: string): { isValid: boolean; message?: string } => {
    if (username.length < 3) {
      return { isValid: false, message: "Username must be at least 3 characters long" };
    }
    if (username.length > 20) {
      return { isValid: false, message: "Username must be less than 20 characters long" };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { isValid: false, message: "Username can only contain letters, numbers, and underscores" };
    }
    return { isValid: true };
  },

  /**
   * Validate email format
   */
  email: (email: string): { isValid: boolean; message?: string } => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: "Please enter a valid email address" };
    }
    return { isValid: true };
  },

  /**
   * Validate search term
   */
  searchTerm: (term: string): { isValid: boolean; message?: string } => {
    if (term.length < 3) {
      return { isValid: false, message: "Search term must be at least 3 characters long" };
    }
    if (term.length > 50) {
      return { isValid: false, message: "Search term must be less than 50 characters long" };
    }
    // Basic XSS prevention
    if (/<script|javascript:/i.test(term)) {
      return { isValid: false, message: "Invalid search term" };
    }
    return { isValid: true };
  },

  /**
   * Validate avatar URL
   */
  avatarUrl: (url: string): { isValid: boolean; message?: string } => {
    if (!url) return { isValid: true }; // Optional field
    
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { isValid: false, message: "Avatar URL must use HTTP or HTTPS" };
      }
      if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(urlObj.pathname)) {
        return { isValid: false, message: "Avatar URL must be a valid image file" };
      }
      return { isValid: true };
    } catch {
      return { isValid: false, message: "Please enter a valid URL" };
    }
  }
};

/**
 * Sanitize user inputs
 */
export const sanitizers = {
  /**
   * Sanitize username
   */
  username: (username: string): string => {
    return username.trim().toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
  },

  /**
   * Sanitize search term
   */
  searchTerm: (term: string): string => {
    return term.trim().replace(/[<>]/g, '');
  },

  /**
   * Get safe avatar URL with fallback
   */
  avatarUrl: (url: string | null): string => {
    const defaultAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face";
    
    if (!url) return defaultAvatar;
    
    const validation = validators.avatarUrl(url);
    return validation.isValid ? url : defaultAvatar;
  }
};
