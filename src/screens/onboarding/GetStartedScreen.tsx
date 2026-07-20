import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientBackground from '../../components/GradientBackground';
import Button from '../../components/Button';
import { GetStartedImages } from '../../assets/images/getstarted';

const FRAME_DESIGN_WIDTH = 373;
const FRAME_DESIGN_HEIGHT = 320;
const HORIZONTAL_PADDING = 18;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const GetStartedScreen = ({ navigation }: { navigation: any }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const availableWidth = Math.max(screenWidth - HORIZONTAL_PADDING * 2, 280);
  const frameScaleByWidth = Math.min(1, availableWidth / FRAME_DESIGN_WIDTH);
  const contentHeight = Math.max(screenHeight - insets.top - insets.bottom, 560);
  const containerTopPadding = clamp(contentHeight * 0.08, 22, 60);

  const titleTopMargin = contentHeight < 700 ? 12 : 24;
  const framesTopMargin = contentHeight < 700 ? 12 : 20;
  const descriptionTopMargin = contentHeight < 700 ? 16 : 28;
  const buttonTopMargin = contentHeight < 700 ? 14 : 18;

  const reservedHeight =
    titleTopMargin +
    72 +
    framesTopMargin +
    descriptionTopMargin +
    72 +
    buttonTopMargin +
    54.3 +
    18;
  const frameScaleByHeight = (contentHeight - reservedHeight) / FRAME_DESIGN_HEIGHT;

  const frameScale = clamp(Math.min(frameScaleByWidth, frameScaleByHeight), 0.58, 1);
  const scaledFramesHeight = FRAME_DESIGN_HEIGHT * frameScale;

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <View
          style={[
            styles.container,
            { paddingTop: containerTopPadding, paddingBottom: 16 + insets.bottom },
          ]}
        >
            <Text style={[styles.title, { marginTop: titleTopMargin }]}>Begin Your Skyborne Wellness Journey</Text>

            <View style={[styles.framesWrapper, { height: scaledFramesHeight, marginTop: framesTopMargin }]}>
              <View style={[styles.framesContainer, { transform: [{ scale: frameScale }] }]}>
                <Image
                  source={GetStartedImages.frame9}
                  style={[styles.frameBase, { width: 45, height: 45, top: 249, left: 12, opacity: 0.5, borderRadius: 500 }]}
                />
                <Image
                  source={GetStartedImages.frame7}
                  style={[styles.frameBase, { width: 60, height: 60, top: 170, left: 44, opacity: 1, borderRadius: 500 }]}
                />
                <Image
                  source={GetStartedImages.frame6}
                  style={[styles.frameBase, { width: 60, height: 60, top: 87, left: 109, opacity: 0.5, borderRadius: 500 }]}
                />
                <Image
                  source={GetStartedImages.frame5}
                  style={[styles.frameBase, { width: 60, height: 60, top: 90, left: 208, opacity: 0.5, borderRadius: 500 }]}
                />
                <Image
                  source={GetStartedImages.frame1}
                  style={[styles.frameBase, { width: 86, height: 86, top: 153, left: 144, opacity: 1, borderRadius: 500 }]}
                />
                <Image
                  source={GetStartedImages.frame8}
                  style={[styles.frameBase, { width: 60, height: 60, top: 166, left: 256, opacity: 1, borderRadius: 500 }]}
                />
                <Image
                  source={GetStartedImages.frame2}
                  style={[styles.frameBase, { width: 70, height: 70, top: 244, left: 104, opacity: 1, borderRadius: 500 }]}
                />
                <Image
                  source={GetStartedImages.frame3}
                  style={[styles.frameBase, { width: 61, height: 61, top: 239, left: 218, opacity: 1, borderRadius: 500 }]}
                />
                <Image
                  source={GetStartedImages.frame4}
                  style={[styles.frameBase, { width: 53, height: 53, top: 229, left: 320, opacity: 0.5, borderRadius: 500 }]}
                />
              </View>
            </View>

            <Text style={[styles.description, { marginTop: descriptionTopMargin }]}>
              Skyborne Drop merges movement, nutrition, and mindfulness daily.
              {'\n'}
              Answer questions to craft a plan that suits your energy and schedule.
            </Text>

            <View style={styles.spacer} />
            <View style={{ width: '100%', marginTop: buttonTopMargin }}>
              <Button
                title="Get Started"
                onPress={() => navigation.navigate('Home')}
                style={styles.getStartedButton}
                textStyle={styles.getStartedButtonText}
              />
            </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: HORIZONTAL_PADDING,
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
    minHeight: 8,
  },
  title: {
    marginHorizontal: 8,
    width: '100%',
    maxWidth: 340,
    fontFamily: 'Satoshi-Bold',
    fontSize: 29,
    lineHeight: 34,
    textAlign: 'center',
    color: '#494949',
  },
  description: {
    width: '100%',
    maxWidth: 348,
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: '#050505',
  },
  getStartedButton: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 346,
    height: 54.3,
    borderRadius: 40,
    backgroundColor: '#B95E82',
    opacity: 1,
    alignSelf: 'center',
  },
  getStartedButtonText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  framesWrapper: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  framesContainer: {
    width: FRAME_DESIGN_WIDTH,
    height: FRAME_DESIGN_HEIGHT,
    position: 'relative',
  },
  frameBase: {
    position: 'absolute',
  },
});

export default GetStartedScreen;
