import axios from 'axios';
import { API_URL } from '../config';

// 1. Tworzymy główną instancję naszego kuriera (Axios)
const api = axios.create({
  baseURL: API_URL, // 🔥 UŻYWAJ API_URL Z CONFIG, NIE STATYCZNEGO URL
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// 2. Dodajemy "Przechwytywacz" (Interceptor)
api.interceptors.request.use(
  (config) => {
    // Wyciągamy naszą "opaskę VIP" z pamięci przeglądarki
    const token = localStorage.getItem('authToken');
    
    // Jeśli opaska istnieje, ubieramy ją (dodajemy do nagłówków)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Dodaj nagłówek X-Changed-By dla logów
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail && config.headers) {
      config.headers['X-Changed-By'] = userEmail;
    }
    
    console.log(`📡 [API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ [API] Request error:', error);
    return Promise.reject(error);
  }
);

// Interceptor dla odpowiedzi - lepsze logowanie błędów
api.interceptors.response.use(
  (response) => {
    console.log(`✅ [API] ${response.config.url} - status: ${response.status}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`❌ [API] ${error.config?.url} - status: ${error.response.status}`, error.response.data);
    } else if (error.request) {
      console.error(`❌ [API] ${error.config?.url} - BRAK ODPOWIEDZI (CORS lub serwer nie działa)`);
    } else {
      console.error(`❌ [API] ${error.config?.url} - error:`, error.message);
    }
    return Promise.reject(error);
  }
);

export default api;