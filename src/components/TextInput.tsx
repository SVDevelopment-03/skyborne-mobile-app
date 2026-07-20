import React from 'react';
import { TextInput as RNInput, StyleSheet, View, TextInputProps } from 'react-native';

export default function TextInput(props: TextInputProps & { value?: string }) {
  const { style, placeholderTextColor, ...restProps } = props;

  return (
    <View style={styles.wrapper}>
      <RNInput
        style={[styles.input, style]}
        placeholderTextColor={placeholderTextColor ?? '#999'}
        {...restProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    backgroundColor: '#FFFFFF',
    color: '#1A1A1A',
  },
});
