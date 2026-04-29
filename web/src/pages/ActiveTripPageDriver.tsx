import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { API_URL, GOOGLE_MAPS_API_KEY } from '../config';
import '../styles/ActiveTripPageDriver.css';

const libraries: ("places")[] = ["places"];
const mapContainerStyle = { width: '100%', height: '100%' };

const ActiveTripPageDriver = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [trip, setTrip] = useState<any>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [firstName] = useState(() => {
    const fullName = localStorage.getItem('userName');
    return fullName ? fullName.split(' ')[0] : 'Kierowca';
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [clientName, setClientName] = useState<string>('Klient');
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [trackingLocation, setTrackingLocation] = useState(false);
  const [tripStatus, setTripStatus] = useState<string>('assigned');
  const [loading, setLoading] = useState(true);
  const [redirected, setRedirected] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mapIcons = {
    pickup: {
      path: "M 0,0 m -7,0 a 7,7 0 1,0 14,0 a 7,7 0 1,0 -14,0",
      fillColor: "#ffffff",
      fillOpacity: 1,
      strokeWeight: 4,
      strokeColor: "#27ae60",
      scale: 1,
    },
    destination: {
      path: "M -6,-6 L 6,-6 L 6,6 L -6,6 Z",
      fillColor: "#002255",
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: "#ffffff",
      scale: 1,
    }
  };

  const toNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value.replace(/'/g, ''));
    return 0;
  };

  // GŁÓWNA INICJALIZACJA
  useEffect(() => {
    const init = async () => {
      if (redirected) return;
      
      try {
        const token = localStorage.getItem('authToken');
        const driverId = localStorage.getItem('userId');
        
        console.log('🔍 Inicjalizacja ActiveTripPageDriver');
        console.log('🔍 driverId:', driverId);
        
        if (!token || !driverId) {
          console.log('❌ Brak danych, przekierowanie do homeDriver');
          setRedirected(true);
          navigate('/homeDriver');
          return;
        }
        
        let activeTrip = null;
        
        if (location.state?.trip) {
          console.log('✅ Używam tripa z location.state');
          activeTrip = location.state.trip;
        } else {
          console.log('🔍 Sprawdzam w API aktywny kurs...');
          const response = await axios.get(`${API_URL}/trips/driver/${driverId}/active`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('📡 Odpowiedź API:', response.data);
          activeTrip = response.data;
        }
        
        if (activeTrip && activeTrip.id) {
          console.log('✅ Ustawiam trip:', activeTrip.id);
          setTrip(activeTrip);
          setTripStatus(activeTrip.status);
          setLoading(false);
        } else {
          console.log('❌ Brak aktywnego kursu, przekierowanie');
          setRedirected(true);
          navigate('/homeDriver');
        }
      } catch (error) {
        console.error('❌ Błąd inicjalizacji:', error);
        setRedirected(true);
        navigate('/homeDriver');
      }
    };
    
    init();
  }, [navigate, location.state, redirected]);

  // Pobieranie danych klienta
  useEffect(() => {
    if (!trip) return;
    
    const fetchClientData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(`${API_URL}/users/${trip.clientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data) {
          setClientName(`${response.data.firstName} ${response.data.lastName}`);
        }
      } catch (error) {
        console.error('Błąd pobierania klienta:', error);
        setClientName(`Klient #${trip.clientId}`);
      }
    };
    
    fetchClientData();
  }, [trip]);

  // 🔥 WEBSOCKET - POŁĄCZENIE
  useEffect(() => {
    if (!trip || loading) return;
    
    const newSocket = io(API_URL, { transports: ['websocket'] });
    socketRef.current = newSocket;
    
    newSocket.on('connect', () => {
      console.log('✅ WebSocket połączony, dołączam do roomu trip:', trip.id);
      newSocket.emit('joinTripRoom', trip.id);
    });
    
    newSocket.on('tripStatusChanged', (data: { tripId: number; status: string }) => {
      if (data.tripId === trip.id) {
        console.log(`📢 Status kursu zmieniony na: ${data.status}`);
        setTripStatus(data.status);
        if (data.status === 'completed') {
          alert('Kurs zakończony!');
          navigate('/homeDriver');
        }
      }
    });
    
    return () => {
      if (newSocket) {
        newSocket.emit('leaveTripRoom', trip.id);
        newSocket.disconnect();
      }
      socketRef.current = null;
    };
  }, [trip, loading, navigate]);

  // 🔥 START ŚLEDZENIA LOKALIZACJI I WYSYŁANIE PRZEZ WEBSOCKET
  useEffect(() => {
    if (!trip || loading || !socketRef.current) return;
    
    console.log('📍 Rozpoczynam śledzenie lokalizacji');
    
    if (!navigator.geolocation) {
      console.error('Geolokalizacja nie wspierana');
      return;
    }
    
    setTrackingLocation(true);
    
    // Funkcja do wysyłania lokalizacji
    const sendLocationUpdate = (location: { lat: number; lng: number }) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('driverLocation', {
          tripId: trip.id,
          location: location
        });
        console.log('📡 Wysłano lokalizację:', location);
      }
    };
    
    // Pierwsze pobranie lokalizacji
    const success = (position: GeolocationPosition) => {
      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setDriverLocation(newLocation);
      setTrackingLocation(false);
      console.log('📍 Lokalizacja pobrana:', newLocation);
      
      sendLocationUpdate(newLocation);
      
      if (mapRef.current) {
        mapRef.current.panTo(newLocation);
        mapRef.current.setZoom(14);
      }
    };
    
    const error = (err: GeolocationPositionError) => {
      console.error('Błąd GPS:', err);
      setTrackingLocation(false);
    };
    
    navigator.geolocation.getCurrentPosition(success, error, { enableHighAccuracy: true });
    
    // Śledzenie ciągłe - aktualizacja co 3 sekundy
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setDriverLocation(newLocation);
        sendLocationUpdate(newLocation);
      },
      (err) => console.error('Błąd watch:', err),
      { enableHighAccuracy: true }
    );
    
    // Dodatkowo interwał na wysyłanie lokalizacji co 3 sekundy (na wypadek gdyby watch nie działał)
    locationIntervalRef.current = setInterval(() => {
      if (driverLocation && socketRef.current?.connected) {
        socketRef.current.emit('driverLocation', {
          tripId: trip.id,
          location: driverLocation
        });
      }
    }, 3000);
    
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [trip, loading]);

  // Obliczanie trasy
  useEffect(() => {
    if (!mapsLoaded || !googleReady || !trip || !driverLocation) {
      console.log('⏳ Czekam na mapę i lokalizację...');
      return;
    }
    
    console.log('🗺️ Obliczam trasę...');
    
    const directionsService = new window.google.maps.DirectionsService();
    
    const origin = { lat: driverLocation.lat, lng: driverLocation.lng };
    const destination = tripStatus === 'assigned' 
      ? { lat: toNumber(trip.pickupLat), lng: toNumber(trip.pickupLng) }
      : { lat: toNumber(trip.dropoffLat), lng: toNumber(trip.dropoffLng) };
    
    directionsService.route(
      {
        origin: origin,
        destination: destination,
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
          console.error('❌ Błąd trasy:', status);
        }
      }
    );
  }, [mapsLoaded, googleReady, trip, driverLocation, tripStatus]);

  const handleStartTrip = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const driverId = localStorage.getItem('userId');
      await axios.patch(
        `${API_URL}/trips/${trip.id}/start`,
        { driverId: parseInt(driverId || '0') },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTripStatus('in_progress');
      alert('Kurs rozpoczęty! Jedź do celu.');
    } catch (error) {
      console.error('Błąd rozpoczęcia kursu:', error);
      alert('Nie udało się rozpocząć kursu');
    }
  };

  const handleCompleteTrip = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const driverId = localStorage.getItem('userId');
      await axios.patch(
        `${API_URL}/trips/${trip.id}/complete`,
        { driverId: parseInt(driverId || '0') },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Kurs zakończony!');
      navigate('/homeDriver');
    } catch (error) {
      console.error('Błąd zakończenia kursu:', error);
      alert('Nie udało się zakończyć kursu');
    }
  };

  const handleLogout = async () => {
  if (window.confirm('Czy na pewno chcesz się wylogować?')) {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    
    // Tylko dla kierowców wysyłamy logout do backendu
    if (userId && token && userRole === 'driver') {
      try {
        await fetch('http://localhost:3000/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ userId: parseInt(userId) })
        });
        console.log('Wylogowano z backendu');
      } catch (error) {
        console.error('Błąd podczas wylogowania:', error);
      }
    }
    
    // Zawsze czyścimy localStorage i przekierowujemy
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('loggedUser');
    navigate('/');
  }
};

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  if (loading) {
    return (
      <div className="driver-page-wrapper">
        <header className="driver-header">
          <div className="driver-logo"><span className="driver-logo-text">MICHELIN</span></div>
          <div className="driver-header-actions">
            <span className="welcome-text">Witaj, {firstName}!</span>
            <button className="driver-menu-btn" onClick={toggleMenu}>☰</button>
          </div>
        </header>
        <div className="driver-main-content" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="loading-spinner"></div>
          <p className="loading-text">Ładowanie kursu...</p>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  const pickupCoords = { lat: toNumber(trip.pickupLat), lng: toNumber(trip.pickupLng) };
  const dropoffCoords = { lat: toNumber(trip.dropoffLat), lng: toNumber(trip.dropoffLng) };

  return (
    <div className="driver-page-wrapper">
      <header className="driver-header">
        <div className="driver-logo">
          <span className="driver-logo-text">MICHELIN</span>
        </div>
        <div className="driver-header-actions">
          <span className="welcome-text">Witaj, {firstName}!</span>
          <button className="driver-menu-btn" onClick={toggleMenu}>☰</button>
        </div>
      </header>

      <div className={`driver-side-menu ${isMenuOpen ? 'open' : ''}`}>
        <button className="close-menu-btn" onClick={toggleMenu}>✕ Zamknij</button>
        <div className="driver-menu-header">Aktywny kurs</div>
        <button className="driver-menu-item" onClick={() => navigate('/homeDriver')}>Powrót</button>
        <div className="driver-menu-bottom">
          <button className="driver-menu-item logout-text" onClick={handleLogout}>Wyloguj się</button>
        </div>
      </div>

      <div className="driver-main-content">
        <aside className="driver-sidebar">
          <div className="form-card" style={{ padding: '30px 20px', border: 'none' }}>
            {/* Tytuł kursu */}
            <h2 className="form-title" style={{ color: '#002255', fontSize: '24px', fontWeight: '900', textAlign: 'center', marginBottom: '25px', display: 'block' }}>
               Aktywny kurs #{trip.id}
            </h2>
            
            {/* Status kursu w ramce (Kierowca w drodze / Kurs w trakcie) */}
            <div className="trip-status-card">
              <div className="status-text">
                {tripStatus === 'assigned' ? 'Dojazd do klienta' : 'Kurs w trakcie'}
              </div>
            </div>

            {/* Dane Pasażera - centralnie nad osią czasu */}
            <div style={{ textAlign: 'center', marginBottom: '35px' }}>
              <span style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Pasażer</span>
              <div style={{ fontSize: '15px', color: '#111', fontWeight: '500', marginTop: '3px' }}>{clientName}</div>
            </div>

            {/* Oś czasu (Timeline) */}
            <div className="trip-details">
              
              <div className="trip-point">
                <div className="point-icon-wrapper">
                  <div className="marker-pickup"></div>
                </div>
                <div className="trip-point-content">
                  <span className="trip-point-label">Miejsce odbioru</span>
                  <p className="trip-point-address">{trip.pickupAddress}</p>
                </div>
              </div>
              
              <div className="trip-point">
                <div className="point-icon-wrapper">
                  <div className="marker-destination"></div>
                </div>
                <div className="trip-point-content">
                  <span className="trip-point-label">Miejsce docelowe</span>
                  <p className="trip-point-address">{trip.dropoffAddress}</p>
                </div>
              </div>
              
            </div>

            {/* Przyciski na dole */}
            <div style={{ marginTop: '30px' }}>
              {tripStatus === 'assigned' ? (
                <button className="order-btn start-btn" onClick={handleStartTrip}>
                  KLIENT WSIADŁ
                </button>
              ) : (
                <button className="order-btn complete-btn" onClick={handleCompleteTrip}>
                  ZAKOŃCZ KURS
                </button>
              )}
            </div>

            {/* Liczba pasażerów - dyskretnie pod przyciskiem */}
            <div style={{ marginTop: '20px', textAlign: 'center', color: '#666', fontSize: '12px' }}>
               Liczba pasażerów: <strong>{trip.passengerCount || 1}</strong>
            </div>
            
          </div>
        </aside>

        <main className="driver-map-area">
          {!GOOGLE_MAPS_API_KEY ? (
            <div className="map-card">
              <span className="map-placeholder-text">⚠️ Brak klucza API</span>
            </div>
          ) : mapError ? (
            <div className="map-card">
              <span className="map-placeholder-text">⚠️ Błąd ładowania mapy</span>
            </div>
          ) : (
            <LoadScript
              googleMapsApiKey={GOOGLE_MAPS_API_KEY}
              libraries={libraries}
              onError={() => setMapError(true)}
              onLoad={() => {
                console.log('✅ Mapy Google załadowane');
                setMapsLoaded(true);
                setGoogleReady(true);
              }}
            >
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={driverLocation || pickupCoords}
                  zoom={14}
                  onLoad={(map) => {
                    mapRef.current = map;
                    if (driverLocation) {
                      map.panTo(driverLocation);
                    }
                  }}
                >
                  {googleReady && driverLocation && (
                    <Marker
                      position={driverLocation}
                      icon={{
                        url: 'https://cdn-icons-png.flaticon.com/512/744/744465.png',
                        scaledSize: new window.google.maps.Size(40, 40),
                        origin: new window.google.maps.Point(0, 0),
                        anchor: new window.google.maps.Point(20, 20),
                      }}
                      title="Twoja lokalizacja"
                      label={{ text: '🚕', color: 'black', fontSize: '14px', fontWeight: 'bold' }}
                    />
                  )}

                  {googleReady && (
                    <Marker
                      position={pickupCoords}
                      icon={mapIcons.pickup}
                      title="Miejsce odbioru"
                      zIndex = {50}
                    />
                  )}

                  {googleReady && tripStatus === 'in_progress' && (
                    <Marker
                      position={dropoffCoords}
                      icon={mapIcons.destination}
                      title="Miejsce docelowe"
                      zIndex = {50}
                    />
                  )}

                  {directions && (
                    <DirectionsRenderer
                      directions={directions}
                      options={{
                        polylineOptions: {
                          strokeColor: '#002255',
                          strokeWeight: 6,
                          strokeOpacity: 0.9
                        },
                        suppressMarkers: true
                      }}
                    />
                  )}
                </GoogleMap>

                {directions && directions.routes[0]?.legs[0] && (
                  <div className="route-info">
                    <div className="route-info-item">
                      <span>Dystans: </span>
                      <strong>{directions.routes[0].legs[0].distance?.text}</strong>
                    </div>
                    <div className="route-info-item">
                      <span>Czas: </span>
                      <strong>{directions.routes[0].legs[0].duration?.text}</strong>
                    </div>
                  </div>
                )}

                {trackingLocation && !driverLocation && (
                  <div className="location-loader">
                    📍 Pobieranie lokalizacji...
                  </div>
                )}
              </div>
            </LoadScript>
          )}
        </main>
      </div>
    </div>
  );
};

export default ActiveTripPageDriver;