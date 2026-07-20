import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { StyleSheet, View } from 'react-native';

interface GradientBackgroundProps {
  children: React.ReactNode;
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({ children }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          '#FFF7DD',
          'rgba(255,207,189,0.08)',
          'rgba(255,207,189,0)',
          'rgba(255,207,189,0.61)',
          '#FFFFFF',
        ]}
        locations={[0.0833, 0.4026, 0.5255, 0.783, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});

export default GradientBackground;
