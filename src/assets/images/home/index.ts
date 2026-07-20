// export const HomeImages = {
//   hamburgerMenu: require('./Vector.png'),
//   searchIcon: require('./mynaui_search.png'),
//   profileImage: require('./Ellipse 8.png'),
//   yogaFlow:require('./yoga-flow.png'),
//   getStartedImage: require('./pexels-maksgelatin-4775198.png'),
// };


const BASE_URL =
  'https://skyborne-images.s3.ap-south-1.amazonaws.com/home';

export const HomeImages = {
  hamburgerMenu: { uri: `${BASE_URL}/Vector.png` },
  searchIcon: { uri: `${BASE_URL}/mynaui_search.png` },
  profileImage: { uri: `${BASE_URL}/Ellipse 8.png` },
  yogaFlow: { uri: `${BASE_URL}/yoga-flow.png` },
  getStartedImage: {
    uri: `${BASE_URL}/pexels-maksgelatin-4775198.png`,
  },
};
