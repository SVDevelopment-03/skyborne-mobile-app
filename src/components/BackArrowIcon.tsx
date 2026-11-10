import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

// Vector back arrow used in screen headers. Replaces the PNG arrows loaded
// from S3, which looked blurry when scaled.
const BackArrowIcon = ({
  size = 22,
  color = '#494949',
  style,
}: {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) => <ArrowLeft size={size} color={color} strokeWidth={2} style={style} />;

export default BackArrowIcon;
