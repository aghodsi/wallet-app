import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { useNavigate } from "react-router";

interface ErrorDisplayProps {
  error?: Error | string | null;
  title?: string;
  description?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
  className?: string;
}

export function ErrorDisplay({ 
  error, 
  title = "Something went wrong",
  description,
  onRetry,
  showHomeButton = true,
  className = ""
}: ErrorDisplayProps) {
  const navigate = useNavigate();

  const errorMessage = error instanceof Error ? error.message : error || "An unexpected error occurred";
  const isAuthError = errorMessage.toLowerCase().includes('unauthorized') || 
                     errorMessage.toLowerCase().includes('authentication') ||
                     errorMessage.toLowerCase().includes('401');
  
  const isNetworkError = errorMessage.toLowerCase().includes('network') ||
                        errorMessage.toLowerCase().includes('fetch') ||
                        errorMessage.toLowerCase().includes('connection');

  const getErrorIcon = () => {
    if (isAuthError) return "🔒";
    if (isNetworkError) return "🌐";
    return "⚠️";
  };

  const getErrorTitle = () => {
    if (isAuthError) return "Authentication Required";
    if (isNetworkError) return "Connection Problem";
    return title;
  };

  const getErrorDescription = () => {
    if (description) return description;
    if (isAuthError) return "Please sign in to access this content.";
    if (isNetworkError) return "Please check your internet connection and try again.";
    return "We encountered an issue while loading this page.";
  };

  return (
    <div className={`flex items-center justify-center min-h-[400px] p-4 ${className}`}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 w-12 h-12 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <span className="text-2xl">{getErrorIcon()}</span>
            {getErrorTitle()}
          </CardTitle>
          <CardDescription>
            {getErrorDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {errorMessage}
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-2">
            {onRetry && (
              <Button onClick={onRetry} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
            
            {showHomeButton && (
              <Button 
                variant="outline" 
                onClick={() => navigate("/")}
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = "No data available",
  description = "There's nothing to show here yet.",
  icon,
  action,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`flex items-center justify-center min-h-[300px] p-4 ${className}`}>
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          {icon ? (
            <div className="mx-auto mb-4 rounded-full bg-muted w-12 h-12 flex items-center justify-center">
              {icon}
            </div>
          ) : (
            <div className="mx-auto mb-4 rounded-full bg-muted w-12 h-12 flex items-center justify-center">
              <span className="text-2xl">📭</span>
            </div>
          )}
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          
          {action && (
            <div className="pt-2">
              {action}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface LoadingStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export function LoadingState({
  title = "Loading...",
  description = "Please wait while we fetch your data.",
  className = ""
}: LoadingStateProps) {
  return (
    <div className={`flex items-center justify-center min-h-[300px] p-4 ${className}`}>
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto mb-4 rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
