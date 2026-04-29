// mobile/src/config.ts
import { Platform } from 'react-native';

/**
 * Zmienna __DEV__ jest automatycznie ustawiana na true przez React Native
 * podczas pracy lokalnej (expo start). Gdy zbudujesz gotową aplikację (build),
 * zmieni się ona na false.
 */
const isDevelopment = __DEV__;

// Twój aktualny adres IP do testów lokalnych
const LOCAL_IP = '192.168.55.106'; 

export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

// Adres serwera w internecie (wpiszesz go, gdy już wrzucisz backend na serwer)
const PRODUCTION_URL = 'https://api.twoja-domena-taxi.pl';

export const API_URL = isDevelopment
  ? `http://${LOCAL_IP}:3000`
  : PRODUCTION_URL;



console.log(`[Config] Aplikacja łączy się z: ${API_URL}`);