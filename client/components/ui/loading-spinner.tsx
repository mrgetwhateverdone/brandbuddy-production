import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <Loader2
      className={cn("animate-spin text-gray-400", sizeClasses[size], className)}
    />
  );
}

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12",
        className,
      )}
    >
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-sm text-gray-500">{message}</p>
    </div>
  );
}

export function LoadingCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-white p-4 rounded-lg border border-gray-200 shadow-sm",
        "flex items-center justify-center",
        className,
      )}
    >
      <LoadingSpinner size="sm" />
      <span className="ml-2 text-sm text-gray-500">Loading...</span>
    </div>
  );
}
