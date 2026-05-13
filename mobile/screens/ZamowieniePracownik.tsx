import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Alert, ActivityIndicator, Keyboard, Dimensions, Animated, PanResponder, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete';
import MapView, { PROVIDER_DEFAULT, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import { io } from 'socket.io-client';

import MapViewDirections from 'react-native-maps-directions';
import { GOOGLE_MAPS_API_KEY, API_URL } from './config';

export default function ZamowieniePracownik({ navigation }: any) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [firstName, setFirstName] = useState<string>('Pracownik');
  const mapRef = useRef<MapView>(null);

  // --- STANY DLA AKTYWNEGO KURSU ---
  // idle = formularz, pending = szuka, assigned = kierowca jedzie po klienta, in_progress = klient w aucie
  const [tripStatus, setTripStatus] = useState<'idle' | 'pending' | 'assigned' | 'in_progress'>('idle');
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState({ latitude: 0, longitude: 0 });
  
  // Przechowuje czas (minuty) i dystans (km), które oblicza mapa
  const [etaInfo, setEtaInfo] = useState({ distance: 0, duration: 0 });
  
  const pickupRef = useRef<GooglePlacesAutocompleteRef>(null);
  const destinationRef = useRef<GooglePlacesAutocompleteRef>(null);

  const [region, setRegion] = useState<Region>({
    latitude: 53.7784,
    longitude: 20.4801,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [pickup, setPickup] = useState({
    address: '',
    coords: { latitude: 0, longitude: 0 }
  });

  const [destination, setDestination] = useState({
    address: '',
    coords: { latitude: 0, longitude: 0 }
  });

  const [passengerCount, setPassengerCount] = useState<number>(1);

  // --- BOTTOM SHEET LOGIC ---
  const screenHeight = Dimensions.get('window').height;
  const MAX_HEIGHT = screenHeight * 0.85; 
  const MIN_HEIGHT = 100;                 
  const MID_HEIGHT = 450; 

  const animatedHeight = useRef(new Animated.Value(MID_HEIGHT)).current;
  const currentHeight = useRef(MID_HEIGHT);

  useEffect(() => {
    const listener = animatedHeight.addListener(({ value }) => {
      currentHeight.current = value;
    });
    return () => animatedHeight.removeListener(listener);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        Keyboard.dismiss(); 
        animatedHeight.setOffset(currentHeight.current);
        animatedHeight.setValue(0);
      },
      onPanResponderMove: (e, gestureState) => {
        animatedHeight.setValue(-gestureState.dy);
      },
      onPanResponderRelease: () => {
        animatedHeight.flattenOffset();
        
        let targetHeight = MID_HEIGHT;
        if (currentHeight.current > MID_HEIGHT + 50) targetHeight = MAX_HEIGHT;
        else if (currentHeight.current < MID_HEIGHT - 50) targetHeight = MIN_HEIGHT;
        
        if (targetHeight > MAX_HEIGHT) targetHeight = MAX_HEIGHT;
        if (targetHeight < MIN_HEIGHT) targetHeight = MIN_HEIGHT;

        Animated.spring(animatedHeight, {
          toValue: targetHeight,
          useNativeDriver: false,
          friction: 8,
          tension: 50
        }).start();
      }
    })
  ).current;

  const TextLogo = () => (
    <View style={{ backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4 }}>
      <Text style={{ color: '#0a1d56', fontWeight: '900', fontSize: 20, fontStyle: 'italic', letterSpacing: 1 }}>MICHELIN</Text>
    </View>
  );

  useEffect(() => {
    const fetchUserData = async () => {
      const name = await AsyncStorage.getItem('userName');
      if (name) setFirstName(name.split(' ')[0]);
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    })();
  }, []);

  // --- WEBSOCKETY I SPRAWDZANIE AKTYWNEGO KURSU ---
  useEffect(() => {
    const fetchActiveTrip = async () => {
      const clientId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('userToken');
      if (!clientId || !token) return;
      
      try {
        const res = await axios.get(`${API_URL}/trips/client/${clientId}/active`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data) {
          console.log("✅ Znaleziono aktywny kurs:", res.data.status);
          setActiveTrip(res.data);
          setTripStatus(res.data.status); 
          
          // Jeśli kurs jest już przypisany, ustaw kordynaty odbioru z bazy
          if (res.data.pickupLat && res.data.pickupLng) {
            setPickup(prev => ({
              ...prev,
              coords: { 
                latitude: Number(res.data.pickupLat), 
                longitude: Number(res.data.pickupLng) 
              }
            }));
          }
        }
      } catch (e) { console.log('Brak aktywnego kursu'); }
    };

    fetchActiveTrip();

    const socket = io(API_URL);

    socket.on('trip_assigned', (data) => {
      console.log("🔔 Sygnał: Kierowca przyjął zlecenie!");
      fetchActiveTrip(); // Odświeżamy dane, aby dostać driverId
    });

    socket.on('trip_started', () => {
      setTripStatus('in_progress');
    });

    socket.on('trip_completed', () => {
      setTripStatus('idle');
      setActiveTrip(null);
      Alert.alert("Koniec kursu", "Dziękujemy!");
    });

    return () => { socket.disconnect(); };
  }, []);

// --- NOWY EFFECT: ŚLEDZENIE KIEROWCY Z BAZY DANYCH ---
  useEffect(() => {
    let intervalId: any;

    // Odpalamy śledzenie TYLKO wtedy, gdy kurs jest przypisany lub w trakcie,
    // i znamy ID kierowcy, który go realizuje.
    if ((tripStatus === 'assigned' || tripStatus === 'in_progress') && activeTrip?.driverId) {
      
      const fetchDriverLocation = async () => {
        try {
          const token = await AsyncStorage.getItem('userToken');
          // Odpytujemy serwer o usera, który jest naszym kierowcą
          const response = await axios.get(`${API_URL}/users/${activeTrip.driverId}`, {
             headers: { Authorization: `Bearer ${token}` }
          });
          
          const driverData = response.data;
          
          // Jeśli kierowca ma współrzędne, aktualizujemy marker!
          if (driverData && driverData.currentLat && driverData.currentLng) {
            const newCoords = {
              latitude: Number(driverData.currentLat),
              longitude: Number(driverData.currentLng)
            };
            setDriverLocation(newCoords);

            // AUTO-FOCUS: Jeśli kierowca jedzie do nas, wyśrodkuj mapę, żeby go widzieć
            if (tripStatus === 'assigned' && mapRef.current) {
              mapRef.current.animateToRegion({
                ...newCoords,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }, 1000);
            }
          }
        } catch (error) {
          console.log("Błąd pobierania pozycji kierowcy", error);
        }
      };

      // Pobierz od razu po przypisaniu...
      fetchDriverLocation();
      
      // ...a potem odświeżaj co 2 sekundy
      intervalId = setInterval(fetchDriverLocation, 2000);
    }

    // Wyczyszczenie interwału gdy kurs się skończy lub zmieni się status
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [tripStatus, activeTrip]);

  // 🔥 POLLING DLA PRACOWNIKA (co 5 sekund) - Synchronizacja statusu
  useEffect(() => {
    // Nie odpytuj, jeśli nie ma aktywnego kursu (jest idle) 
    // lub jeśli kurs został już zakończony/anulowany na ekranie
    if (tripStatus === 'idle' || tripStatus === 'completed' || tripStatus === 'cancelled') return;

    const syncTripStatus = async () => {
      try {
        const clientId = await AsyncStorage.getItem('userId');
        const token = await AsyncStorage.getItem('userToken');
        if (!clientId || !token) return;

        // Odpytujemy o nasz aktywny kurs
        const res = await axios.get(`${API_URL}/trips/client/${clientId}/active`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data && res.data.id) {
          // KURS NADAL TRWA - sprawdzamy czy status się zmienił
          if (res.data.status !== tripStatus) {
            console.log(`🔄 [Sync] Zmiana statusu: ${tripStatus} -> ${res.data.status}`);
            setTripStatus(res.data.status);
            setActiveTrip(res.data);
          }
        } else {
          // KURS ZNIKNĄŁ Z "AKTYWNYCH"
          // Oznacza to, że jego status w bazie zmienił się na 'completed' lub 'cancelled'
          console.log(`🔄 [Sync] Kurs zniknął z aktywnych. Przywracam stan początkowy.`);
          
          setTripStatus('idle'); // Wracamy do widoku zamawiania
          setActiveTrip(null);
          setPickup({ address: '', coords: { latitude: 0, longitude: 0 } });
          setDestination({ address: '', coords: { latitude: 0, longitude: 0 } });
          
          Alert.alert("Status przejazdu", "Twój kurs został zakończony.");
        }
      } catch (e) {
        console.log('Błąd synchronizacji statusu (Polling):', e);
      }
    };

    const interval = setInterval(syncTripStatus, 5000);
    return () => clearInterval(interval);
  }, [tripStatus, activeTrip?.id]);


  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Odmowa', 'Aplikacja potrzebuje GPS do działania.');
        setLoadingLocation(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const newCoords = { latitude: location.coords.latitude, longitude: location.coords.longitude };

      const [addressObj] = await Location.reverseGeocodeAsync(newCoords);
      const myAddr = addressObj 
        ? `${addressObj.street || ''} ${addressObj.name || ''}, ${addressObj.city || ''}`.trim().replace(/^,/, '')
        : "Moja lokalizacja";
      
      setPickup({ address: myAddr, coords: newCoords });
      pickupRef.current?.setAddressText(myAddr); 
      setRegion({ ...newCoords, latitudeDelta: 0.005, longitudeDelta: 0.005 });
      
      if (mapRef.current) {
        mapRef.current.animateToRegion({ ...newCoords, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 1000);
      }
    } catch (err) {
      Alert.alert('Błąd', 'Nie udało się pobrać lokalizacji.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const onMapPress = async (e: any) => {
    Keyboard.dismiss();
    pickupRef.current?.blur();
    destinationRef.current?.blur();

    const coords = e.nativeEvent.coordinate;
    
    try {
      const [addressObj] = await Location.reverseGeocodeAsync(coords);
      const fullAddress = addressObj 
        ? `${addressObj.street || ''} ${addressObj.name || ''}, ${addressObj.city || ''}`.trim().replace(/^,/, '')
        : "Wybrany punkt na mapie";
      
      setDestination({ address: fullAddress, coords });
      destinationRef.current?.setAddressText(fullAddress); 
    } catch (err) {
      setDestination({ address: "Wybrany punkt", coords });
      destinationRef.current?.setAddressText("Wybrany punkt");
    }
  };

  const handleOrderTrip = async () => {
    if (!pickup.coords.latitude || !destination.coords.latitude) {
      Alert.alert("Błąd", "Wybierz poprawne miejsce początkowe i docelowe.");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const clientId = await AsyncStorage.getItem('userId');

      const tripData = {
        clientId: clientId ? parseInt(clientId) : null,
        pickupLat: pickup.coords.latitude,
        pickupLng: pickup.coords.longitude,
        pickupAddress: pickup.address,
        dropoffLat: destination.coords.latitude,
        dropoffLng: destination.coords.longitude,
        dropoffAddress: destination.address,
        passengerCount: passengerCount,
        notes: "Zamówienie z aplikacji mobilnej"
      };

      const response = await axios.post(`${API_URL}/trips/request`, tripData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 201) {
        setTripStatus('pending'); 
        setActiveTrip(response.data);
        Animated.spring(animatedHeight, { toValue: MID_HEIGHT, useNativeDriver: false }).start(); // Obniż panel po zamówieniu
      }
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się zamówić kursu.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Wylogowanie', 'Czy na pewno chcesz się wylogować?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Wyloguj', style: 'destructive', onPress: async () => { await AsyncStorage.clear(); navigation.replace('Login'); } },
    ]);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextLogo />
        <View style={styles.headerButtons}>
          <Text style={{ color: 'white', marginRight: 15, fontWeight: 'bold' }}>Witaj, {firstName}!</Text>
          <Pressable onPress={toggleMenu} style={styles.menuButton}>
            <Ionicons name="menu" size={28} color="white" />
          </Pressable>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.mapBackground}
          provider={PROVIDER_DEFAULT}
          region={region}
          showsUserLocation={true}
          onPress={tripStatus === 'idle' ? onMapPress : undefined} // Blokuj klikanie w trakcie kursu
        >          
          {/* SKĄD I DOKĄD */}
          {pickup.coords.latitude !== 0 && <Marker coordinate={pickup.coords} title="Skąd" pinColor="blue" />}
          {destination.coords.latitude !== 0 && <Marker coordinate={destination.coords} title="Dokąd" pinColor="red" />}

          {/* KIEROWCA NA MAPIE */}
          {driverLocation.latitude !== 0 && (tripStatus === 'assigned' || tripStatus === 'in_progress') && (
            <Marker 
              coordinate={driverLocation} 
              title="Twój kierowca"
              anchor={{ x: 0.5, y: 0.5 }} // Centrowanie ikony
            >
              <View style={{
                backgroundColor: '#0a1d56',
                padding: 5,
                borderRadius: 20,
                borderWidth: 2,
                borderColor: '#fff',
                elevation: 5
              }}>
                <Ionicons name="car-sport" size={22} color="white" />
              </View>
            </Marker>
          )}
          
          {/* TRASA 1: PLANOWANIE */}
          {(tripStatus === 'idle' || tripStatus === 'pending') && pickup.coords.latitude !== 0 && destination.coords.latitude !== 0 && (
            <MapViewDirections
              origin={pickup.coords}
              destination={destination.coords}
              apikey={GOOGLE_MAPS_API_KEY}
              strokeWidth={5}
              strokeColor="#0a1d56"
              onReady={(result) => {
                mapRef.current?.fitToCoordinates(result.coordinates, { edgePadding: { right: 50, bottom: 420, left: 50, top: 50 } });
              }}
            />
          )}

          {/* TRASA 2: KIEROWCA -> KLIENT */}
              {tripStatus === 'assigned' && 
           driverLocation.latitude !== 0 && 
           pickup.coords.latitude !== 0 && (
            <MapViewDirections
              origin={driverLocation}
              destination={pickup.coords}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={5}
            strokeColor="#f39c12"
            onReady={(result) => {
              console.log(`ETA do klienta: ${result.duration} min`);
              // Ustawiamy stan tylko jeśli wartości są sensowne
              if (result.duration > 0) {
                setEtaInfo({
                  distance: result.distance,
                  duration: result.duration
                });
              }
              mapRef.current?.fitToCoordinates(result.coordinates, {
                edgePadding: { right: 50, bottom: 100, left: 50, top: 100 }
              });
            }}
            onError={(errorMessage) => {
              console.error("Błąd trasy Directions:", errorMessage);
            }}
          />
        )}

          {/* TRASA 3: W TRAKCIE KURSU (Zielona) */}
          {tripStatus === 'in_progress' && driverLocation.latitude !== 0 && destination.coords.latitude !== 0 && (
            <MapViewDirections
              origin={driverLocation}
              destination={destination.coords}
              apikey={GOOGLE_MAPS_API_KEY}
              strokeWidth={5}
              strokeColor="#27ae60" 
              onReady={(result) => {
                setEtaInfo({ distance: result.distance, duration: result.duration });
                mapRef.current?.fitToCoordinates(result.coordinates, { edgePadding: { right: 50, bottom: 420, left: 50, top: 50 } });
              }}
            />
          )}
        </MapView>
      </View>

      <Animated.View style={[styles.bottomSheet, { height: animatedHeight }]}>
        
        <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
          <View style={styles.dragPill} />
          <Text style={styles.formTitle}>Zaplanuj trasę</Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
          
          {/* --- STAN 1: FORMULARZ ZAMÓWIENIA --- */}
          {tripStatus === 'idle' && (
            <View>
              <Text style={styles.inputLabel}>MIEJSCE ODBIORU</Text>
              <View style={styles.inputRow}>
                <View style={[styles.inputWrapper, { flex: 1, zIndex: 10 }]}>
                  <Ionicons name="location" size={20} color="#0a1d56" style={styles.inputIcon} />
                  <GooglePlacesAutocomplete
                    ref={pickupRef}
                    placeholder='Wpisz adres lub nazwę miejsca...'
                    fetchDetails={true}
                    keyboardShouldPersistTaps="handled"
                    onPress={(data, details = null) => {
                      if (details) {
                        const coords = { latitude: details.geometry.location.lat, longitude: details.geometry.location.lng };
                        setPickup({ address: data.description, coords });
                        setRegion({ ...coords, latitudeDelta: 0.005, longitudeDelta: 0.005 });
                      }
                    }}
                    query={{ key: GOOGLE_MAPS_API_KEY, language: 'pl', types: 'address', components: 'country:pl', location: '53.7784,20.4801', radius: '20000', strictbounds: true }}
                    styles={autocompleteStyles}
                    textInputProps={{ placeholderTextColor: '#999', onFocus: () => { Animated.spring(animatedHeight, { toValue: MAX_HEIGHT, useNativeDriver: false }).start(); } }}
                  />
                </View>
                <Pressable style={styles.locationBtn} onPress={getCurrentLocation} disabled={loadingLocation}>
                  {loadingLocation ? <ActivityIndicator size="small" color="#0a1d56" /> : <Ionicons name="locate" size={22} color="#0a1d56" />}
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>MIEJSCE DOCELOWE</Text>
              <View style={[styles.inputWrapper, { zIndex: 5 }]}>
                <Ionicons name="flag" size={20} color="#dc3545" style={styles.inputIcon} />
                <GooglePlacesAutocomplete
                  ref={destinationRef}
                  placeholder='Wpisz adres lub nazwę miejsca...'
                  fetchDetails={true}
                  keyboardShouldPersistTaps="handled"
                  onPress={(data, details = null) => {
                    if (details) {
                      const coords = { latitude: details.geometry.location.lat, longitude: details.geometry.location.lng };
                      setDestination({ address: data.description, coords });
                    }
                  }}
                  query={{ key: GOOGLE_MAPS_API_KEY, language: 'pl', types: 'address', components: 'country:pl', location: '53.7784,20.4801', radius: '20000', strictbounds: true }}
                  styles={autocompleteStyles}
                  textInputProps={{ placeholderTextColor: '#999', onFocus: () => { Animated.spring(animatedHeight, { toValue: MAX_HEIGHT, useNativeDriver: false }).start(); } }}
                />
              </View>

              <View style={styles.hintContainer}>
                <Text style={styles.hintTitle}>🎯 LUB ZAZNACZ NA MAPIE</Text>
                <Text style={styles.hintText}>Kliknij w dowolne miejsce na mapie, aby ustawić cel podróży</Text>
              </View>

              <Text style={styles.inputLabel}>LICZBA PASAŻERÓW</Text>
              <View style={styles.passengerContainer}>
                <Pressable style={[styles.counterBtn, passengerCount <= 1 && styles.counterBtnDisabled]} onPress={() => setPassengerCount(p => Math.max(1, p - 1))}>
                  <Ionicons name="remove" size={24} color="white" />
                </Pressable>
                <Text style={styles.passengerCountText}>{passengerCount}</Text>
                <Pressable style={[styles.counterBtn, passengerCount >= 8 && styles.counterBtnDisabled]} onPress={() => setPassengerCount(p => Math.min(8, p + 1))}>
                  <Ionicons name="add" size={24} color="white" />
                </Pressable>
              </View>

              <Pressable 
                style={[styles.orderButton, (!destination.coords.latitude || !pickup.coords.latitude || loading) && { opacity: 0.7 }]} 
                onPress={handleOrderTrip} disabled={loading || !destination.coords.latitude || !pickup.coords.latitude}
              >
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.orderButtonText}>ZAMÓW PRZEJAZD</Text>}
              </Pressable>
            </View>
          )}

          {/* --- STAN 2: SZUKA KIEROWCY --- */}
          {tripStatus === 'pending' && (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <ActivityIndicator size="large" color="#0a1d56" />
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#0a1d56', marginTop: 20 }}>Szukanie kierowcy...</Text>
              <Text style={{ textAlign: 'center', color: '#666', marginTop: 10 }}>Powiadomiliśmy kierowców w Twojej okolicy.</Text>
            </View>
          )}

          {/* --- STAN 3: KIEROWCA W DRODZE --- */}
          {tripStatus === 'assigned' && (
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <Ionicons name="car" size={60} color="#f39c12" />
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#333' }}>Kierowca w drodze!</Text>
              <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#f39c12', padding: 15, borderRadius: 10, width: '100%', marginTop: 20, alignItems: 'center' }}>
                 <Text style={{ fontSize: 30, fontWeight: '900', color: '#27ae60' }}>
                    {Math.ceil(etaInfo.duration) || 1} min
                  </Text>
                 <Text style={{ color: '#666', fontWeight: 'bold' }}>Do przyjazdu ({etaInfo.distance.toFixed(1)} km)</Text>
              </View>
            </View>
          )}

          {/* --- STAN 4: W TRAKCIE KURSU --- */}
          {tripStatus === 'in_progress' && (
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <Ionicons name="location" size={60} color="#27ae60" />
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#333' }}>Jedziesz do celu</Text>
              <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#27ae60', padding: 15, borderRadius: 10, width: '100%', marginTop: 20, alignItems: 'center' }}>
                 <Text style={{ fontSize: 30, fontWeight: '900', color: '#27ae60' }}>{Math.ceil(etaInfo.duration)} min</Text>
                 <Text style={{ color: '#666', fontWeight: 'bold' }}>Pozostało ({etaInfo.distance.toFixed(1)} km)</Text>
              </View>
              <Pressable style={{ marginTop: 20, padding: 12, backgroundColor: '#fff3cd', borderWidth: 1, borderColor: '#ffeeba', borderRadius: 8, width: '100%', alignItems: 'center' }}>
                <Text style={{ color: '#856404', fontWeight: 'bold' }}>Zgłoś usterkę pojazdu</Text>
              </Pressable>
            </View>
          )}

        </ScrollView>
      </Animated.View>

      {/* MENU BOCZNE */}
      {isMenuOpen && <Pressable style={styles.overlay} onPress={closeMenu} />}
      <View style={[styles.sideMenu, isMenuOpen && styles.sideMenuOpen]}>
        <Pressable style={styles.closeMenuBtn} onPress={closeMenu}>
          <Ionicons name="close" size={28} color="#333" />
        </Pressable>
        <View style={styles.menuHeader}>
          <Text style={styles.menuHeaderText}>Twój Profil</Text>
        </View>

        {/* POZYCJE MENU (PRZENIESIONE WYŻEJ + IKONY) */}
        <Pressable 
          style={[styles.menuItem, { backgroundColor: '#f8f9fa', borderLeftWidth: 4, borderLeftColor: '#0a1d56', paddingLeft: 16, marginLeft: -20, marginRight: -20 }]} 
          onPress={closeMenu}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="car-sport" size={22} color="#0a1d56" style={{ marginRight: 12 }} />
            <Text style={[styles.menuItemText, { fontWeight: 'bold', color: '#0a1d56' }]}>Zamów TAXI</Text>
          </View>
        </Pressable>

        <Pressable 
          style={[styles.menuItem, { paddingLeft: 20, marginLeft: -20, marginRight: -20 }]} 
          onPress={() => { closeMenu(); navigation.navigate('HistoriaPracownik'); }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="time-outline" size={22} color="#555" style={{ marginRight: 12 }} />
            <Text style={styles.menuItemText}>Historia przejazdów</Text>
          </View>
        </Pressable>

        {/* DOLNA SEKCJA - TYLKO WYLOGUJ */}
        <View style={styles.menuBottom}>
          <Pressable style={[styles.menuItem, { paddingLeft: 20, marginLeft: -20, marginRight: -20, borderBottomWidth: 0 }]} onPress={handleLogout}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="log-out-outline" size={22} color="#dc3545" style={{ marginRight: 12 }} />
              <Text style={styles.logoutText}>Wyloguj się</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  header: {
    backgroundColor: '#0a1d56', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    zIndex: 100, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 3,
  },
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  menuButton: { padding: 0 },
  mapContainer: { flex: 1, backgroundColor: '#e0e0e0' },
  mapBackground: { ...StyleSheet.absoluteFillObject },
  
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1500, elevation: 25 },
  sideMenu: {
  position: 'absolute', top: 0, right: '-100%', bottom: 0, width: 280,
  backgroundColor: '#fff', zIndex: 2000, paddingTop: 60, paddingHorizontal: 20,
  shadowColor: '#000', shadowOffset: { width: -2, height: 0 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 30, // Tutaj zmiana z 15 na 30
  },
  sideMenuOpen: { right: 0 },
  closeMenuBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  menuHeader: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 15, marginBottom: 10 },
  menuHeaderText: { fontSize: 20, fontWeight: 'bold', color: '#0a1d56' },
  menuItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f4f6f9' },
  menuItemText: { fontSize: 16, color: '#333', fontWeight: '500' },
  menuBottom: { marginTop: 'auto', marginBottom: 40, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  logoutText: { fontSize: 16, color: '#dc3545', fontWeight: 'bold' },

  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#f4f6f9',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: "#000", shadowOpacity: 0.2, shadowOffset: { width: 0, height: -5 },
    shadowRadius: 10, elevation: 20, zIndex: 1000,
  },
  dragHandleArea: {
    paddingTop: 15, paddingBottom: 10,
    alignItems: 'center', backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderBottomWidth: 1, borderBottomColor: '#ddd',
  },
  dragPill: { width: 40, height: 5, backgroundColor: '#ccc', borderRadius: 3, marginBottom: 10 },
  formTitle: { fontSize: 22, fontWeight: 'bold', color: '#0a1d56' },
  
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 5, marginTop: 15 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-start', width: '100%', zIndex: 10 },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-start', zIndex: 10 },
  inputIcon: { marginRight: 10, marginTop: 12 }, 
  
  locationBtn: {
    width: 45, height: 45, marginLeft: 10,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 3, elevation: 2,
  },

  hintContainer: { marginTop: 5, marginBottom: 5, padding: 15, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  hintTitle: { color: '#0a1d56', fontWeight: 'bold', fontSize: 13 },
  hintText: { fontSize: 12, color: '#666', marginTop: 3 },

  passengerContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    paddingHorizontal: 15, paddingVertical: 5, marginTop: 5, marginBottom: 15
  },
  counterBtn: {
    backgroundColor: '#0a1d56', width: 35, height: 35, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center'
  },
  counterBtnDisabled: { opacity: 0.5 },
  passengerCountText: { fontSize: 18, fontWeight: 'bold', color: '#333' },

  orderButton: { backgroundColor: '#0a1d56', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  orderButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

const autocompleteStyles = {
  container: { flex: 1, zIndex: 1000 },
  textInput: {
    height: 45, color: '#333', fontSize: 14,
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    backgroundColor: '#ffffff', paddingHorizontal: 15,
  },
  listView: {
    position: 'relative' as const, 
    backgroundColor: 'white', borderRadius: 8,
    elevation: 3, marginTop: 5, maxHeight: 150, zIndex: 5000,
  },
  row: { backgroundColor: '#FFFFFF', padding: 13, minHeight: 44, flexDirection: 'row' as const },
  separator: { height: 1, backgroundColor: '#eee' },
};