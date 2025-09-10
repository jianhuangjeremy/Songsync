import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";

// Apple Auth not available - using demo authentication
const appleAuth = undefined;

// Conditional imports for platform compatibility
let SecureStore, AuthSession, WebBrowser;
if (Platform.OS !== "web") {
  SecureStore = require("expo-secure-store");
  AuthSession = require("expo-auth-session");
  WebBrowser = require("expo-web-browser");
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

// Authentication service configuration
const AUTH_SERVICE_URL = "http://localhost:3000"; // Node.js service

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  useEffect(() => {
    checkStoredAuth();
  }, []);

  const checkStoredAuth = async () => {
    try {
      const storedUser = await SecureStore.getItemAsync("user");
      const storedAccessToken = await SecureStore.getItemAsync("accessToken");
      const storedRefreshToken = await SecureStore.getItemAsync("refreshToken");

      if (storedUser && storedAccessToken) {
        const user = JSON.parse(storedUser);
        setUser(user);
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        console.log("Restored user session:", user.email);
      }
    } catch (error) {
      console.error("Error checking stored auth:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh access token (demo mode)
  const refreshAccessToken = async () => {
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      // Generate a new mock access token for demo
      const newAccessToken = "mock_refreshed_access_token_" + Date.now();
      setAccessToken(newAccessToken);
      await SecureStore.setItemAsync("accessToken", newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error("Token refresh error:", error);
      await signOut();
      throw error;
    }
  };

  // Get valid access token (demo mode - always return current token)
  const getValidAccessToken = async () => {
    if (!accessToken) {
      throw new Error("No access token available");
    }

    try {
      // In demo mode, we assume the token is always valid
      // In production, you would validate against your backend
      return accessToken;
    } catch (error) {
      console.error("Token validation error:", error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      // For demo purposes, we'll simulate Google auth without backend
      const mockUser = {
        id: "google_" + Date.now(),
        name: "Demo User",
        email: "demo@example.com",
        provider: "google",
        avatar: null,
      };

      // Generate mock tokens for demo
      const mockTokenData = {
        accessToken: "mock_access_token_" + Date.now(),
        refreshToken: "mock_refresh_token_" + Date.now(),
      };

      // Store user and tokens
      await SecureStore.setItemAsync("user", JSON.stringify(mockUser));
      await SecureStore.setItemAsync("accessToken", mockTokenData.accessToken);
      await SecureStore.setItemAsync("refreshToken", mockTokenData.refreshToken);

      setUser(mockUser);
      setAccessToken(mockTokenData.accessToken);
      setRefreshToken(mockTokenData.refreshToken);

      console.log("Google sign in successful");
      return { success: true };
    } catch (error) {
      console.error("Google sign in error:", error);
      return { success: false, error: error.message };
    }
  };

  const signInWithApple = async () => {
    try {
      console.log("Apple Sign-In attempted...");

      // For Expo/demo purposes, we'll simulate Apple auth with hardcoded credentials
      // In production with native iOS, you would use actual Apple Sign In

      if (Platform.OS === "ios") {
        // Try to use actual Apple Authentication if available
        try {
          // Check if Apple Auth is available
          if (typeof appleAuth !== "undefined") {
            const appleAuthRequestResponse = await appleAuth.performRequest({
              requestedOperation: appleAuth.Operation.LOGIN,
              requestedScopes: [
                appleAuth.Scope.EMAIL,
                appleAuth.Scope.FULL_NAME,
              ],
            });

            const credentialState = await appleAuth.getCredentialStateForUser(
              appleAuthRequestResponse.user
            );

            if (credentialState === appleAuth.State.AUTHORIZED) {
              const { identityToken, user: appleUser } =
                appleAuthRequestResponse;

              if (identityToken) {
                const response = await fetch(`${AUTH_SERVICE_URL}/login`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    identityToken: identityToken,
                  }),
                });

                if (response.ok) {
                  const tokenData = await response.json();

                  const userObj = {
                    id: appleUser,
                    name: tokenData.user.username || "Apple User",
                    email:
                      tokenData.user.email ||
                      `apple_user_${appleUser}@private.com`,
                    provider: "apple",
                    avatar: null,
                  };

                  await SecureStore.setItemAsync(
                    "user",
                    JSON.stringify(userObj)
                  );
                  await SecureStore.setItemAsync(
                    "accessToken",
                    tokenData.accessToken
                  );
                  await SecureStore.setItemAsync(
                    "refreshToken",
                    tokenData.refreshToken
                  );

                  setUser(userObj);
                  setAccessToken(tokenData.accessToken);
                  setRefreshToken(tokenData.refreshToken);

                  console.log(
                    "Apple sign in successful:",
                    tokenData.user.email
                  );
                  return { success: true };
                } else {
                  const error = await response.json();
                  throw new Error(error.error || "Authentication failed");
                }
              } else {
                throw new Error("No identity token received from Apple");
              }
            } else {
              throw new Error("Apple authentication was not authorized");
            }
          } else {
            throw new Error("Apple Auth not available, using fallback");
          }
        } catch (appleError) {
          console.log(
            "Apple Auth not available or failed, using demo mode:",
            appleError.message
          );
          // Fall through to demo mode
        }
      }

      // Demo/fallback authentication without backend server
      console.log("Using demo authentication for Apple Sign-In...");
      
      // Generate mock tokens for demo
      const mockTokenData = {
        accessToken: "mock_apple_access_token_" + Date.now(),
        refreshToken: "mock_apple_refresh_token_" + Date.now(),
      };

      const mockUser = {
        id: "apple_demo_" + Date.now(),
        name: "Demo Apple User",
        email: "demo@privaterelay.appleid.com",
        provider: "apple",
        avatar: null,
      };

      await SecureStore.setItemAsync("user", JSON.stringify(mockUser));
      await SecureStore.setItemAsync("accessToken", mockTokenData.accessToken);
      await SecureStore.setItemAsync("refreshToken", mockTokenData.refreshToken);

      setUser(mockUser);
      setAccessToken(mockTokenData.accessToken);
      setRefreshToken(mockTokenData.refreshToken);

      console.log("Apple sign in successful (demo mode)");
      return { success: true };
    } catch (error) {
      console.error("Apple sign in error:", error);
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      // Clear local storage (no backend call needed for demo)
      await SecureStore.deleteItemAsync("user");
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");

      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);

      console.log("User signed out successfully");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const value = {
    user,
    loading,
    accessToken,
    signInWithGoogle,
    signInWithApple,
    signOut,
    getValidAccessToken, // Export this for use in API calls
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
