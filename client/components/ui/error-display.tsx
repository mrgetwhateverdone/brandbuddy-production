import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "./button";
import { AppError } from "@/lib/errors/AppError";

interface ErrorDisplayProps {
  message?: string;
  error?: AppError;
  onRetry?: () => void;
  className?: string;
  showRetry?: boolean;
}

// This part of the code provides enhanced error display with AppError support
interface EnhancedErrorDisplayProps {
  error: AppError;
  onRetry?: () => void;
  className?: string;
  showDetails?: boolean;
}

export function ErrorDisplay({
  message = "Unable to load data - Refresh to retry or check API connection",
  onRetry,
  className,
  showRetry = true,
}: ErrorDisplayProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12",
        className,
      )}
    >
      <div className="flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
        <WifiOff className="h-8 w-8 text-red-600" />
      </div>

      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Connection Error
      </h3>
      <p className="text-sm text-gray-500 text-center max-w-md mb-6">
        {message}
      </p>

      {showRetry && onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="inline-flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
}

export function ErrorCard({
  message = "Unable to load data - Refresh to retry or check API connection",
  onRetry,
  className,
}: ErrorDisplayProps) {
  return (
    <div
      className={cn(
        "bg-white p-6 rounded-lg border border-red-200 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-red-800 mb-1">
            Data Loading Error
          </h4>
          <p className="text-sm text-red-700 mb-3">{message}</p>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// This part of the code provides enhanced error display with severity-based styling
export function EnhancedErrorDisplay({
  error,
  onRetry,
  className,
  showDetails = false
}: EnhancedErrorDisplayProps) {
  const getSeverityIcon = () => {
    switch (error.severity) {
      case 'critical':
        return <AlertTriangle className="h-8 w-8 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-8 w-8 text-orange-600" />;
      case 'medium':
        return <WifiOff className="h-8 w-8 text-yellow-600" />;
      default:
        return <RefreshCw className="h-8 w-8 text-blue-600" />;
    }
  };

  const getSeverityStyles = () => {
    switch (error.severity) {
      case 'critical':
        return {
          container: 'bg-red-50 border-red-200',
          text: 'text-red-900',
          button: 'bg-red-600 hover:bg-red-700'
        };
      case 'high':
        return {
          container: 'bg-orange-50 border-orange-200',
          text: 'text-orange-900',
          button: 'bg-orange-600 hover:bg-orange-700'
        };
      case 'medium':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-900',
          button: 'bg-yellow-600 hover:bg-yellow-700'
        };
      default:
        return {
          container: 'bg-blue-50 border-blue-200',
          text: 'text-blue-900',
          button: 'bg-blue-600 hover:bg-blue-700'
        };
    }
  };

  const styles = getSeverityStyles();

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-6 rounded-lg border",
      styles.container,
      className
    )}>
      <div className="flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
        {getSeverityIcon()}
      </div>

      <h3 className={cn("text-lg font-medium mb-2", styles.text)}>
        {error.code.replace('_', ' ')} Error
      </h3>
      
      <p className={cn("text-sm text-center max-w-md mb-4", styles.text)}>
        {error.message}
      </p>

      {showDetails && error.context && (
        <details className="mb-4 text-xs">
          <summary className={cn("cursor-pointer", styles.text)}>
            Technical Details
          </summary>
          <pre className={cn("mt-2 p-2 bg-white rounded text-xs", styles.text)}>
            {JSON.stringify(error.context, null, 2)}
          </pre>
        </details>
      )}

      {onRetry && (
        <Button
          onClick={onRetry}
          className={cn("text-white", styles.button)}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {error.isCritical() ? 'Reload Page' : 'Try Again'}
        </Button>
      )}
    </div>
  );
}

interface APIStatusProps {
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  children: React.ReactNode;
  loadingMessage?: string;
}

export function APIStatus({
  isLoading,
  error,
  onRetry,
  children,
  loadingMessage = "Loading data...",
}: APIStatusProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-3" />
          <span className="text-sm text-gray-500">{loadingMessage}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay message={error.message} onRetry={onRetry} />;
  }

  return <>{children}</>;
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
}
