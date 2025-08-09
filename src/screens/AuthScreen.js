import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { Colors } from '../styles/Colors';
import { GlassStyles } from '../styles/GlassStyles';

const { width, height } = Dimensions.get('window');

export default function AuthScreen() {
  const { signInWithGoogle, signInWithApple } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        Alert.alert('Error', 'Failed to sign in with Google');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      Alert.alert('Error', 'Failed to sign in with Google');
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const result = await signInWithApple();
      if (!result.success) {
        Alert.alert('Error', 'Failed to sign in with Apple');
      }
    } catch (error) {
      console.error('Apple sign in error:', error);
      Alert.alert('Error', 'Failed to sign in with Apple');
    }
  };

  return (
    <LinearGradient
      colors={[Colors.black, Colors.darkPurple, Colors.black]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Animated background elements */}
        <View style={styles.backgroundElements}>
          <View style={[styles.floatingElement, styles.element1]} />
          <View style={[styles.floatingElement, styles.element2]} />
          <View style={[styles.floatingElement, styles.element3]} />
        </View>

        <View style={styles.content}>
          {/* Logo and Title */}
          <View style={styles.header}>
            <View style={[styles.logoContainer, GlassStyles.glowingBorder]}>
              <Ionicons name="musical-notes" size={60} color={Colors.lightGreen} />
            </View>
            <Text style={styles.title}>Songbook</Text>
            <Text style={styles.subtitle}>
              Identify music playing in your environment
            </Text>
          </View>

          {/* Authentication Options */}
          <View style={styles.authContainer}>
            <BlurView intensity={20} style={[styles.authCard, GlassStyles.glassContainer]}>
              <Text style={styles.authTitle}>Get Started</Text>
              <Text style={styles.authSubtitle}>
                Sign in to save your music discoveries
              </Text>

              <TouchableOpacity
                style={[styles.authButton, styles.googleButton]}
                onPress={handleGoogleSignIn}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-google" size={24} color={Colors.white} />
                <Text style={styles.authButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.authButton, styles.appleButton]}
                onPress={handleAppleSignIn}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-apple" size={24} color={Colors.white} />
                <Text style={styles.authButtonText}>Continue with Apple</Text>
              </TouchableOpacity>
            </BlurView>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  backgroundElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  floatingElement: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.1,
  },
  element1: {
    width: 200,
    height: 200,
    backgroundColor: Colors.lightGreen,
    top: height * 0.1,
    right: -50,
  },
  element2: {
    width: 150,
    height: 150,
    backgroundColor: Colors.purple,
    top: height * 0.6,
    left: -30,
  },
  element3: {
    width: 100,
    height: 100,
    backgroundColor: Colors.lightGreen,
    top: height * 0.3,
    left: width * 0.7,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: height * 0.15,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: Colors.purple,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.lightGray,
    textAlign: 'center',
    opacity: 0.8,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 40,
  },
  authCard: {
    padding: 32,
    margin: 16,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: Colors.lightGray,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  googleButton: {
    backgroundColor: 'rgba(219, 68, 55, 0.2)',
    borderColor: 'rgba(219, 68, 55, 0.3)',
  },
  appleButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  authButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  footer: {
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 16,
  },
});
