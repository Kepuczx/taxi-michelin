import axios from 'axios';

// 1. Tworzymy główną instancję naszego kuriera (Axios)
const api = axios.create({
  baseURL: 'http://localhost:3000', // Adres Twojego backendu
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Dodajemy "Przechwytywacz" (Interceptor)
// Ten kod odpali się AUTOMATYCZNIE przed każdym api.get, api.post itd.
api.interceptors.request.use(
  (config) => {
    // Wyciągamy naszą "opaskę VIP" z pamięci przeglądarki
    const token = localStorage.getItem('authToken');
    
    // Jeśli opaska istnieje, ubieramy ją (dodajemy do nagłówków)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;