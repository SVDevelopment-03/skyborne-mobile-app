
import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { FontFamilies, getFontFamily, FontWeights } from '../constants/fonts';

interface ThemedTextProps extends TextProps {
  weight?: keyof typeof FontWeights;
  italic?: boolean;
}

export function ThemedText(props: ThemedTextProps) {
  const { style, weight = 'regular', italic = false, ...rest } = props;

  const fontFamily = getFontFamily(weight, italic);

  return <Text style={[{ fontFamily }, styles.text, style]} {...rest} />;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: FontFamilies.SatoshiRegular, // Default font
    fontSize: 16,
    color: '#000', // Default text color
  },
});
