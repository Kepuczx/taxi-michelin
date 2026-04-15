// web/src/config.ts
const isDevelopment = import.meta.env.DEV;

// 🔥 ZMIEŃ NA SWOJE IP (z ipconfig)
const LOCAL_IP = '192.168.0.13';

// Pobierz klucz z zmiennych środowiskowych
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCwhS6Tsld4HpVc7yhBKFCrI6b8YsluGsI';

const PRODUCTION_URL = 'https://api.twoja-domena-taxi.pl';

export const API_URL = isDevelopment
  ? `http://${LOCAL_IP}:3000`
  : PRODUCTION_URL;

console.log(`[Config] API_URL: ${API_URL}`);
console.log(`[Config] Google Maps API Key: ${GOOGLE_MAPS_API_KEY ? '✅ Ustawiony' : '❌ BRAK!'}`);