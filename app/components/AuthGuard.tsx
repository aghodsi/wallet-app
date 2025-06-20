import { useAuth } from "~/contexts/authContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { SignInDialog } from "~/components/auth/signin-dialog";
import { AlertCircle, Lock } from "lucide-react";
import { Alert, AlertDescription } from "~/components/ui/alert";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLoadingState?: boolean;
  requireAuth?: boolean;
}

export function AuthGuard({ 
  children, 
  fallback, 
  showLoadingState = true, 
  requireAuth = true 
}: AuthGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading && showLoadingState) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Checking authentication...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requireAuth && !user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/20 w-12 h-12 flex items-center justify-center">
              <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to be signed in to access this content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please sign in to continue using the application.
              </AlertDescription>
            </Alert>
            <SignInDialog>
              <Button className="w-full">
                Sign In
              </Button>
            </SignInDialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
