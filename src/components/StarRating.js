import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { Colors } from '../styles/Colors';
import { GlassStyles } from '../styles/GlassStyles';

export default function StarRating({ 
  onRatingChange, 
  initialRating = 0,
  songTitle,
  maxStars = 5,
  showFeedbackText = true 
}) {
  const [rating, setRating] = useState(initialRating);
  const [hasRated, setHasRated] = useState(initialRating > 0);
  const [scaleValues] = useState(
    Array(maxStars).fill(0).map(() => new Animated.Value(1))
  );

  const handleStarPress = (starIndex) => {
    const newRating = starIndex + 1;
    setRating(newRating);
    setHasRated(true);
    
    // Animate the pressed star
    Animated.sequence([
      Animated.timing(scaleValues[starIndex], {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValues[starIndex], {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Call the callback with the new rating
    if (onRatingChange) {
      onRatingChange(newRating, songTitle);
    }
  };

  const getFeedbackText = () => {
    switch (rating) {
      case 1: return 'Poor analysis results';
      case 2: return 'Below expectations';
      case 3: return 'Satisfactory results';
      case 4: return 'Good analysis quality';
      case 5: return 'Excellent results!';
      default: return 'Rate the analysis quality';
    }
  };

  const getFeedbackColor = () => {
    switch (rating) {
      case 1:
      case 2: return '#ef4444'; // Red
      case 3: return '#f59e0b'; // Orange
      case 4:
      case 5: return Colors.lightGreen;
      default: return Colors.lightGray;
    }
  };

  return (
    <BlurView intensity={15} style={[styles.container, GlassStyles.glassCard]}>
      <View style={styles.header}>
        <Text style={styles.title}>Rate Analysis Quality</Text>
        {hasRated && (
          <View style={styles.thanksContainer}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.lightGreen} />
            <Text style={styles.thanksText}>Thanks for your feedback!</Text>
          </View>
        )}
      </View>

      <View style={styles.starsContainer}>
        {Array(maxStars).fill(0).map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleStarPress(index)}
            activeOpacity={0.7}
            style={styles.starButton}
          >
            <Animated.View style={{ transform: [{ scale: scaleValues[index] }] }}>
              <Ionicons
                name={index < rating ? 'star' : 'star-outline'}
                size={28}
                color={index < rating ? '#fbbf24' : 'rgba(255, 255, 255, 0.4)'}
                style={styles.star}
              />
            </Animated.View>
          </TouchableOpacity>
        ))}
      </View>

      {showFeedbackText && (
        <Text style={[styles.feedbackText, { color: getFeedbackColor() }]}>
          {getFeedbackText()}
        </Text>
      )}

      {hasRated && (
        <Text style={styles.subtitleText}>
          Your feedback helps us improve the music analysis quality
        </Text>
      )}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  thanksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  thanksText: {
    fontSize: 12,
    color: Colors.lightGreen,
    marginLeft: 6,
    fontWeight: '500',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
    marginHorizontal: 2,
  },
  star: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 11,
    color: Colors.lightGray,
    textAlign: 'center',
    opacity: 0.8,
    fontStyle: 'italic',
  },
});
