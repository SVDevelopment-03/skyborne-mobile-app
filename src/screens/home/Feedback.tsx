import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Star
} from 'lucide-react-native';
import { Images } from '../../assets/images';
import { useFeedbackViewModel } from '../../viewmodels/useFeedbackViewModel';
import Toast from 'react-native-toast-message';
import { useEffect } from 'react';

interface FeelingOption {
  id: number;
  label: string;
  icon: string;
}

const FeedbackScreen = ({ navigation }: { navigation: any }) => {
  const insets = useSafeAreaInsets();
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [selectedFeeling, setSelectedFeeling] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');

  const { submitFeedback, isSubmitting, isSuccess, error, clearFeedbackState } = useFeedbackViewModel();

  const feelingOptions: FeelingOption[] = [
    {
      id: 1,
      label: 'Energized',
      icon: Images.energizedIcon,
    },
    {
      id: 2,
      label: 'Relaxed',
      icon: Images.relaxedIcon,
    },
    {
      id: 3,
      label: 'Strong',
      icon: Images.strongIcon,
    },
    {
      id: 4,
      label: 'Tired',
      icon: Images.tiredIcon,
    },
  ];

  const handleCommentChange = (id: number) => {
  const feelingLabel = feelingOptions.find(f => f.id === selectedFeeling)?.label || '';
  setSelectedFeeling(id);
  // Pre-fill comment with feeling label
  setComment(feelingLabel ? `I feel ${feelingLabel} after the class.` : '');



  }

  const handleSubmitFeedback = async () => {
    // Validation
    if (selectedRating === 0) {
      Toast.show({
        type: 'error',
        text1: 'Rating required',
        text2: 'Please select a rating',
      });
      return;
    }

    if (!selectedFeeling) {
      Toast.show({
        type: 'error',
        text1: 'Feeling required',
        text2: 'Please select how you feel',
      });
      return;
    }

    // Validate comment length
    if (comment.trim().length < 10) {
      Toast.show({
        type: 'error',
        text1: 'Comment too short',
        text2: 'Please write at least 10 characters',
      });
      return;
    }

    if (comment.trim().length > 500) {
      Toast.show({
        type: 'error',
        text1: 'Comment too long',
        text2: 'Please keep your comment under 500 characters',
      });
      return;
    }

    // Map feeling to feeling label
    const feelingLabel = feelingOptions.find(f => f.id === selectedFeeling)?.label || '';

    try {
      await submitFeedback({
        rating: selectedRating,
        comment: comment.trim(), // Send only the comment text (which already has the feeling text)
        feeling: feelingLabel, // Send feeling separately
      });
    } catch (err) {
      console.error('Submit feedback error:', err);
    }
  };

  const handleSkip = () => {
    navigation.goBack();
  };

  useEffect(() => {
    if (isSuccess) {
      Toast.show({
        type: 'success',
        text1: 'Thank you!',
        text2: 'Your feedback has been submitted successfully',
      });

      clearFeedbackState();
      navigation.goBack();
    }
  }, [isSuccess]);

  useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Submission failed',
        text2: typeof error === 'string' ? error : 'Failed to submit feedback',
      });

      clearFeedbackState();
    }
  }, [error]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 120 + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={handleSkip}>
              <Image source={{uri:Images.crossIcon}} style={styles.closeIcon} />
            </TouchableOpacity>

            {/* Success Animation */}
            <Image
              // source={Images.successAnimation}
              style={styles.successAnimation}
              resizeMode="contain"
            />

            {/* Title */}
            <Text style={styles.title}>Great Job!</Text>

            {/* Description */}
            <Text style={styles.description}>
              You've completed your session. Keep up the amazing work
            </Text>

            {/* Rating Card */}
            <View style={styles.ratingCard}>
              <Text style={styles.ratingQuestion}>How was the class?</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    style={styles.starButton}
                    onPress={() => setSelectedRating(star)}
                  >
                    <Star
                      size={27}
                      color={selectedRating >= star ? '#F5A700' : '#767676'}
                      fill={selectedRating >= star ? '#F5A700' : 'transparent'}
                      strokeWidth={2}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Feeling Question */}
            <Text style={styles.feelingQuestion}>How do you feel after class</Text>

            {/* Feeling Options */}
            <View style={styles.feelingGrid}>
              {feelingOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.feelingCard,
                    selectedFeeling === option.id && styles.feelingCardSelected,
                  ]}
                  onPress={() => handleCommentChange(option.id)}
                >
                  <Image source={{ uri: option.icon }} style={styles.feelingIcon} resizeMode="contain" />
                  <Text style={styles.feelingLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Comment Section */}
            <View style={styles.commentSection}>
              <Text style={styles.commentLabel}>
                Share your experience <Text style={styles.optional}></Text>
              </Text>
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Tell us more about your experience..."
                  placeholderTextColor="#999999"
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  value={comment}
                  onChangeText={setComment}
                  textAlignVertical="top"
                />
                <Text style={styles.characterCount}>
                  {comment.length}/500
                </Text>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]} 
              onPress={handleSubmitFeedback}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Feedback</Text>
              )}
            </TouchableOpacity>

            {/* Skip Button */}
            <TouchableOpacity
              style={[styles.skipButton, { marginBottom: 20 + insets.bottom }]}
              onPress={handleSkip}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  // Close Button
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeIcon: {
    width: 24,
    height: 24,
  },
  // Success Animation
  successAnimation: {
    width: 150,
    height: 150,
    marginTop: 30,
    marginBottom: 16,
  },
  // Title and Description
  title: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 25,
    lineHeight: 28,
    color: '#494949',
    textAlign: 'center',
    marginBottom: 9,
  },
  description: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    lineHeight: 19,
    color: 'rgba(5, 5, 5, 0.8)',
    textAlign: 'center',
    width: 267,
    marginBottom: 30,
  },
  // Rating Card
  ratingCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FEF0C5',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  ratingQuestion: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    lineHeight: 23,
    color: '#494949',
    textAlign: 'center',
    marginBottom: 15,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    width: 32,
    height: 33,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Feeling Section
  feelingQuestion: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    lineHeight: 23,
    color: '#494949',
    textAlign: 'center',
    marginBottom: 16,
  },
  feelingGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 340,
    paddingHorizontal: 0,
    marginBottom: 30,
  },
  feelingCard: {
    width: 79,
    height: 79,
    backgroundColor: '#FFE8E8',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  feelingCardSelected: {
    backgroundColor: '#FFD4D4',
    borderWidth: 2,
    borderColor: '#B95E82',
  },
  feelingIcon: {
    width: 24,
    height: 24,
    marginBottom: 6,
  },
  feelingLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(5, 5, 5, 0.8)',
    textAlign: 'center',
  },
  // Comment Section
  commentSection: {
    width: '100%',
    maxWidth: 346,
    marginBottom: 24,
  },
  commentLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 15,
    lineHeight: 20,
    color: '#494949',
    marginBottom: 10,
  },
  optional: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#767676',
  },
  commentInputContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECECEC',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  commentInput: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#494949',
    minHeight: 100,
    maxHeight: 120,
  },
  characterCount: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 6,
  },
  // Submit Button
  submitButton: {
    width: '100%',
    maxWidth: 346,
    height: 54,
    backgroundColor: '#B95E82',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    lineHeight: 22,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  // Skip Button
  skipButton: {
    paddingVertical: 12,
    marginBottom: 20,
  },
  skipText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    lineHeight: 22,
    color: '#B95E82',
    textAlign: 'center',
  },
});

export default FeedbackScreen;