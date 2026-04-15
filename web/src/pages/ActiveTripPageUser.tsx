import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { API_URL, GOOGLE_MAPS_API_KEY } from '../config';
import '../styles/ActiveTripPageUser.css';

const libraries: ("places")[] = ["places"];

const ActiveTripPageUser = () => {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState({ address: '', coords: { lat: 0, lng: 0 } });
  const [destination, setDestination] = useState({ address: '', coords: { lat: 0, lng: 0 } });
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [driverDirections, setDriverDirections] = useState<google.maps.DirectionsResult | null>(null);
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
  const [myPhysicalLocation, setMyPhysicalLocation] = useState<google.maps.LatLngLiteral | null>(null);
  
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const mapRef = useRef<google.maps.Map | null>(null);
  
  const mapIcons = {
    current: {
      path: "M 0,0 m -7,0 a 7,7 0 1,0 14,0 a 7,7 0 1,0 -14,0",
      fillColor: "#3498db",
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: "#ffffff",
      scale: 1,
    },
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

  // ŚLEDZENIE LOKALIZACJI UŻYTKOWNIKA
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setMyPhysicalLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error('Błąd śledzenia GPS:', error),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // WEBSOCKET - DOŁĄCZ DO ROOMU I NASŁUCHUJ NA LOKALIZACJĘ KIEROWCY
  useEffect(() => {
    if (!dataLoaded || !tripId) return;
    
    const newSocket = io(API_URL, { transports: ['websocket'] });
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      console.log('✅ WebSocket połączony, dołączam do roomu trip:', tripId);
      newSocket.emit('joinTripRoom', tripId);
    });
    
    newSocket.on('driverLocation', (data: { tripId: number; location: { lat: number; lng: number } }) => {
      console.log('📍 Odebrano lokalizację kierowcy:', data.location);
      setDriverLocation(data.location);
    });
    
    return () => {
      if (newSocket) {
        newSocket.emit('leaveTripRoom', tripId);
        newSocket.disconnect();
      }
    };
  }, [dataLoaded, tripId]);

  // WEBSOCKET - NASŁUCHIWANIE NA ZMIANĘ STATUSU KURSU
  useEffect(() => {
    if (!dataLoaded || !tripId) return;
    if (!socket) return;
    
    const handleStatusChange = (data: { tripId: number; status: string }) => {
      if (data.tripId === tripId) {
        console.log(`📢 Status kursu zmieniony na: ${data.status}`);
        setTripStatus(data.status);
        
        if (data.status === 'completed') {
          setTimeout(() => {
            alert('Kurs został zakończony!');
            navigate('/homeUser');
          }, 1000);
        }
      }
    };
    
    socket.on(`tripStatusChanged:${tripId}`, handleStatusChange);
    
    return () => {
      socket.off(`tripStatusChanged:${tripId}`, handleStatusChange);
    };
  }, [dataLoaded, tripId, socket, navigate]);

  // 🔥 OBLICZANIE TRASY KIEROWCY -> ODBIÓR (tylko gdy assigned)
  useEffect(() => {
    if (!mapsLoaded || !dataLoaded || !driverLocation || tripStatus !== 'assigned') return;
    if (!window.google || !window.google.maps) return;
    
    console.log('🗺️ Obliczam trasę kierowcy do odbioru...');
    
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: driverLocation,
        destination: pickup.coords,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          console.log('✅ Trasa kierowcy obliczona');
          setDriverDirections(result);
          setTimeout(() => {
            if (mapRef.current && result.routes[0].bounds) {
              mapRef.current.fitBounds(result.routes[0].bounds);
            }
          }, 100);
        } else {
          console.error('❌ Błąd trasy kierowcy:', status);
        }
      }
    );
  }, [mapsLoaded, dataLoaded, driverLocation, pickup.coords, tripStatus]);

  // 🔥 OBLICZANIE TRASY KIEROWCY -> CEL (gdy kurs w trakcie - jedzie z aktualnej lokalizacji do celu)
  useEffect(() => {
    if (!mapsLoaded || !dataLoaded || !driverLocation || tripStatus !== 'in_progress') return;
    if (!window.google || !window.google.maps) return;
    
    console.log('🗺️ Obliczam trasę kierowcy do celu (z aktualnej lokalizacji)...');
    
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: driverLocation,
        destination: destination.coords,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          console.log('✅ Trasa kierowcy do celu obliczona');
          setDirections(result);
          setTimeout(() => {
            if (mapRef.current && result.routes[0].bounds) {
              mapRef.current.fitBounds(result.routes[0].bounds);
            }
          }, 100);
        } else {
          console.error('❌ Błąd trasy kierowcy do celu:', status);
        }
      }
    );
  }, [mapsLoaded, dataLoaded, driverLocation, destination.coords, tripStatus]);

  // RESET ŁADOWANIA MAPY
  const resetMapLoading = () => {
    if (mapLoadingTimeout) clearTimeout(mapLoadingTimeout);
    setMapsLoaded(false);
    setMapError(false);
    
    if (mapRetryCount < 3) {
      console.log(`🔄 Próba ponownego załadowania mapy (${mapRetryCount + 1}/3)...`);
      setMapRetryCount(prev => prev + 1);
      
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

  useEffect(() => {
    return () => {
      if (mapLoadingTimeout) clearTimeout(mapLoadingTimeout);
    };
  }, [mapLoadingTimeout]);

  // POBIERZ AKTYWNY KURS
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

  const getStatusText = () => {
    switch (tripStatus) {
      case 'pending': return 'Oczekiwanie na kierowcę...';
      case 'assigned': return 'Kierowca w drodze po Ciebie';
      case 'in_progress': return 'Kurs w trakcie';
      case 'completed': return 'Kurs zakończony';
      default: return 'Status: ' + tripStatus;
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
          { reason: 'Anulowane przez klienta', userId: userId ? parseInt(userId) : null },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.status === 200) {
          alert('Kurs został anulowany pomyślnie');
          navigate('/homeUser');
        }
      } catch (error: any) {
        console.error('Błąd anulowania:', error);
        alert(error.response?.data?.message || 'Nie udało się anulować kursu');
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

      <div className="user-main-content">
        <aside className="user-sidebar">
          <div className="active-trip-sidebar">
            <h2 className="sidebar-title">Twój kurs</h2>
            
            <div className={`trip-status-badge ${getStatusBadgeClass()}`}>
              {getStatusText()}
            </div>

            <div className="trip-timeline">
              <div className="timeline-item">
                <div className="timeline-marker marker-pickup"></div>
                <div className="timeline-content">
                  <span className="timeline-label">Miejsce odbioru</span>
                  <p className="timeline-address">{pickup.address}</p>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-marker marker-destination"></div>
                <div className="timeline-content">
                  <span className="timeline-label">Miejsce docelowe</span>
                  <p className="timeline-address">{destination.address}</p>
                </div>
              </div>
            </div>

            {tripStatus !== 'completed' ? (
              <button className="btn-cancel-trip" onClick={handleCancelTrip}>ANULUJ KURS</button>
            ) : (
              <button className="btn-cancel-trip new-trip-btn" onClick={() => navigate('/homeUser')} style={{ backgroundColor: '#002255', color: '#fff', borderColor: '#002255' }}>
                ZAMÓW NOWY KURS
              </button>
            )}
          </div>
        </aside>

        <main className="user-map-area">
          {!mapError ? (
            <LoadScript 
              googleMapsApiKey={GOOGLE_MAPS_API_KEY} 
              libraries={libraries} 
              onError={() => setMapError(true)} 
              onLoad={() => { if (mapLoadingTimeout) clearTimeout(mapLoadingTimeout); setMapsLoaded(true); setMapRetryCount(0); }}
            >
              <div className="map-card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
                {!mapsLoaded && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, borderRadius: '12px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                      <p style={{ marginTop: 10, color: '#666' }}>Ładowanie mapy...</p>
                    </div>
                  </div>
                )}
                <GoogleMap mapContainerStyle={{ width: '100%', height: '100%', minHeight: '500px' }} center={pickup.coords} zoom={14} onLoad={(map) => { mapRef.current = map; }}>
                  {/* Marker Twojej lokalizacji */}
                  {myPhysicalLocation && (
                    <Marker position={myPhysicalLocation} icon={mapIcons.current} title="Twoja lokalizacja" />
                  )}
                  
                  {/* Marker odbioru */}
                  <Marker position={pickup.coords} icon={mapIcons.pickup} title="Miejsce odbioru" />
                  
                  {/* Marker celu (zawsze widoczny) */}
                  <Marker position={destination.coords} icon={mapIcons.destination} title="Miejsce docelowe" />
                  
                  {/* MARKER KIEROWCY - TAKSÓWKA (tylko gdy assigned) */}
                  {tripStatus === 'assigned' && driverLocation && (
                    <Marker 
                      position={driverLocation} 
                      icon={{
                        url: 'https://cdn-icons-png.flaticon.com/512/744/744465.png',
                        scaledSize: new window.google.maps.Size(40, 40),
                        origin: new window.google.maps.Point(0, 0),
                        anchor: new window.google.maps.Point(20, 20),
                      }}
                      title="Lokalizacja kierowcy"
                    />
                  )}
                  
                  {/* MARKER KIEROWCY - TAKSÓWKA (również gdy kurs w trakcie - pokazuje gdzie jest) */}
                  {tripStatus === 'in_progress' && driverLocation && (
                    <Marker 
                      position={driverLocation} 
                      icon={{
                        url: 'https://cdn-icons-png.flaticon.com/512/744/744465.png',
                        scaledSize: new window.google.maps.Size(40, 40),
                        origin: new window.google.maps.Point(0, 0),
                        anchor: new window.google.maps.Point(20, 20),
                      }}
                      title="Lokalizacja kierowcy"
                    />
                  )}
                  
                  {/* Trasa kierowcy do odbioru (tylko gdy assigned) */}
                  {tripStatus === 'assigned' && driverDirections && (
                    <DirectionsRenderer 
                      directions={driverDirections} 
                      options={{
                        preserveViewport: true,
                        suppressMarkers: true,
                        polylineOptions: { strokeColor: "#FF6B6B", strokeWeight: 5, strokeOpacity: 0.8 }
                      }} 
                    />
                  )}
                  
                  {/* Trasa kierowcy do celu (tylko gdy in_progress - z aktualnej lokalizacji) */}
                  {tripStatus === 'in_progress' && directions && (
                    <DirectionsRenderer 
                      directions={directions} 
                      options={{
                        preserveViewport: true,
                        suppressMarkers: true,
                        polylineOptions: { strokeColor: "#002255", strokeWeight: 5, strokeOpacity: 0.8 }
                      }} 
                    />
                  )}
                </GoogleMap>
              </div>
            </LoadScript>
          ) : (
            <div className="map-card" style={{ flexDirection: 'column', gap: '15px' }}>
              <span className="map-placeholder-text">⚠️ Błąd ładowania mapy</span>
              <button onClick={handleRetryMap} style={{ padding: '10px 20px', backgroundColor: '#002255', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Spróbuj ponownie</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ActiveTripPageUser;