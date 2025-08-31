import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";

// Conditional Apple Auth import
let appleAuth;
try {
  if (Platform.OS === "ios") {
    appleAuth =
      require("@invertase/react-native-apple-authentication").appleAuth;
  }
} catch (error) {
  console.log(
    "Apple Authentication not available, using fallback authentication"
  );
  appleAuth = undefined;
}

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

  // Function to refresh access token
  const refreshAccessToken = async () => {
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await fetch(`${AUTH_SERVICE_URL}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.accessToken);
        await SecureStore.setItemAsync("accessToken", data.accessToken);
        return data.accessToken;
      } else {
        // Refresh token is invalid, need to re-authenticate
        await signOut();
        throw new Error("Session expired. Please sign in again.");
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      await signOut();
      throw error;
    }
  };

  // Get valid access token (refresh if needed)
  const getValidAccessToken = async () => {
    if (!accessToken) {
      throw new Error("No access token available");
    }

    try {
      // Try to use current token first
      const testResponse = await fetch(`${AUTH_SERVICE_URL}/hello`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (testResponse.ok) {
        return accessToken;
      } else if (testResponse.status === 401) {
        // Token expired, try to refresh
        return await refreshAccessToken();
      } else {
        throw new Error("Authentication failed");
      }
    } catch (error) {
      console.error("Token validation error:", error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      // For demo purposes, we'll simulate Google auth
      // In production, you would use actual Google OAuth
      const mockUser = {
        id: "google_" + Date.now(),
        name: "Demo User",
        email: "demo@example.com",
        provider: "google",
        avatar: null,
      };

      // Send to backend for token generation
      const response = await fetch(`${AUTH_SERVICE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: mockUser.email,
          password: "demo_password", // In real implementation, this would be OAuth token
        }),
      });

      if (response.ok) {
        const tokenData = await response.json();

        // Store user and tokens
        await SecureStore.setItemAsync("user", JSON.stringify(mockUser));
        await SecureStore.setItemAsync("accessToken", tokenData.accessToken);
        await SecureStore.setItemAsync("refreshToken", tokenData.refreshToken);

        setUser(mockUser);
        setAccessToken(tokenData.accessToken);
        setRefreshToken(tokenData.refreshToken);

        console.log("Google sign in successful");
        return { success: true };
      } else {
        const error = await response.json();
        throw new Error(error.error || "Authentication failed");
      }
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

      // Demo/fallback authentication using hardcoded credentials
      console.log("Using demo authentication for Apple Sign-In...");
      const response = await fetch(`${AUTH_SERVICE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "jeremywongjian@outlook.com",
          password: "toddleMic1!",
        }),
      });

      if (response.ok) {
        const tokenData = await response.json();

        const mockUser = {
          id: "apple_demo_" + Date.now(),
          name: "Demo Apple User",
          email: "demo@privaterelay.appleid.com",
          provider: "apple",
          avatar: null,
        };

        await SecureStore.setItemAsync("user", JSON.stringify(mockUser));
        await SecureStore.setItemAsync("accessToken", tokenData.accessToken);
        await SecureStore.setItemAsync("refreshToken", tokenData.refreshToken);

        setUser(mockUser);
        setAccessToken(tokenData.accessToken);
        setRefreshToken(tokenData.refreshToken);

        console.log("Apple sign in successful (demo mode)");
        return { success: true };
      } else {
        const error = await response.json();
        throw new Error(error.error || "Authentication failed");
      }
    } catch (error) {
      console.error("Apple sign in error:", error);
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      // Logout on backend to invalidate refresh token
      if (refreshToken) {
        await fetch(`${AUTH_SERVICE_URL}/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        });
      }

      // Clear local storage
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
