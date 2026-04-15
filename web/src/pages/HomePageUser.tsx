import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import axios from 'axios';
import { API_URL, GOOGLE_MAPS_API_KEY } from '../config';
import '../styles/HomePageUser.css';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 53.7784,
  lng: 20.4801,
};

const libraries: ("places")[] = ["places"];

const HomePageUser = () => {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState({
    address: '',
    coords: { lat: 53.7784, lng: 20.4801 }
  });
  const [destination, setDestination] = useState({
    address: '',
    coords: { lat: 0, lng: 0 }
  });
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [firstName, setFirstName] = useState<string>(() => {
    const fullName = localStorage.getItem('userName');
    return fullName ? fullName.split(' ')[0] : 'Pracownik';
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(14);
  const [isCheckingTrip, setIsCheckingTrip] = useState(true);
  
  // 🔥 DODANE STATE DLA ŁADOWANIA MAPY
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [pageReady, setPageReady] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);

  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
  const [pickupInput, setPickupInput] = useState('');
  const [destInput, setDestInput] = useState('');
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [pickupInputRef, setPickupInputRef] = useState<HTMLInputElement | null>(null);
  const [destInputRef, setDestInputRef] = useState<HTMLInputElement | null>(null);
  const [suggestionsPosition, setSuggestionsPosition] = useState({ top: 0, left: 0, width: 0 });
  const [activeInput, setActiveInput] = useState<'pickup' | 'dest' | null>(null);
  const [locatingPickup, setLocatingPickup] = useState(false);
  const [myPhysicalLocation, setMyPhysicalLocation] = useState<google.maps.LatLngLiteral | null>(null);

  // IKONY ZNACZNIKÓW
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

  const initServices = () => {
    if (window.google && !geocoder.current) {
      geocoder.current = new window.google.maps.Geocoder();
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      console.log('✅ Serwisy Google zainicjalizowane');
    }
  };

  const updatePosition = () => {
    const inputElement = activeInput === 'pickup' ? pickupInputRef : destInputRef;
    if (inputElement) {
      const rect = inputElement.getBoundingClientRect();
      setSuggestionsPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  // Aktualizuj pozycję przy zmianie inputa lub scrollowaniu
  useEffect(() => {
    if (showPickupSuggestions || showDestSuggestions) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [showPickupSuggestions, showDestSuggestions, activeInput]);

  // 🔥 SPRAWDZANIE AKTYWNEGO KURSU I PRZEKIEROWANIE
  useEffect(() => {
    const checkActiveTrip = async () => {
      const token = localStorage.getItem('authToken');
      const clientId = localStorage.getItem('userId');
      
      if (!token || !clientId) {
        setIsCheckingTrip(false);
        setPageReady(true);
        return;
      }
      
      try {
        const response = await axios.get(`${API_URL}/trips/client/${clientId}/active`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && response.data.id) {
          navigate('/active-trip');
          return;
        }
      } catch (error) {
        console.log('Brak aktywnego kursu');
      } finally {
        setIsCheckingTrip(false);
        setPageReady(true);
      }
    };
    
    checkActiveTrip();
  }, [navigate]);

  // 🔥 POBIERZ AKTUALNĄ LOKALIZACJĘ - TYLKO GDY STRONA JEST GOTOWA
  useEffect(() => {
    if (pageReady && mapsLoaded) {
      getCurrentLocation();
    }
  }, [pageReady, mapsLoaded]);

  // 🔥 POBIERZ AKTUALNĄ LOKALIZACJĘ
  const getCurrentLocation = () => {
    setLocatingPickup(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          setMyPhysicalLocation(newCoords);
          setPickup(prev => ({ ...prev, coords: newCoords }));
          setMapCenter(newCoords);
          
          if (geocoder.current) {
            geocoder.current.geocode({ location: newCoords }, (results, status) => {
              setLocatingPickup(false);
              if (status === 'OK' && results && results[0]) {
                const address = results[0].formatted_address;
                setPickup(prev => ({ ...prev, address }));
                setPickupInput(address);
              } else {
                setPickupInput(`${newCoords.lat.toFixed(6)}, ${newCoords.lng.toFixed(6)}`);
              }
            });
          } else {
            setLocatingPickup(false);
            setPickupInput(`${newCoords.lat.toFixed(6)}, ${newCoords.lng.toFixed(6)}`);
          }
        },
        (error) => {
          setLocatingPickup(false);
          console.error('Błąd GPS:', error);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLocatingPickup(false);
    }
  };

  // Wyszukiwanie podpowiedzi dla pickup
  useEffect(() => {
    if (!mapsLoaded) return;
    if (pickupInput.length > 2 && autocompleteService.current) {
      autocompleteService.current.getPlacePredictions(
        {
          input: pickupInput,
          componentRestrictions: { country: 'pl' },
          locationBias: new google.maps.LatLng(53.7784, 20.4801),
        },
        (predictions, status) => {
          if (status === 'OK' && predictions) {
            const olsztynResults: any[] = [];
            const otherResults: any[] = [];
            
            predictions.forEach((p) => {
              const text = p.description.toLowerCase();
              if (text.includes('olsztyn') || text.includes('olszt') || text.includes('olszty') || p.description.includes('Olsztyn')) {
                olsztynResults.push(p);
              } else {
                otherResults.push(p);
              }
            });
            
            const sorted = [...olsztynResults, ...otherResults];
            setPickupSuggestions(sorted);
            setShowPickupSuggestions(true);
            setActiveInput('pickup');
            setTimeout(updatePosition, 10);
          } else {
            setPickupSuggestions([]);
          }
        }
      );
    } else {
      setPickupSuggestions([]);
    }
  }, [pickupInput, mapsLoaded]);

  useEffect(() => {
    if (!mapsLoaded) return;
    if (destInput.length > 2 && autocompleteService.current) {
      autocompleteService.current.getPlacePredictions(
        {
          input: destInput,
          componentRestrictions: { country: 'pl' },
          locationBias: new google.maps.LatLng(53.7784, 20.4801),
        },
        (predictions, status) => {
          if (status === 'OK' && predictions) {
            const olsztynResults: any[] = [];
            const otherResults: any[] = [];
            
            predictions.forEach((p) => {
              const text = p.description.toLowerCase();
              if (text.includes('olsztyn') || text.includes('olszt') || text.includes('olszty') || p.description.includes('Olsztyn')) {
                olsztynResults.push(p);
              } else {
                otherResults.push(p);
              }
            });
            
            const sorted = [...olsztynResults, ...otherResults];
            setDestSuggestions(sorted);
            setShowDestSuggestions(true);
            setActiveInput('dest');
            setTimeout(updatePosition, 10);
          } else {
            setDestSuggestions([]);
          }
        }
      );
    } else {
      setDestSuggestions([]);
    }
  }, [destInput, mapsLoaded]);

  const handlePickupSelect = (prediction: any) => {
    setPickupInput(prediction.description);
    setShowPickupSuggestions(false);
    
    if (geocoder.current) {
      geocoder.current.geocode({ placeId: prediction.place_id }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          const address = results[0].formatted_address;
          
          setPickup({ address, coords: { lat, lng } });
          setMapCenter({ lat, lng });
          setMapZoom(15);
          if (mapRef.current) {
            mapRef.current.panTo({ lat, lng });
            mapRef.current.setZoom(15);
          }
        }
      });
    }
  };

  const handleDestSelect = (prediction: any) => {
    setDestInput(prediction.description);
    setShowDestSuggestions(false);
    
    if (geocoder.current) {
      geocoder.current.geocode({ placeId: prediction.place_id }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          const address = results[0].formatted_address;
          
          setDestination({ address, coords: { lat, lng } });
          if (mapRef.current) {
            mapRef.current.panTo({ lat, lng });
            mapRef.current.setZoom(15);
          }
        }
      });
    }
  };

  // Obliczanie trasy
  useEffect(() => {
    if (!mapsLoaded) return;
    if (pickup.coords && destination.coords.lat !== 0) {
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: pickup.coords,
          destination: destination.coords,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK' && result) {
            setDirections(result);
            if (mapRef.current && result.routes[0].bounds) {
              mapRef.current.fitBounds(result.routes[0].bounds);
            }
          }
        }
      );
    } else {
      setDirections(null);
    }
  }, [pickup.coords, destination.coords, mapsLoaded]);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      
      if (geocoder.current) {
        geocoder.current.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const address = results[0].formatted_address;
            setDestination({ address, coords: { lat, lng } });
            setDestInput(address);
          } else {
            setDestination({
              address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
              coords: { lat, lng }
            });
            setDestInput(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }
        });
      }
    }
  };

  const handleOrderTrip = async () => {
    if (!destination.address) {
      alert('Proszę wybrać miejsce docelowe (wpisz lub kliknij na mapie)');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const clientId = localStorage.getItem('userId');

      const tripData = {
        clientId: clientId ? parseInt(clientId) : null,
        pickupLat: pickup.coords.lat,
        pickupLng: pickup.coords.lng,
        pickupAddress: pickup.address,
        dropoffLat: destination.coords.lat,
        dropoffLng: destination.coords.lng,
        dropoffAddress: destination.address,
        passengerCount: 1,
        notes: 'Zamówienie z panelu web'
      };

      const response = await axios.post(`${API_URL}/trips/request`, tripData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 201) {
        navigate('/active-trip');
      }
    } catch (error) {
      console.error(error);
      alert('Nie udało się zamówić kursu.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Czy na pewno chcesz się wylogować?')) {
      localStorage.clear();
      navigate('/');
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  if (isCheckingTrip) {
    return (
      <div className="user-page-wrapper">
        <header className="user-header">
          <div className="user-logo"><span className="user-logo-text">MICHELIN</span></div>
          <div className="user-header-actions">
            <span className="welcome-text">Witaj, {firstName}!</span>
            <button className="user-menu-btn" onClick={toggleMenu}>☰</button>
          </div>
        </header>
        <div className="user-main-content" style={{ justifyContent: 'center', alignItems: 'center', padding: 50 }}>
          <p>Sprawdzanie aktywnych kursów...</p>
        </div>
      </div>
    );
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="user-page-wrapper">
        <header className="user-header">
          <div className="user-logo"><span className="user-logo-text">MICHELIN</span></div>
          <div className="user-header-actions">
            <span className="welcome-text">Witaj, {firstName}!</span>
            <button className="user-menu-btn" onClick={toggleMenu}>☰</button>
          </div>
        </header>
        <div className="user-main-content" style={{ justifyContent: 'center', alignItems: 'center', padding: 50 }}>
          <h2 style={{ color: 'red' }}>⚠️ Błąd konfiguracji</h2>
          <p>Brak klucza Google Maps API. Dodaj plik .env z VITE_GOOGLE_MAPS_API_KEY</p>
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
        <button className="user-menu-item">Rezerwacja auta</button>
        <button className="user-menu-item">Zamów TAXI</button>
        <button className="user-menu-item">Status przejazdu</button>
        <button className="user-menu-item">Zgłoś usterkę</button>
        <div className="user-menu-bottom">
          <button className="user-menu-item">Historia przejazdów</button>
          <button className="user-menu-item logout-text" onClick={handleLogout}>Wyloguj się</button>
        </div>
      </div>

      <div className="user-main-content">
        <aside className="user-sidebar">
          <div className="form-card">
            <h2 className="form-title">Zaplanuj trasę</h2>
  
            <div className="input-group">
              <label>MIEJSCE ODBIORU</label>
              <div className="input-with-marker">
                <div className="marker-pickup"></div>
                <div className="input-field-wrapper">
                  <input
                    ref={setPickupInputRef}
                    type="text"
                    value={pickupInput}
                    onChange={(e) => setPickupInput(e.target.value)}
                    onFocus={() => setShowPickupSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 200)}
                    placeholder="Wpisz adres lub nazwę miejsca..."
                    className="places-input"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={locatingPickup}
                    className="location-btn"
                    title="Użyj mojej lokalizacji"
                    style={{
                      background: '#f0f4f8',
                      border: '1px solid #dde1e5',
                      borderRadius: '8px',
                      width: '44px', 
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0, 
                      cursor: 'pointer',
                      fontSize: '18px',
                      transition: 'all 0.2s',
                    }}
                  >
                    {locatingPickup ? '⏳' : <div className="marker-current"></div>}
                  </button>
                </div>
              </div>
            </div>

            <div className="input-group">
              <label>MIEJSCE DOCELOWE</label>
              <div className="input-with-marker">
                <div className="marker-destination"></div>
                <div className="input-field-wrapper">
                  <input
                    ref={setDestInputRef}
                    type="text"
                    value={destInput}
                    onChange={(e) => setDestInput(e.target.value)}
                    onFocus={() => setShowDestSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowDestSuggestions(false), 200)}
                    placeholder="Wpisz adres lub nazwę miejsca..."
                    className="places-input"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            <div className="input-group">
              <label style={{ color: '#0a1d56' }}>🎯 LUB ZAZNACZ NA MAPIE</label>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Kliknij w dowolne miejsce na mapie, aby ustawić cel podróży
              </p>
            </div>

            <button className="order-btn" onClick={handleOrderTrip} disabled={loading}>
              {loading ? 'ZAMAWIANIE...' : 'ZAMÓW PRZEJAZD'}
            </button>
          </div>
        </aside>

        <main className="user-map-area">
          {!mapError ? (
            <LoadScript 
              googleMapsApiKey={GOOGLE_MAPS_API_KEY}
              libraries={libraries}
              onError={() => setMapError(true)}
              onLoad={() => {
                console.log('✅ Mapy Google załadowane');
                setMapsLoaded(true);
                initServices();
              }}
            >
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
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
                      <div className="loading-spinner" style={{ margin: '0 auto', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #002255', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      <p style={{ marginTop: 10, color: '#666' }}>Ładowanie mapy...</p>
                    </div>
                  </div>
                )}
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={mapZoom}
                  onClick={handleMapClick}
                  onLoad={(map) => { 
                    mapRef.current = map;
                  }}
                >
                  {myPhysicalLocation && (
                    <Marker 
                      position={myPhysicalLocation} 
                      icon={mapIcons.current}
                      zIndex={100}
                      title="Twoja lokalizacja"
                    />
                  )}
                  <Marker
                    position={pickup.coords}
                    icon={mapIcons.pickup}
                    zIndex={50}
                    title="Miejsce odbioru"
                  />
                  {destination.coords.lat !== 0 && (
                    <Marker 
                      position={destination.coords} 
                      icon={mapIcons.destination}
                      zIndex={50}
                      title="Miejsce docelowe"
                    />
                  )}
                  {directions && <DirectionsRenderer directions={directions} options={{
                    preserveViewport: true,
                    suppressMarkers: true,
                    polylineOptions: { strokeColor: "#002255", strokeWeight: 5, strokeOpacity: 0.6}
                  }} />}
                </GoogleMap>
              </div>
            </LoadScript>
          ) : (
            <div className="map-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
              <span className="map-placeholder-text">⚠️ Błąd ładowania mapy</span>
              <p style={{ marginTop: 10 }}>Sprawdź klucz API Google Maps</p>
            </div>
          )}
        </main>
      </div>

      {/* PORTAL - podpowiedzi dla pickup */}
      {showPickupSuggestions && pickupSuggestions.length > 0 && pickupInputRef && createPortal(
        <ul 
          className="places-list-portal"
          style={{
            position: 'absolute',
            top: suggestionsPosition.top,
            left: suggestionsPosition.left,
            width: suggestionsPosition.width,
            zIndex: 999999,
          }}
        >
          {pickupSuggestions.map((suggestion) => (
            <li
              key={suggestion.place_id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handlePickupSelect(suggestion)}
              className="places-item-portal"
            >
              📍 {suggestion.description}
            </li>
          ))}
        </ul>,
        document.body
      )}

      {/* PORTAL - podpowiedzi dla destination */}
      {showDestSuggestions && destSuggestions.length > 0 && destInputRef && createPortal(
        <ul 
          className="places-list-portal"
          style={{
            position: 'absolute',
            top: suggestionsPosition.top,
            left: suggestionsPosition.left,
            width: suggestionsPosition.width,
            zIndex: 999999,
          }}
        >
          {destSuggestions.map((suggestion) => (
            <li
              key={suggestion.place_id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleDestSelect(suggestion)}
              className="places-item-portal"
            >
              📍 {suggestion.description}
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  );
};

export default HomePageUser;