
export const FontFamilies = {
  SatoshiBlack: 'Satoshi-Black',
  SatoshiBold: 'Satoshi-Bold',
  SatoshiItalic: 'Satoshi-Italic',
  SatoshiLight: 'Satoshi-Light',
  SatoshiMedium: 'Satoshi-Medium',
  SatoshiRegular: 'Satoshi-Regular',
  SatoshiVariable: 'Satoshi-Variable',
};

export const FontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  bold: '700',
  black: '900',
};

// Map font weights to specific font files for a more granular control if needed
// This approach is more robust for cross-platform consistency
export const getFontFamily = (weight: keyof typeof FontWeights, isItalic = false) => {
  switch (weight) {
    case 'light':
      return isItalic ? FontFamilies.SatoshiItalic : FontFamilies.SatoshiLight;
    case 'regular':
      return isItalic ? FontFamilies.SatoshiItalic : FontFamilies.SatoshiRegular;
    case 'medium':
      return isItalic ? FontFamilies.SatoshiItalic : FontFamilies.SatoshiMedium;
    case 'bold':
      return isItalic ? FontFamilies.SatoshiItalic : FontFamilies.SatoshiBold;
    case 'black':
      return isItalic ? FontFamilies.SatoshiItalic : FontFamilies.SatoshiBlack;
    default:
      return FontFamilies.SatoshiRegular;
  }
};
