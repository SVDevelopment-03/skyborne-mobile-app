// export const ScheduleImages = {
//   searchIcon: require('./Icon.png'),
//   BlackGradient: require('./BlackGradient.png'),
//   PlanImage: require('./ImageWithFallback.png'),
//   ArrowImage: require('./arrow.png'),
//   ArrowImage2: require('./arrow2.png'),
//   ArrowImage3: require('./arrow3.png'),
//   ArrowImage4: require('./arrow4.png'),
//   SessionImage: require('./SessionImage.png'),
// };

const BASE_URL =
  'https://skyborne-images.s3.ap-south-1.amazonaws.com/schedule';

export const ScheduleImages = {
  searchIcon: { uri: `${BASE_URL}/Icon.png` },
  BlackGradient: { uri: `${BASE_URL}/BlackGradient.png` },
  PlanImage: { uri: `${BASE_URL}/ImageWithFallback.png` },
  ArrowImage: { uri: `${BASE_URL}/arrow.png` },
  ArrowImage2: { uri: `${BASE_URL}/arrow2.png` },
  ArrowImage3: { uri: `${BASE_URL}/arrow3.png` },
  ArrowImage4: { uri: `${BASE_URL}/arrow4.png` },
  SessionImage: { uri: `${BASE_URL}/SessionImage.png` },
};
