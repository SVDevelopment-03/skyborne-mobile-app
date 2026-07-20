import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFAQs } from '../../store/faqSlice'; 
import { RootState } from '../../store';
import { Images } from '../../assets/images';

interface ContactOption {
  id: number;
  title: string;
  subtitle: string;
  iconUri: string;
}

const SupportScreen = ({ navigation }: { navigation: any }) => {
  const rightArrowIcon = require('../../assets/images/Right.png');

  const dispatch = useDispatch<any>();
  const { items: faqItems, status, error } = useSelector(
    (state: RootState) => state.faq
  );

  // Fetch FAQs on mount
  useEffect(() => {
    if (faqItems.length === 0) {
      dispatch(fetchFAQs());
    }
  }, [dispatch, faqItems.length]);

  const contactOptions: ContactOption[] = [
    {
      id: 2,
      title: 'Email Support',
      subtitle: 'info@skybornedrop.com',
      iconUri: Images.emailIcon,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Support</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Get in Touch Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Get in touch</Text>
        </View>

        <View style={styles.contactContainer}>
          {contactOptions.map((option, index) => (
            <View key={option.id}>
              <TouchableOpacity style={styles.contactItem}>
                <View style={styles.contactIconContainer}>
                  <Image
                    source={{ uri: option.iconUri }}
                    style={styles.contactIcon}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.contactTextContainer}>
                  <Text style={styles.contactTitle}>{option.title}</Text>
                  <Text style={styles.contactSubtitle}>{option.subtitle}</Text>
                </View>
                <Image source={rightArrowIcon} />
              </TouchableOpacity>
              {index < contactOptions.length - 1 && (
                <View style={styles.divider} />
              )}
            </View>
          ))}
        </View>

        {/* FAQ Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Frequently asked questions</Text>
        </View>

        {status === 'loading' ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#494949" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load FAQs</Text>
          </View>
        ) : faqItems.length > 0 ? (
          <View style={styles.faqList}>
            {faqItems.map((item) => (
              <View key={item.id} style={styles.faqCard}>
                <Image
                  source={{ uri: Images.questionIcon }}
                  style={styles.faqIcon}
                  resizeMode="contain"
                />
                <View style={styles.faqContent}>
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  <Text style={styles.faqAnswer}>{item.answer}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No FAQs available</Text>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 35,
    paddingBottom: 48,
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 22,
    color: '#494949',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 24,
  },
  // Section Headers
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 26,
  },
  sectionTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 22,
    color: '#494949',
  },
  // Contact Container
  contactContainer: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 17.52,
    paddingHorizontal: 22,
    paddingVertical: 23,
    marginBottom: 40,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 76,
  },
  contactIconContainer: {
    width: 52,
    height: 52,
    backgroundColor: '#FFE8E8',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactIcon: {
    width: 34,
    height: 34,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.01,
    color: '#494949',
    marginBottom: 2,
  },
  contactSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(5, 5, 5, 0.5)',
  },
  divider: {
    height: 1,
    backgroundColor: '#494949',
    opacity: 0.1,
    marginTop: 21,
    marginBottom: 28,
  },
  // FAQ List
  faqList: {
    paddingHorizontal: 16,
    marginBottom: 48,
  },
  faqCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  faqIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
  },
  faqContent: {
    flex: 1,
  },
  faqQuestion: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    lineHeight: 15.4,
    color: '#494949',
    marginBottom: 6,
  },
  faqAnswer: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    lineHeight: 18,
    width: 277,
    color: '#050505',
  },
  // Loading / Error / Empty States
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  errorText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    color: '#B95E82',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#494949',
  },
  bottomSpacer: {
    height: 20,
  },
});

export default SupportScreen;