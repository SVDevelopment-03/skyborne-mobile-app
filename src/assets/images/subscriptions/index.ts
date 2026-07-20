// export const SubscriptionImages = {
//   backwardIcon: require('./icon.png'),
//   videoIcon: require('./videoIcon.png'),  
//   playIcon: require('./playIcon.png'),
//   upgradeIcon: require('./upgradeplan.png'),
//   paymentIcon: require('./updatepayment.png'),
//   invoicesIcon: require('./invoices.png'),
//   rightIcon: require('./rightIcon.png'),
// };


const BASE_URL =
  'https://skyborne-images.s3.ap-south-1.amazonaws.com/subscriptions';

export const SubscriptionImages = {
  backwardIcon: { uri: `${BASE_URL}/icon.png` },
  videoIcon: { uri: `${BASE_URL}/videoIcon.png` },
  playIcon: { uri: `${BASE_URL}/playIcon.png` },
  upgradeIcon: { uri: `${BASE_URL}/upgradeplan.png` },
  paymentIcon: { uri: `${BASE_URL}/updatepayment.png` },
  invoicesIcon: { uri: `${BASE_URL}/invoices.png` },
  rightIcon: { uri: `${BASE_URL}/rightIcon.png` },
};
