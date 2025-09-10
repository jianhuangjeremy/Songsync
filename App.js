import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';

import HomeScreen from './src/screens/HomeScreen';
import AuthScreen from './src/screens/AuthScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import MusicAnalysisScreen from './src/screens/MusicAnalysisScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { Colors } from './src/styles/Colors';


// Global unhandled promise rejection handler
const setupGlobalErrorHandlers = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // Web environment
    window.addEventListener('unhandledrejection', (event) => {
      console.warn('Unhandled promise rejection:', event.reason);
      event.preventDefault(); // Prevent the default behavior (console error)
    });
  } else {
    // React Native environment - Set up promise rejection tracking
    if (typeof global !== 'undefined') {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        const message = args[0];
        if (typeof message === 'string' && message.includes('Possible unhandled promise rejection')) {
          console.warn('Handled promise rejection:', ...args);
          return;
        }
        originalConsoleError(...args);
      };
      
      // Set up unhandled promise rejection handler for React Native
      global.HermesInternal?.setPromiseRejectionTracker?.((id, rejection) => {
        console.warn('Unhandled promise rejection (Hermes):', rejection);
      });
    }
  }
};

// Initialize error handlers
setupGlobalErrorHandlers();

const Stack = createStackNavigator();

function AppNavigator() {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Remove first-time user check - no longer needed
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[Colors.black, Colors.purple, Colors.black]}
          style={styles.loadingGradient}
        >
          <Text style={styles.loadingText}>Songbook</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor={Colors.black} />
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: 'transparent',
            },
            headerTintColor: Colors.lightGreen,
            headerTransparent: true,
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 20,
            },
          }}
        >
          {user ? (
            <>
              <Stack.Screen 
                name="Home" 
                component={HomeScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Library" 
                component={LibraryScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="MusicAnalysis" 
                component={MusicAnalysisScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Settings" 
                component={SettingsScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Subscription" 
                component={SubscriptionScreen}
                options={{ headerShown: false }}
              />
            </>
          ) : (
            <Stack.Screen 
              name="Auth" 
              component={AuthScreen}
              options={{ headerShown: false }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.lightGreen,
    textShadowColor: Colors.purple,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
});
