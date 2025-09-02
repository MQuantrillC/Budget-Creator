'use client';

import { useAuth } from './AuthProvider';
import AuthModal from './AuthModal';
import ClientOnly from './ClientOnly';

export default function AuthGuard({ children }) {
  const { session, isGuest } = useAuth();

  return (
    <ClientOnly>
      {!isGuest && !session ? <AuthModal /> : children}
    </ClientOnly>
  );
}
