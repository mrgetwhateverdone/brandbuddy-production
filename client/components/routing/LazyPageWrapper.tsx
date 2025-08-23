/**
 * This part of the code provides a wrapper for lazy-loaded pages
 * Standardizes loading states and error boundaries for route-based code splitting
 */

import { Suspense, ReactNode } from 'react';
import { SignedIn } from '@clerk/clerk-react';
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
  const content = (
    <ErrorBoundary>
      <Suspense fallback={<LoadingState message={loadingMessage} />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );

  if (requireAuth) {
    return <SignedIn>{content}</SignedIn>;
  }

  return content;
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
