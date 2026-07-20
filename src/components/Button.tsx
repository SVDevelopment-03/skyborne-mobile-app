import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?:boolean;
}

export default function Button({ title, onPress, variant, style, textStyle ,disabled}: ButtonProps) {
  const buttonVariantStyle: ViewStyle = variant === 'ghost' ? styles.ghost : styles.primary;
  const textVariantStyle: TextStyle = variant === 'ghost' ? styles.ghostText : styles.text;

  return (
    <TouchableOpacity activeOpacity={0.85} style={[styles.button, buttonVariantStyle, style]} onPress={onPress}>
      <Text style={[textVariantStyle, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28, // Default for pill shape, can be overridden
    alignItems: 'center',
    justifyContent: 'center',
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3, // For Android shadow
  },
  primary: {
    backgroundColor: '#B5647E', // Muted rose / mauve
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#B5647E',
  },
  text: {
    color: '#fff',
    fontWeight: '600', // Semi-bold
    fontSize: 16,
  },
  ghostText: {
    color: '#B5647E',
    fontWeight: '600',
    fontSize: 16,
  },
});
