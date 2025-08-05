import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

// Conditional imports for platform compatibility
let SecureStore, AuthSession, WebBrowser;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
  AuthSession = require('expo-auth-session');
  WebBrowser = require('expo-web-browser');
  WebBrowser.maybeCompleteAuthSession();
} else {
  // Web fallback for storage
  SecureStore = {
    getItemAsync: async (key) => localStorage.getItem(key),
    setItemAsync: async (key, value) => localStorage.setItem(key, value),
    deleteItemAsync: async (key) => localStorage.removeItem(key),
  };
}

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wrap async call to handle any potential promise rejection
    const initializeAuth = async () => {
      try {
        await loadStoredAuth();
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false); // Ensure loading state is updated even on error
      }
    };
    
    initializeAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedUser = await SecureStore.getItemAsync('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      // For demo purposes, we'll simulate Google auth
      // In production, you would use actual Google OAuth
      const mockUser = {
        id: 'google_' + Date.now(),
        name: 'Demo User',
        email: 'demo@example.com',
        provider: 'google',
        avatar: null,
      };
      
      await SecureStore.setItemAsync('user', JSON.stringify(mockUser));
      setUser(mockUser);
      return { success: true };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { success: false, error: error.message };
    }
  };

  const signInWithApple = async () => {
    try {
      // For demo purposes, we'll simulate Apple auth
      // In production, you would use actual Apple Sign In
      const mockUser = {
        id: 'apple_' + Date.now(),
        name: 'Demo User',
        email: 'demo@privaterelay.appleid.com',
        provider: 'apple',
        avatar: null,
      };
      
      await SecureStore.setItemAsync('user', JSON.stringify(mockUser));
      setUser(mockUser);
      return { success: true };
    } catch (error) {
      console.error('Apple sign in error:', error);
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await SecureStore.deleteItemAsync('user');
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInWithApple,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
