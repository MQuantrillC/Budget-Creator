'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (!supabase) {
      // Supabase not configured - fall back to guest mode
      setIsGuest(true);
      setIsLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      // A real session supersedes guest mode (e.g. guest who then logs in)
      if (session) {
        setIsGuest(false);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    isGuest,
    isLoading,
    isAuthModalOpen,
    showAuthModal: () => setIsAuthModalOpen(true),
    hideAuthModal: () => setIsAuthModalOpen(false),
    setIsGuest, // Add this
    signOut: async () => {
      if (supabase) {
        await supabase.auth.signOut();
      }
      setSession(null);
      setUser(null);
      setIsGuest(false);
    },
    signInWithPassword: (credentials) => supabase.auth.signInWithPassword(credentials),
    signInWithOAuth: (options) => supabase.auth.signInWithOAuth(options),
    signUp: (credentials) => supabase.auth.signUp(credentials),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-paper">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-credit mx-auto mb-4"></div>
          <p className="ledger-label">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
