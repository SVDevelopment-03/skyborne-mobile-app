declare module 'react-native-otp-auto-fill' {
  const RNOtpVerify: {
    getOtp: () => Promise<void>;
    addListener: (callback: (message: string) => void) => void;
    removeListener: () => void;
  };
  export default RNOtpVerify;
}
