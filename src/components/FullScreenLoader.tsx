import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const FullScreenLoader: React.FC = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#B95E82" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default FullScreenLoader;

