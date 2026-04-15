import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import axios from 'axios';
import { API_URL, GOOGLE_MAPS_API_KEY } from '../config';
import '../styles/ActiveTripPageUser.css';

const libraries: ("places")[] = ["places"];

const ActiveTripPageUser = () => {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState({ address: '', coords: { lat: 0, lng: 0 } });
  const [destination, setDestination] = useState({ address: '', coords: { lat: 0, lng: 0 } });
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [tripStatus, setTripStatus] = useState<string>('pending');
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [firstName, setFirstName] = useState(() => {
    const fullName = localStorage.getItem('userName');
    return fullName ? fullName.split(' ')[0] : 'Pracownik';
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tripId, setTripId] = useState<number | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapRetryCount, setMapRetryCount] = useState(0);
  const [mapLoadingTimeout, setMapLoadingTimeout] = useState<NodeJS.Timeout | null>(null);

  const mapRef = useRef<google.maps.Map | null>(null);

  // 🔥 RESET ŁADOWANIA MAPY - PRÓBA PONOWNEGO ZAŁADOWANIA
  const resetMapLoading = () => {
    if (mapLoadingTimeout) clearTimeout(mapLoadingTimeout);
    setMapsLoaded(false);
    setMapError(false);
    
    if (mapRetryCount < 3) {
      console.log(`🔄 Próba ponownego załadowania mapy (${mapRetryCount + 1}/3)...`);
      setMapRetryCount(prev => prev + 1);
      
      // Ustaw timeout na ponowne sprawdzenie
      const timeout = setTimeout(() => {
        if (!mapsLoaded && !mapError) {
          console.log('⏰ Mapy nie załadowały się w czasie, resetuję...');
          resetMapLoading();
        }
      }, 3000);
      setMapLoadingTimeout(timeout);
    } else {
      console.log('❌ Mapy nie załadowały się po 3 próbach');
      setMapError(true);
    }
  };

  // Czyść timeout przy unmount
  useEffect(() => {
    return () => {
      if (mapLoadingTimeout) clearTimeout(mapLoadingTimeout);
    };
  }, [mapLoadingTimeout]);

  // 🔥 POBIERZ AKTYWNY KURS
  useEffect(() => {
    const fetchActiveTrip = async () => {
      const token = localStorage.getItem('authToken');
      const clientId = localStorage.getItem('userId');
      
      console.log('🔍 Sprawdzam aktywny kurs, token:', !!token, 'clientId:', clientId);
      
      if (!token || !clientId) {
        console.log('❌ Brak tokenu lub clientId, przekierowanie do /homeUser');
        navigate('/homeUser');
        return;
      }
      
      try {
        const response = await axios.get(`${API_URL}/trips/client/${clientId}/active`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('📡 Odpowiedź z /active:', response.data);
        
        if (response.data && response.data.id) {
          console.log('✅ Znaleziono aktywny kurs ID:', response.data.id);
          setTripId(response.data.id);
          setTripStatus(response.data.status);
          
          const pickupCoords = {
            lat: parseFloat(response.data.pickupLat),
            lng: parseFloat(response.data.pickupLng)
          };
          const dropoffCoords = {
            lat: parseFloat(response.data.dropoffLat),
            lng: parseFloat(response.data.dropoffLng)
          };
          
          setPickup({
            address: response.data.pickupAddress || 'Adres odbioru',
            coords: pickupCoords
          });
          setDestination({
            address: response.data.dropoffAddress || 'Adres docelowy',
            coords: dropoffCoords
          });
          setDataLoaded(true);
        } else {
          console.log('❌ Brak aktywnego kursu, przekierowanie do /homeUser');
          navigate('/homeUser');
          return;
        }
      } catch (error: any) {
        console.error('❌ Błąd pobierania kursu:', error.response?.status, error.response?.data);
        navigate('/homeUser');
        return;
      } finally {
        setLoading(false);
      }
    };
    
    fetchActiveTrip();
  }, [navigate]);

  // 🔥 OBLICZANIE TRASY GDY MAPY SĄ GOTOWE
  useEffect(() => {
    if (mapsLoaded && dataLoaded && pickup.coords.lat !== 0 && destination.coords.lat !== 0) {
      console.log('🗺️ Obliczam trasę...');
      
      // Sprawdź czy DirectionsService istnieje
      if (!window.google || !window.google.maps || !window.google.maps.DirectionsService) {
        console.error('❌ DirectionsService niedostępny, próbuję ponownie za chwilę...');
        setTimeout(() => {
          if (mapsLoaded) {
            setMapsLoaded(false);
            setTimeout(() => setMapsLoaded(true), 100);
          }
        }, 1000);
        return;
      }
      
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: pickup.coords,
          destination: destination.coords,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK' && result) {
            console.log('✅ Trasa obliczona');
            setDirections(result);
            setTimeout(() => {
              if (mapRef.current && result.routes[0].bounds) {
                mapRef.current.fitBounds(result.routes[0].bounds);
              }
            }, 100);
          } else {
            console.error('❌ Błąd obliczania trasy:', status);
          }
        }
      );
    }
  }, [mapsLoaded, dataLoaded, pickup.coords, destination.coords]);

  const getStatusText = () => {
    switch (tripStatus) {
      case 'pending': return '⏳ Oczekiwanie na kierowcę...';
      case 'assigned': return '🚗 Kierowca w drodze po Ciebie';
      case 'in_progress': return '🚖 Kurs w trakcie';
      case 'completed': return '✅ Kurs zakończony';
      default: return '📋 Status: ' + tripStatus;
    }
  };

  const getStatusBadgeClass = () => {
    switch (tripStatus) {
      case 'pending': return 'pending';
      case 'assigned': return 'assigned';
      case 'in_progress': return 'in_progress';
      case 'completed': return 'completed';
      default: return '';
    }
  };

  const handleCancelTrip = async () => {
    if (!tripId) return;
    
    if (window.confirm('Czy na pewno chcesz anulować kurs?')) {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const userId = localStorage.getItem('userId');
        
        const response = await axios.patch(
          `${API_URL}/trips/${tripId}/cancel`,
          { 
            reason: 'Anulowane przez klienta',
            userId: userId ? parseInt(userId) : null
          },
          { 
            headers: { Authorization: `Bearer ${token}` } 
          }
        );
        
        if (response.status === 200) {
          alert('Kurs został anulowany pomyślnie');
          navigate('/homeUser');
        }
      } catch (error: any) {
        console.error('Błąd anulowania:', error);
        const errorMsg = error.response?.data?.message || 'Nie udało się anulować kursu';
        alert(errorMsg);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = () => {
    if (window.confirm('Czy na pewno chcesz się wylogować?')) {
      localStorage.clear();
      navigate('/');
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // 🔥 PRZYCISK PONOWNEGO ŁADOWANIA MAPY
  const handleRetryMap = () => {
    setMapError(false);
    setMapRetryCount(0);
    setMapsLoaded(false);
    resetMapLoading();
  };

  if (loading) {
    return (
      <div className="user-page-wrapper">
        <header className="user-header">
          <div className="user-logo"><span className="user-logo-text">MICHELIN</span></div>
          <div className="user-header-actions">
            <span className="welcome-text">Witaj, {firstName}!</span>
            <button className="user-menu-btn" onClick={toggleMenu}>☰</button>
          </div>
        </header>
        <div className="user-main-content loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Ładowanie kursu...</p>
        </div>
      </div>
    );
  }

  if (!dataLoaded) {
    return (
      <div className="user-page-wrapper">
        <header className="user-header">
          <div className="user-logo"><span className="user-logo-text">MICHELIN</span></div>
          <div className="user-header-actions">
            <span className="welcome-text">Witaj, {firstName}!</span>
            <button className="user-menu-btn" onClick={toggleMenu}>☰</button>
          </div>
        </header>
        <div className="user-main-content loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Przygotowywanie danych...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-page-wrapper">
      <header className="user-header">
        <div className="user-logo">
          <span className="user-logo-text">MICHELIN</span>
        </div>
        <div className="user-header-actions">
          <span className="welcome-text">Witaj, {firstName}!</span>
          <button className="user-menu-btn" onClick={toggleMenu}>☰</button>
        </div>
      </header>

      <div className={`user-side-menu ${isMenuOpen ? 'open' : ''}`}>
        <button className="close-menu-btn" onClick={toggleMenu}>✕ Zamknij</button>
        <div className="user-menu-header">Twój Profil</div>
        <button className="user-menu-item" onClick={() => navigate('/homeUser')}>Nowe zamówienie</button>
        <div className="user-menu-bottom">
          <button className="user-menu-item logout-text" onClick={handleLogout}>Wyloguj się</button>
        </div>
      </div>

      {/* GŁÓWNA ZAWARTOŚĆ - LEWY PANEL + MAPA */}
      <div className="user-main-content">
        {/* LEWY PANEL - SZCZEGÓŁY KURSU */}
        <aside className="user-sidebar">
          <div className="form-card">
            <h2 className="form-title">🚖 Twój kurs</h2>
            
            <div className="trip-status-card">
              <div className="status-indicator">
                <div className={`status-dot ${tripStatus}`}></div>
                <span className="status-text">{getStatusText()}</span>
                <span className={`status-badge ${getStatusBadgeClass()}`}>
                  {tripStatus === 'pending' && 'Oczekuje'}
                  {tripStatus === 'assigned' && 'Przypisany'}
                  {tripStatus === 'in_progress' && 'W trakcie'}
                  {tripStatus === 'completed' && 'Zakończony'}
                </span>
              </div>
            </div>

            <div className="trip-details">
              <div className="trip-point">
                <span className="point-icon">📍</span>
                <div>
                  <strong>MIEJSCE ODBIORU</strong>
                  <p>{pickup.address}</p>
                </div>
              </div>
              <div className="trip-point">
                <span className="point-icon">🏁</span>
                <div>
                  <strong>MIEJSCE DOCELOWE</strong>
                  <p>{destination.address}</p>
                </div>
              </div>
            </div>

            {tripStatus !== 'completed' ? (
              <button className="order-btn cancel-btn" onClick={handleCancelTrip}>
                ANULUJ KURS
              </button>
            ) : (
              <button className="order-btn" onClick={() => navigate('/homeUser')}>
                ZAMÓW NOWY KURS
              </button>
            )}
          </div>
        </aside>

        {/* PRAWY PANEL - MAPA */}
        <main className="user-map-area">
          {!mapError ? (
            <LoadScript 
              googleMapsApiKey={GOOGLE_MAPS_API_KEY}
              libraries={libraries}
              onError={() => {
                console.log('❌ LoadScript onError - błąd ładowania');
                setMapError(true);
              }}
              onLoad={() => {
                console.log('✅ LoadScript onLoad - mapy gotowe');
                if (mapLoadingTimeout) clearTimeout(mapLoadingTimeout);
                setMapsLoaded(true);
                setMapRetryCount(0);
              }}
            >
              <div className="map-card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
                {/* Pokazuj loader jeśli mapy się ładują */}
                {!mapsLoaded && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255,255,255,0.9)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10,
                    borderRadius: '12px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                      <p style={{ marginTop: 10, color: '#666' }}>Ładowanie mapy...</p>
                    </div>
                  </div>
                )}
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%', minHeight: '500px' }}
                  center={pickup.coords}
                  zoom={14}
                  onLoad={(map) => {
                    mapRef.current = map;
                    console.log('✅ GoogleMap onLoad - mapa gotowa');
                  }}
                >
                  <Marker 
                    position={pickup.coords} 
                    label="A"
                    icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' }}
                  />
                  <Marker 
                    position={destination.coords} 
                    label="B"
                    icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }}
                  />
                  {directions && <DirectionsRenderer directions={directions} />}
                </GoogleMap>
              </div>
            </LoadScript>
          ) : (
            <div className="map-card" style={{ flexDirection: 'column', gap: '15px' }}>
              <span className="map-placeholder-text">⚠️ Błąd ładowania mapy</span>
              <p>Sprawdź klucz API Google Maps lub połączenie internetowe</p>
              <button 
                onClick={handleRetryMap}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#002255',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Spróbuj ponownie
              </button>
              <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                (mapa może nie działać z powodu blokowania API przez przeglądarkę)
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ActiveTripPageUser;