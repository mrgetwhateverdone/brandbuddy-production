/**
 * This part of the code provides auth state preloading to eliminate loading flashes
 * Ensures Clerk authentication is fully loaded before rendering the app
 */

import { ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { LoadingState } from '@/components/ui/loading-spinner';

interface AuthenticatedAppProps {
  children: ReactNode;
}

// This part of the code preloads authentication state to prevent loading flashes
export function AuthenticatedApp({ children }: AuthenticatedAppProps) {
  const { isLoaded } = useAuth();
  
  // Show consistent loading state while auth initializes
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingState message="Initializing BrandBuddy..." />
      </div>
    );
  }
  
  // Auth is fully loaded - render the app
  return <>{children}</>;
}
