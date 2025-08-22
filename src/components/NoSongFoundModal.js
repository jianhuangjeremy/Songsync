import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../styles/Colors';
import { GlassStyles } from '../styles/GlassStyles';

const { width, height } = Dimensions.get('window');

export default function NoSongFoundModal({ 
  visible, 
  onTryAgain, 
  onGotIt,
  retryCount = 0,
  maxRetries = 2,
  canRetry = true
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.8)', 'rgba(75, 0, 130, 0.6)', 'rgba(0, 0, 0, 0.8)']}
          style={styles.gradient}
        >
          <BlurView intensity={20} style={[styles.modal, GlassStyles.glassContainer]}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconBackground}>
                <Ionicons 
                  name="musical-note-outline" 
                  size={48} 
                  color={Colors.lightGreen} 
                />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>
              {retryCount === 0 ? "Music Not Recognized" : `Attempt ${retryCount + 1} Failed`}
            </Text>

            {/* Description */}
            <Text style={styles.description}>
              {retryCount === 0 
                ? "We couldn't identify the music playing. This could be due to background noise, low volume, or the song not being in our database."
                : canRetry
                  ? `Still having trouble identifying the music. You have ${maxRetries - retryCount} more attempt${maxRetries - retryCount === 1 ? '' : 's'} remaining.`
                  : "We've tried multiple times but couldn't identify this music. This helps us improve our recognition system. Please try with a different song."
              }
            </Text>

            {/* Retry Counter */}
            {retryCount > 0 && (
              <View style={styles.retryCounter}>
                <Text style={styles.retryCounterText}>
                  Attempt {retryCount + 1} of {maxRetries + 1}
                </Text>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {canRetry ? (
                <TouchableOpacity
                  style={[styles.button, styles.tryAgainButton]}
                  onPress={onTryAgain}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[Colors.lightGreen, '#059669']}
                    style={styles.buttonGradient}
                  >
                    <Ionicons name="refresh" size={20} color={Colors.white} />
                    <Text style={styles.tryAgainButtonText}>
                      {retryCount === 0 ? "Try Again" : "Retry"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.giveUpButton]}
                  onPress={onGotIt}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[Colors.purple, '#7C3AED']}
                    style={styles.buttonGradient}
                  >
                    <Ionicons name="musical-note-outline" size={20} color={Colors.white} />
                    <Text style={styles.giveUpButtonText}>Try Different Song</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.button, styles.gotItButton]}
                onPress={onGotIt}
                activeOpacity={0.8}
              >
                <BlurView intensity={10} style={styles.gotItButtonBlur}>
                  <Text style={styles.gotItButtonText}>
                    {canRetry ? "Cancel" : "Got It"}
                  </Text>
                </BlurView>
              </TouchableOpacity>
            </View>

            {/* Tips */}
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>💡 Tips for better recognition:</Text>
              <Text style={styles.tip}>• Move closer to the audio source</Text>
              <Text style={styles.tip}>• Reduce background noise</Text>
              <Text style={styles.tip}>• Ensure the music is playing clearly</Text>
            </View>
          </BlurView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modal: {
    width: width * 0.85,
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: Colors.lightGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    opacity: 0.9,
  },
  retryCounter: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  retryCounterText: {
    fontSize: 14,
    color: Colors.purple,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  button: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  tryAgainButton: {
    shadowColor: Colors.lightGreen,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tryAgainButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  giveUpButton: {
    shadowColor: Colors.purple,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  giveUpButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  gotItButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  gotItButtonBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  gotItButtonText: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.white,
    opacity: 0.9,
  },
  tipsContainer: {
    width: '100%',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.lightGreen,
    marginBottom: 8,
  },
  tip: {
    fontSize: 13,
    color: Colors.lightGray,
    marginBottom: 4,
    opacity: 0.8,
  },
});
