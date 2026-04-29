// web/src/config.ts
const isDevelopment = import.meta.env.DEV;

// 🔥 DLA PRODUKCJI - używamy URL z Render.com
const PRODUCTION_API_URL = 'https://michelin-taxi-api.onrender.com';
const DEVELOPMENT_API_URL = 'http://localhost:3000';  // Zmień na swoje IP

export const API_URL = isDevelopment ? DEVELOPMENT_API_URL : PRODUCTION_API_URL;

// Pobierz klucz z zmiennych środowiskowych
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

console.log(`[Config] Uruchomiono w trybie: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);
console.log(`[Config] API_URL: ${API_URL}`);
console.log(`[Config] Google Maps API Key: ${GOOGLE_MAPS_API_KEY ? '✅ Ustawiony' : '❌ BRAK!'}`);