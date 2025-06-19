export function sanitizeUsername(username: string): string {
  // Remove any characters that could be problematic for SQL
  // Allow only alphanumeric characters, underscores, and hyphens
  return username.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
}

export function validateUsername(username: string): { isValid: boolean; error?: string } {
  const sanitized = sanitizeUsername(username);
  
  if (sanitized.length < 3) {
    return { isValid: false, error: "Username must be at least 3 characters long" };
  }
  
  if (sanitized.length > 20) {
    return { isValid: false, error: "Username must be no more than 20 characters long" };
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
    return { isValid: false, error: "Username can only contain letters, numbers, underscores, and hyphens" };
  }
  
  if (sanitized !== username.toLowerCase()) {
    return { isValid: false, error: "Username contains invalid characters" };
  }
  
  return { isValid: true };
}

export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters long" };
  }
  
  if (password.length > 128) {
    return { isValid: false, error: "Password must be no more than 128 characters long" };
  }
  
  // Check for at least one letter and one number
  if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
    return { isValid: false, error: "Password must contain at least one letter and one number" };
  }
  
  return { isValid: true };
}

export function validatePasswordConfirmation(password: string, confirmPassword: string): { isValid: boolean; error?: string } {
  if (password !== confirmPassword) {
    return { isValid: false, error: "Passwords do not match" };
  }
  
  return { isValid: true };
}
