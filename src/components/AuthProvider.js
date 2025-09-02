'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import AuthModal from './AuthModal';
import ClientOnly from './ClientOnly';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [showModal, setShowModal] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If Supabase is not configured, default to guest mode
    if (!supabase) {
      setIsGuest(true);
      setShowModal(false);
      setIsLoading(false);
      return;
    }

    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    // Get initial session with error handling
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          setIsGuest(true);
          setShowModal(false);
        } else {
          setSession(session);
          if (session) {
            setShowModal(false);
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        setIsGuest(true);
        setShowModal(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes with error handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      try {
        setSession(session);
        if (session) {
          setShowModal(false);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleGuestMode = () => {
    setIsGuest(true);
    setShowModal(false);
  };

  const showAuthModal = () => {
    setShowModal(true);
    setIsGuest(false);
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setIsGuest(false);
    setShowModal(true);
  };

  const value = {
    session,
    isGuest,
    isLoading,
    signOut,
    showAuthModal,
  };

  // Don't render anything while loading initial session
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      <ClientOnly>
        {showModal && !isGuest && !session && (
          <AuthModal onClose={handleCloseModal} onGuest={handleGuestMode} />
        )}
      </ClientOnly>
      {children}
    </AuthContext.Provider>
  );
}
