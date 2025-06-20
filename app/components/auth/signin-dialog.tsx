import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { authClient } from "~/lib/auth-client";
import { useAuth } from "~/contexts/authContext";
import { toast } from "sonner";
import {
  sanitizeUsername,
  validateUsername,
  validatePassword,
  validatePasswordConfirmation
} from "~/lib/validation";

interface SignInDialogProps {
  children: React.ReactNode;
}

export function SignInDialog({ children }: SignInDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { refreshAuth } = useAuth();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate username
    const usernameValidation = validateUsername(formData.username);
    if (!usernameValidation.isValid) {
      newErrors.username = usernameValidation.error!;
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.error!;
    }

    // Validate password confirmation for signup
    if (isSignUp) {
      const confirmPasswordValidation = validatePasswordConfirmation(formData.password, formData.confirmPassword);
      if (!confirmPasswordValidation.isValid) {
        newErrors.confirmPassword = confirmPasswordValidation.error!;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const sanitizedUsername = sanitizeUsername(formData.username);

      if (isSignUp) {
        // For sign up, we'll use username as both username and email (with a dummy domain)
       const { error } = await authClient.signUp.email({
          email: `${sanitizedUsername}@wallet.app`,
          password: formData.password,
          username: sanitizedUsername,
          name: sanitizedUsername,
        }, {
          onRequest: (ctx) => {
            console.log("Sign up request initiated:", ctx);

          },
          onSuccess: (ctx) => {
            console.log("Sign up successful:", ctx);
            toast.success("Account created successfully! Please sign in.");
          }, onError: (ctx) => {
            console.error("Sign up error:", ctx);
            if(ctx.error?.code.includes("USERNAME_IS_ALREADY_TAKEN_PLEASE_TRY_ANOTHER")) {
              setErrors(prev => ({
                ...prev,
                username: "Username already exists. Please choose a different one.",
              }));
            }
            toast.error("Failed to create account. Please try again.");
          }
        });

        if(error && error.code && error.code.includes("USERNAME_IS_ALREADY_TAKEN_PLEASE_TRY_ANOTHER")) {
          setErrors(prev => ({
            ...prev,
            username: "Username already exists. Please choose a different one.",
          }));
          return;
        }
        // Switch to login form after successful signup
        setIsSignUp(false);
        setFormData({ username: "", password: "", confirmPassword: "" });
        setErrors({});
      } else {
        await authClient.signIn.username({
          username: `${sanitizedUsername}`,
          password: formData.password,
        },{
          onRequest: (ctx) => {
            console.log("Sign up request initiated:", ctx);

          },
          onSuccess: (ctx) => {
            console.log("Sign in successful:", ctx);
            toast.success("Signed in successfully!");
          }, onError: (ctx) => {
            console.error("Sign up error:", ctx);
            toast.error("Signin failed. Please check your credentials.");
          }
        });
        

        // Refresh auth state after successful authentication
        await refreshAuth();

        setIsOpen(false);
        setFormData({ username: "", password: "", confirmPassword: "" });
        setErrors({});
      }
    } catch (error) {
      toast.error(isSignUp ? "Failed to create account" : "Failed to sign in");
      console.error("Auth error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isSignUp ? "Create Account" : "Sign In"}</DialogTitle>
          <DialogDescription>
            {isSignUp
              ? "Create a new account to get started"
              : "Sign in to your account to continue"
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              placeholder="Enter your username"
            />
            {errors.username && (
              <p className="text-sm text-red-600">{errors.username}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
          </div>
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          )}
          <div className="flex flex-col space-y-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Loading..." : (isSignUp ? "Create Account" : "Sign In")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrors({});
                setFormData({ username: "", password: "", confirmPassword: "" });
              }}
              disabled={isLoading}
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
