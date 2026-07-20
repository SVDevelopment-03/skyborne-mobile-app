// export const ProfileImages = {
//   ArrowIcon1: require('./icon.png'),
//   ArrowIcon2: require('./Icon2.png'),
//   SettingsIcon: require('./settingsIcon.png'),
//   ProfileImg: require('./profileImage.png'),
//   pencilIcon: require('./PencilIcon.png'),
//   sandWAtch: require('./SandWatch.png'),
//   subscriptionIcon: require('./SubscriptionIcon.png'),
//   historyIcon: require('./HistoryIcon.png'),
//   timezonIcon: require('./TimezoneIcon.png'),
//   supportIcon: require('./Support.png'),
// };

const BASE_URL = 'https://skyborne-images.s3.ap-south-1.amazonaws.com/profile';
const SVG_URL = 'https://skyborne-images.s3.ap-south-1.amazonaws.com/svgicons';
const COMMON_URL = 'https://skyborne-images.s3.ap-south-1.amazonaws.com';

export const ProfileImages = {
  ArrowIcon1: { uri: `${BASE_URL}/icon.png` },
  ArrowIcon2: { uri: `${BASE_URL}/Icon2.png` },
  SettingsIcon: { uri: `${BASE_URL}/settingsIcon.png` },
  ProfileImg: { uri: `${BASE_URL}/profileImage.png` },
  pencilIcon: { uri: `${BASE_URL}/PencilIcon.png` },
  sandWAtch: { uri: `${BASE_URL}/SandWatch.png` }, // ⚠️ ensure file exists in S3
  subscriptionIconSvg: `${SVG_URL}/Subscription.svg`,
  historyIconSvg: `${SVG_URL}/History.svg`,
  timezonIcon: { uri: `${BASE_URL}/TimezoneIcon.png` },
  supportIconSvg: `${SVG_URL}/Support.svg`,
};

export const AllItems = {
  badgeSvg: `${SVG_URL}/Achievements-profile.svg`,
  laptopSvg: `${SVG_URL}/Total Sessions-Profile.svg`,
  sandSvg: `${SVG_URL}/Total Hours-profil.svg`,
  fireSvg: `${SVG_URL}/Day Streak.svg`,
};
