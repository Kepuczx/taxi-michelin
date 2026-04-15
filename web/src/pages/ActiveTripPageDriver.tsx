import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import axios from 'axios';
import { API_URL, GOOGLE_MAPS_API_KEY } from '../config';
import '../styles/ActiveTripPageDriver.css';

const libraries: ("places")[] = ["places"];

const ActiveTripPageDriver = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [trip, setTrip] = useState<any>(location.state?.trip || null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [firstName, setFirstName] = useState(() => {
    const fullName = localStorage.getItem('userName');
    return fullName ? fullName.split(' ')[0] : 'Kierowca';
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (!trip) {
      navigate('/homeDriver');
    }
  }, [trip, navigate]);

  useEffect(() => {
    if (mapsLoaded && trip) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: { lat: trip.pickupLat, lng: trip.pickupLng },
          destination: { lat: trip.dropoffLat, lng: trip.dropoffLng },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK' && result) {
            setDirections(result);
            setTimeout(() => {
              if (mapRef.current && result.routes[0].bounds) {
                mapRef.current.fitBounds(result.routes[0].bounds);
              }
            }, 100);
          }
        }
      );
    }
  }, [mapsLoaded, trip]);

  const handleStartTrip = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const driverId = localStorage.getItem('userId');
      await axios.patch(
        `${API_URL}/trips/${trip.id}/start`,
        { driverId: parseInt(driverId || '0') },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTrip({ ...trip, status: 'in_progress' });
      alert('Kurs rozpoczęty! Jedź do celu.');
    } catch (error) {
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
      alert('Nie udało się zakończyć kursu');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Czy na pewno chcesz się wylogować?')) {
      localStorage.clear();
      navigate('/');
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  if (!trip) return null;

  return (
    <div className="driver-page-wrapper">
      <header className="driver-header">
        <div className="driver-logo"><span className="driver-logo-text">MICHELIN</span></div>
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

      <div className="driver-main-content" style={{ flexDirection: 'column' }}>
        <div className="active-trip-card" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
          <div className="form-card">
            <h2 className="form-title">🚖 Aktywny kurs #{trip.id}</h2>
            
            <div className="trip-status-card">
              <div className="status-indicator">
                <div className={`status-dot ${trip.status}`}></div>
                <span className="status-text">
                  {trip.status === 'assigned' ? '📍 Dojazd do klienta' : '🚖 Kurs w trakcie'}
                </span>
              </div>
            </div>

            <div className="trip-details">
              <div className="trip-point">
                <span className="point-icon">📍</span>
                <div>
                  <strong>MIEJSCE ODBIORU</strong>
                  <p>{trip.pickupAddress}</p>
                </div>
              </div>
              <div className="trip-point">
                <span className="point-icon">🏁</span>
                <div>
                  <strong>MIEJSCE DOCELOWE</strong>
                  <p>{trip.dropoffAddress}</p>
                </div>
              </div>
            </div>

            <div className="map-container" style={{ height: '300px', marginBottom: '20px' }}>
              <LoadScript
                googleMapsApiKey={GOOGLE_MAPS_API_KEY}
                libraries={libraries}
                onError={() => setMapError(true)}
                onLoad={() => setMapsLoaded(true)}
              >
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={{ lat: trip.pickupLat, lng: trip.pickupLng }}
                  zoom={13}
                  onLoad={(map) => { mapRef.current = map; }}
                >
                  <Marker position={{ lat: trip.pickupLat, lng: trip.pickupLng }} label="A" />
                  <Marker position={{ lat: trip.dropoffLat, lng: trip.dropoffLng }} label="B" />
                  {directions && <DirectionsRenderer directions={directions} />}
                </GoogleMap>
              </LoadScript>
            </div>

            {trip.status === 'assigned' ? (
              <button className="order-btn" onClick={handleStartTrip} style={{ backgroundColor: '#2ecc71' }}>
                KLIENT WSIADŁ - ROZPOCZNIJ KURS
              </button>
            ) : (
              <button className="order-btn" onClick={handleCompleteTrip} style={{ backgroundColor: '#e74c3c' }}>
                ZAKOŃCZ KURS
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveTripPageDriver;