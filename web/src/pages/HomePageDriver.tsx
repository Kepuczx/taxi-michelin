import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { vehicleService } from '../services/vehicleService';
import type { Vehicle } from '../types/vehicle.types';
import { API_URL, GOOGLE_MAPS_API_KEY } from '../config';
import '../styles/HomePageDriver.css';

const libraries: ("places")[] = ["places"];
const mapContainerStyle = { width: '100%', height: '100%' };

interface VehicleWithDriver extends Vehicle {
  currentDriver?: { id: number; firstName: string; lastName: string; };
}

interface Trip {
  id: number;
  clientId: number;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string;
  passengerCount: number;
  distanceKm?: number;
  status: string;
}

const toNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value.replace(/'/g, ''));
  return 0;
};

const HomePageDriver = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<number | null>(null);
  const [firstName, setFirstName] = useState(() => {
    const fullName = localStorage.getItem('userName');
    return fullName ? fullName.split(' ')[0] : 'Kierowca';
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');

  const [vehicles, setVehicles] = useState<VehicleWithDriver[]>([]);
  const [assignedVehicle, setAssignedVehicle] = useState<VehicleWithDriver | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialCheck, setInitialCheck] = useState(true);

  const [availableTasks, setAvailableTasks] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [trackingLocation, setTrackingLocation] = useState(false);
  const [autoCenter, setAutoCenter] = useState(true);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const redirectDone = useRef(false);

  const checkDriverActiveTrip = async () => {
    if (redirectDone.current) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const driverId = localStorage.getItem('userId');
      
      if (!token || !driverId) {
        setInitialCheck(false);
        return;
      }
      
      const response = await axios.get(`${API_URL}/trips/driver/${driverId}/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.id) {
        redirectDone.current = true;
        localStorage.setItem('activeTrip', JSON.stringify(response.data));
        window.location.href = '/active-trip-driver';
        return;
      } else {
        setInitialCheck(false);
      }
    } catch (error: any) {
      setInitialCheck(false);
    }
  };

  const getDriverLocation = () => {
    if (!navigator.geolocation) return;
    
    setTrackingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setDriverLocation(newLocation);
        setTrackingLocation(false);
        
        if (autoCenter && mapRef && !selectedTrip) {
          mapRef.panTo(newLocation);
          mapRef.setZoom(14);
        }
      },
      (error) => {
        setTrackingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (!mapsLoaded || initialCheck) return;
    
    getDriverLocation();
    
    const interval = setInterval(() => {
      if (mapsLoaded && navigator.geolocation && !initialCheck) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setDriverLocation(newLocation);
            
            if (autoCenter && mapRef && !selectedTrip) {
              mapRef.panTo(newLocation);
            }
          },
          () => {},
          { enableHighAccuracy: true }
        );
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [mapsLoaded, autoCenter, selectedTrip, initialCheck]);

  const fetchPendingTrips = async () => {
    if (initialCheck) return;
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/trips/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const tripsWithNumbers = response.data.map((trip: any) => ({
        ...trip,
        pickupLat: toNumber(trip.pickupLat),
        pickupLng: toNumber(trip.pickupLng),
        dropoffLat: toNumber(trip.dropoffLat),
        dropoffLng: toNumber(trip.dropoffLng),
      }));
      
      setAvailableTasks(tripsWithNumbers);
    } catch (error) {
      console.error('Błąd pobierania zleceń:', error);
    }
  };

  const showRoute = (trip: Trip) => {
    if (!mapsLoaded) {
      alert('Mapa się jeszcze ładuje, spróbuj za chwilę');
      return;
    }
    
    if (!window.google || !window.google.maps) {
      alert('Google Maps nie jest jeszcze dostępne');
      return;
    }
    
    if (selectedTrip?.id === trip.id) {
      setSelectedTrip(null);
      setDirections(null);
      setRouteInfo(null);
      setAutoCenter(true);
      return;
    }
    
    const originLat = toNumber(trip.pickupLat);
    const originLng = toNumber(trip.pickupLng);
    const destLat = toNumber(trip.dropoffLat);
    const destLng = toNumber(trip.dropoffLng);
    
    const origin = { lat: originLat, lng: originLng };
    const destination = { lat: destLat, lng: destLng };
    
    if (isNaN(originLat) || isNaN(originLng) || isNaN(destLat) || isNaN(destLng)) {
      alert('Nieprawidłowe współrzędne dla tej trasy');
      return;
    }
    
    setSelectedTrip(trip);
    setCalculatingRoute(true);
    setDirections(null);
    setRouteInfo(null);
    setAutoCenter(false);
    
    const directionsService = new window.google.maps.DirectionsService();
    
    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        setCalculatingRoute(false);
        
        if (status === 'OK' && result) {
          setDirections(result);
          const leg = result.routes[0].legs[0];
          setRouteInfo({
            distance: leg.distance?.text || '? km',
            duration: leg.duration?.text || '? min'
          });
          setTimeout(() => {
            if (mapRef && result.routes[0]?.bounds) {
              mapRef.fitBounds(result.routes[0].bounds);
            }
          }, 100);
        } else {
          alert(`Nie udało się obliczyć trasy. Status: ${status}`);
          setAutoCenter(true);
        }
      }
    );
  };

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const id = localStorage.getItem('userId');

    if (role !== 'driver') {
      navigate('/');
      return;
    }
    if (id) setUserId(parseInt(id));

    checkDriverActiveTrip();
  }, [navigate]);

  useEffect(() => {
    if (initialCheck) return;
    
    socketRef.current = io(API_URL, { transports: ['websocket'] });
    socketRef.current.on('newTrip', () => {
      fetchPendingTrips();
    });
    socketRef.current.on('tripAccepted', (tripId: number) => {
      setAvailableTasks(prev => prev.filter(t => t.id !== tripId));
      if (selectedTrip?.id === tripId) {
        setSelectedTrip(null);
        setDirections(null);
        setRouteInfo(null);
        setAutoCenter(true);
      }
    });

    fetchPendingTrips();
    const interval = setInterval(fetchPendingTrips, 5000);
    setPollingInterval(interval);

    fetchVehiclesAndCheckAssignment(userId);

    return () => {
      socketRef.current?.disconnect();
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [initialCheck, userId]);

  const fetchVehiclesAndCheckAssignment = async (currentUserId: number | null) => {
    setLoading(true);
    try {
      const data = await vehicleService.getAll();
      setVehicles(data);
      if (currentUserId) {
        const myVehicle = data.find(v => v.currentDriverId === currentUserId);
        setAssignedVehicle(myVehicle || null);
      }
    } catch (error) {
      console.error('Błąd pobierania pojazdów:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVehicle = async (vehicleId: number) => {
    if (!userId) return;
    try {
      const updatedVehicle = await vehicleService.assignDriver(vehicleId, userId);
      setAssignedVehicle(updatedVehicle);
      await fetchVehiclesAndCheckAssignment(userId);
    } catch (error) {
      alert('Nie udało się przypisać pojazdu.');
    }
  };

  const handleReleaseVehicle = async () => {
    if (!assignedVehicle) return;
    if (window.confirm(`Czy na pewno chcesz zakończyć pracę z pojazdem ${assignedVehicle.registration}?`)) {
      try {
        await vehicleService.releaseDriver(assignedVehicle.id);
        setAssignedVehicle(null);
        await fetchVehiclesAndCheckAssignment(userId);
      } catch (error) {
        alert('Nie udało się zwolnić pojazdu.');
      }
    }
  };

  const handleAcceptTask = async (tripId: number) => {
    if (!userId) {
      alert('Nie jesteś zalogowany jako kierowca');
      return;
    }
    
    if (!assignedVehicle) {
      alert('Najpierw wybierz pojazd, z którego będziesz korzystać');
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await axios.patch(
        `${API_URL}/trips/${tripId}/accept`,
        { driverId: userId },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      if (response.data) {
        alert(`Zlecenie #${tripId} zostało przypisane do Ciebie!`);
        window.location.href = '/active-trip-driver';
      }
    } catch (error: any) {
      alert(`Nie udało się przyjąć kursu: ${error.response?.data?.message || error.message}`);
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

  if (initialCheck || loading) {
    return (
      <div className="driver-page-wrapper">
        <header className="driver-header">
          <div className="driver-logo"><span className="driver-logo-text">MICHELIN</span></div>
          <div className="driver-header-actions">
            <span className="welcome-text">Ładowanie...</span>
          </div>
        </header>
        <div className="driver-main-content" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="loading-spinner"></div>
          <p className="loading-text">{initialCheck ? 'Sprawdzanie aktywnego kursu...' : 'Ładowanie danych floty...'}</p>
        </div>
      </div>
    );
  }

  const availableVehicles = vehicles.filter(v => v.status === 'dostępny' && !v.isBreakdown);

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
        <div className="driver-menu-header">Profil Kierowcy</div>
        
        {assignedVehicle && (
          <div className="driver-current-vehicle">
            <div className="vehicle-label">Twój pojazd:</div>
            <div className="vehicle-name">{assignedVehicle.brand} {assignedVehicle.model}</div>
            <div className="vehicle-plate">{assignedVehicle.registration}</div>
            <button className="driver-release-btn" onClick={handleReleaseVehicle}>
              Zakończ pracę
            </button>
          </div>
        )}
        
        <button className={`driver-menu-item ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => { setActiveTab('tasks'); setIsMenuOpen(false); }}>
          Zlecenia
        </button>
        <button className="driver-menu-item">Pauza (Przerwa)</button>
        
        <div className="driver-menu-bottom">
          <button className={`driver-menu-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => { setActiveTab('history'); setIsMenuOpen(false); }}>
            Historia kursów
          </button>
          <button className="driver-menu-item logout-text" onClick={handleLogout}>Wyloguj się</button>
        </div>
      </div>

      <div className="driver-main-content">
        
        {!assignedVehicle ? (
          <div className="driver-selection-container">
            <div className="driver-selection-card">
              <h2>🚗 Wybór pojazdu</h2>
              <p>Nie masz przypisanego pojazdu. Wybierz dostępny:</p>
              {availableVehicles.length === 0 ? (
                <p className="no-vehicles">Brak dostępnych pojazdów.</p>
              ) : (
                <div className="driver-vehicles-list">
                  {availableVehicles.map(vehicle => (
                    <div key={vehicle.id} className="driver-vehicle-item">
                      <div className="driver-vehicle-info">
                        <strong>{vehicle.brand} {vehicle.model}</strong>
                        <span>Rejestracja: {vehicle.registration}</span>
                        <span>Miejsca: {vehicle.passengerCapacity}</span>
                      </div>
                      <button className="driver-select-btn" onClick={() => handleSelectVehicle(vehicle.id)}>
                        Wybierz
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'tasks' && (
              <>
                <aside className="driver-sidebar">
                  <div className="task-panel-card">
                    <h2 className="panel-title">Dostępne zlecenia ({availableTasks.length})</h2>
                    <div className="tasks-container">
                      {availableTasks.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: 20 }}>Oczekujesz na zlecenia... ☕</p>
                      ) : (
                        availableTasks.map((task) => (
                          <div key={task.id} className={`task-card ${selectedTrip?.id === task.id ? 'active-task' : ''}`}>
                            <div className="task-header">
                              <span className="task-time">Nowe</span>
                              <span className="task-passengers">👥 {task.passengerCount} os.</span>
                            </div>
                            <div className="task-route">
                              <div className="route-point"><strong>📍 Od:</strong> {task.pickupAddress}</div>
                              <div className="route-point"><strong>🏁 Do:</strong> {task.dropoffAddress}</div>
                            </div>
                            <div className="task-actions">
                              <button 
                                className="btn-show-route" 
                                onClick={() => showRoute(task)}
                                disabled={calculatingRoute}
                              >
                                {selectedTrip?.id === task.id ? '🗺️ Ukryj trasę' : '🗺️ Pokaż trasę'}
                              </button>
                              <button className="btn-accept" onClick={() => handleAcceptTask(task.id)}>
                                Przyjmij
                              </button>
                            </div>
                          </div>
                        ))
                      )}
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
                        setMapsLoaded(true);
                      }}
                    >
                      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <GoogleMap
                          mapContainerStyle={mapContainerStyle}
                          center={driverLocation || { lat: 53.7784, lng: 20.4801 }}
                          zoom={13}
                          onLoad={(map) => {
                            setMapRef(map);
                            if (driverLocation && autoCenter && !selectedTrip) {
                              map.panTo(driverLocation);
                            }
                          }}
                        >
                          {selectedTrip && (
                            <>
                              <Marker
                                position={{ lat: toNumber(selectedTrip.pickupLat), lng: toNumber(selectedTrip.pickupLng) }}
                                label={{ text: '🚩 START', color: '#2E7D32', fontSize: '14px', fontWeight: 'bold' }}
                                icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png', scaledSize: new window.google.maps.Size(32, 32) }}
                              />
                              <Marker
                                position={{ lat: toNumber(selectedTrip.dropoffLat), lng: toNumber(selectedTrip.dropoffLng) }}
                                label={{ text: '🏁 END', color: '#C62828', fontSize: '14px', fontWeight: 'bold' }}
                                icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png', scaledSize: new window.google.maps.Size(32, 32) }}
                              />
                            </>
                          )}
                          
                          {driverLocation && (
                            <Marker
                              position={driverLocation}
                              icon={{ url: 'https://cdn-icons-png.flaticon.com/512/744/744465.png', scaledSize: new window.google.maps.Size(40, 40), origin: new window.google.maps.Point(0, 0), anchor: new window.google.maps.Point(20, 20) }}
                              title="Twoja lokalizacja"
                              label={{ text: '🚕', color: 'black', fontSize: '14px', fontWeight: 'bold' }}
                            />
                          )}
                          
                          {directions && (
                            <DirectionsRenderer
                              directions={directions}
                              options={{ polylineOptions: { strokeColor: '#002255', strokeWeight: 6, strokeOpacity: 0.9 }, suppressMarkers: true }}
                            />
                          )}
                        </GoogleMap>
                        
                        {routeInfo && (
                          <div className="route-info">
                            📏 {routeInfo.distance} • ⏱️ {routeInfo.duration}
                          </div>
                        )}
                        
                        {calculatingRoute && (
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            zIndex: 20
                          }}>
                            ⏳ Obliczanie trasy...
                          </div>
                        )}

                        {!selectedTrip && availableTasks.length > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            padding: '15px 25px',
                            borderRadius: '8px',
                            textAlign: 'center',
                            zIndex: 10
                          }}>
                            🗺️ Kliknij "Pokaż trasę" na wybranym zleceniu
                          </div>
                        )}

                        {trackingLocation && !driverLocation && (
                          <div style={{
                            position: 'absolute',
                            bottom: 20,
                            right: 20,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            padding: '5px 10px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            zIndex: 10
                          }}>
                            📍 Pobieranie lokalizacji...
                          </div>
                        )}

                        {!autoCenter && selectedTrip && (
                          <div style={{
                            position: 'absolute',
                            bottom: 20,
                            left: 20,
                            backgroundColor: 'white',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                            zIndex: 10,
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setAutoCenter(true);
                            setSelectedTrip(null);
                            setDirections(null);
                            setRouteInfo(null);
                            if (driverLocation && mapRef) {
                              mapRef.panTo(driverLocation);
                              mapRef.setZoom(14);
                            }
                          }}
                          >
                            🚕 Wróć do mojej lokalizacji
                          </div>
                        )}
                      </div>
                    </LoadScript>
                  )}
                </main>
              </>
            )}

            {activeTab === 'history' && (
              <main className="driver-history-area">
                <div className="task-panel-card" style={{ width: '100%' }}>
                  <h2>Historia kursów</h2>
                  <p>Tutaj znajdzie się lista wykonanych przez Ciebie kursów.</p>
                </div>
              </main>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomePageDriver;