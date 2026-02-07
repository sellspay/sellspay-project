import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

/**
 * Hook that gates seller-only features.
 * Redirects to the seller agreement page if the user hasn't signed the contract.
 * Blocks permanently banned users from accessing seller features.
 * 
 * @returns { isSellerVerified, isChecking, isPermanentlyBanned }
 */
export function useSellerGate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading, profileLoading } = useAuth();

  const isChecking = loading || profileLoading;
  const isSellerVerified = Boolean(profile?.seller_contract_signed_at);
  const isPermanentlyBanned = Boolean((profile as any)?.is_permanently_banned);

  useEffect(() => {
    // Don't redirect while still loading
    if (isChecking) return;
    
    // If no user, let the page handle auth redirect
    if (!user) return;
    
    // If permanently banned, redirect to home with message
    if (isPermanentlyBanned) {
      navigate('/');
      return;
    }
    
    // If user hasn't signed the seller agreement, redirect
    if (!isSellerVerified) {
      // Save the intended destination
      const returnTo = location.pathname + location.search;
      navigate(`/onboarding/seller-agreement?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [isChecking, user, isSellerVerified, isPermanentlyBanned, navigate, location]);

  return {
    isSellerVerified,
    isChecking,
    isPermanentlyBanned,
  };
}

/**
 * List of routes that require seller verification
 */
export const SELLER_GATED_ROUTES = [
  '/create-product',
  '/edit-product',
  '/dashboard',
  '/subscription-plans',
];

/**
 * Check if a path requires seller verification
 */
export function isSellerGatedRoute(path: string): boolean {
  return SELLER_GATED_ROUTES.some(route => path.startsWith(route));
}
