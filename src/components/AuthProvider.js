'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import AuthModal from './AuthModal';

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

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setShowModal(false);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setShowModal(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleGuestMode = () => {
    setIsGuest(true);
    setShowModal(false);
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
      {showModal && !isGuest && !session && (
        <AuthModal onClose={handleCloseModal} onGuest={handleGuestMode} />
      )}
      {children}
    </AuthContext.Provider>
  );
}
