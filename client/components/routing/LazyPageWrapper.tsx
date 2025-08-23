/**
 * This part of the code provides a wrapper for lazy-loaded pages
 * Standardizes loading states and error boundaries for route-based code splitting
 */

import { Suspense, ReactNode } from 'react';
import { useAuth, RedirectToSignIn } from '@clerk/clerk-react';
import { LoadingState } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface LazyPageWrapperProps {
  children: ReactNode;
  loadingMessage?: string;
  requireAuth?: boolean;
}

// This part of the code provides a reusable wrapper for lazy-loaded pages
export function LazyPageWrapper({ 
  children, 
  loadingMessage = "Loading page...", 
  requireAuth = false 
}: LazyPageWrapperProps) {
  const { isSignedIn, isLoaded } = useAuth();
  
  // For public pages, don't check auth - just render with lazy loading
  if (!requireAuth) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingState message={loadingMessage} />}>
          {children}
        </Suspense>
      </ErrorBoundary>
    );
  }
  
  // For protected pages, auth is already loaded by AuthenticatedApp
  // So we can directly check authentication status
  if (!isLoaded) {
    // This should rarely happen now due to AuthenticatedApp preloading
    return <LoadingState message="Checking authentication..." />;
  }
  
  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }
  
  // User is authenticated - render the protected page with lazy loading
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingState message={loadingMessage} />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// This part of the code provides specific wrappers for different page types
export function PublicPageWrapper({ children, loadingMessage }: Omit<LazyPageWrapperProps, 'requireAuth'>) {
  return (
    <LazyPageWrapper loadingMessage={loadingMessage} requireAuth={false}>
      {children}
    </LazyPageWrapper>
  );
}

export function ProtectedPageWrapper({ children, loadingMessage }: Omit<LazyPageWrapperProps, 'requireAuth'>) {
  return (
    <LazyPageWrapper loadingMessage={loadingMessage} requireAuth={true}>
      {children}
    </LazyPageWrapper>
  );
}
