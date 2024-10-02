import Geolocation from '@react-native-community/geolocation';

export const useLocation = async () => {
  const locationPromise = new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        resolve({latitude, longitude});
      },
      error => {
        reject(new Error(error.message));
      },
      {enableHighAccuracy: false, timeout: 15000, maximumAge: 10000},
    );
  });

  try {
    const location = await locationPromise;
    return location; 
  } catch (error) {
    throw new Error(error.message);
  }
};
