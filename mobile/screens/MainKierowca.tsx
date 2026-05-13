import { io, Socket } from 'socket.io-client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
  Animated,
  PanResponder
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { MainKierowcaStyles } from '../styles/MainKierowcaStyles';

import { API_URL } from './config';
import * as Location from 'expo-location';

import { 
  NavigationView,
  NavigationProvider,
  useNavigation,
  NavigationSessionStatus,
  TaskRemovedBehavior
} from '@googlemaps/react-native-navigation-sdk';

interface Vehicle {
  id: number;
  registration: string;
  brand: string;
  model: string;
  passengerCapacity: number;
  status: string;
  isBreakdown: boolean;
  currentDriverId: number | null;
}

interface Trip {
  id: number;
  pickupAddress: string;
  dropoffAddress: string;
  passengerCount: number;
  status: string;
  pickupLat: string | number;
  pickupLng: string | number;
  dropoffLat: string | number;
  dropoffLng: string | number;
}

// Oblicza odległość między dwoma punktami GPS w metrach
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const rad = Math.PI / 180;
  const a = Math.sin((lat2 - lat1) * rad / 2) ** 2 +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
            Math.sin((lon2 - lon1) * rad / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// Bezpiecznik: Upewnia się, że Google SDK inicjalizuje się tylko raz!
let globalNavInitialized = false;

function MainKierowcaContent({ navigation }: any) {
  const [loggedUser, setLoggedUser] = useState<string | null>('Kierowca');
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'map' | 'history'>('tasks');

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [assignedVehicle, setAssignedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  const [availableTasks, setAvailableTasks] = useState<Trip[]>([]); 
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);   
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const [driverLocation, setDriverLocation] = useState<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const mapCtrl = useRef<any>(null);
  const { navigationController } = useNavigation();

  type TripPhase = 'idle' | 'heading_to_pickup' | 'arrived_pickup' | 'heading_to_dropoff' | 'arrived_dropoff';
  const [tripPhase, setTripPhase] = useState<TripPhase>('idle');

  // --- DRAGGABLE BOTTOM SHEET LOGIC ---
  const screenHeight = Dimensions.get('window').height;
  const MAX_HEIGHT = screenHeight * 0.7; // Max sheet height (70% of screen)
  const MIN_HEIGHT = 80;                 // Min sheet height (Only header visible)
  const MID_HEIGHT = 320;                // Default sheet height

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
        animatedHeight.setOffset(currentHeight.current);
        animatedHeight.setValue(0);
      },
      onPanResponderMove: (e, gestureState) => {
        // Dragging UP makes dy negative. We subtract dy to INCREASE height.
        animatedHeight.setValue(-gestureState.dy);
      },
      onPanResponderRelease: (e, gestureState) => {
        animatedHeight.flattenOffset();
        
        let targetHeight = MID_HEIGHT;
        if (currentHeight.current > MID_HEIGHT + 40) targetHeight = MAX_HEIGHT;
        else if (currentHeight.current < MID_HEIGHT - 40) targetHeight = MIN_HEIGHT;
        
        // Prevent going out of bounds
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
  // ------------------------------------

  const initializeNavigation = useCallback(async () => {
    // 1. Sprawdzamy, czy aplikacja już to wcześniej odpaliła
    if (globalNavInitialized) {
      console.log('✅ SDK Google Maps już zainicjowane, pomijam okienko regulaminu.');
      return; 
    }

    try {
      const termsAccepted = await navigationController.showTermsAndConditionsDialog();
      if (!termsAccepted) return;

      const status = await navigationController.init();
      if (status === NavigationSessionStatus.OK) {
        // Zapisujemy w globalnej pamięci, że wszystko poszło dobrze
        globalNavInitialized = true; 
        console.log('✅ Silnik Navigation SDK zainicjalizowany po raz pierwszy.');
      }
    } catch (e) {
      console.warn('Zignorowano błąd okna dialogowego:', e);
    }
  }, [navigationController]);


  useEffect(() => {
    let positionSubscription: any;
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      const providerStatus = await Location.getProviderStatusAsync();
      
      if (status !== 'granted' || !providerStatus.locationServicesEnabled) {
        Alert.alert('Brak lokalizacji', 'Aplikacja potrzebuje GPS.');
        return;
      }

      positionSubscription = await Location.watchPositionAsync(
      { 
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 50,
        timeInterval: 10000  
      },
      async (loc) => {
        setDriverLocation(loc);
        
        if (isMapReady && mapCtrl.current && !activeTrip) {
          try {
            mapCtrl.current.moveCamera({
              target: { lat: loc.coords.latitude, lng: loc.coords.longitude },
              zoom: 15, bearing: 0, tilt: 0
            });
          } catch (e) {}
        }
      
        if (assignedVehicle && token && userId) {
          try {
            await axios.patch(`${API_URL}/users/${userId}`, {
              currentLat: loc.coords.latitude,
              currentLng: loc.coords.longitude,
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (error) {}
        }
      });
    })();
    return () => positionSubscription?.remove();
  }, [isMapReady, activeTrip, assignedVehicle, token, userId]);

  useEffect(() => {
    const newSocket = io(API_URL, { transports: ['websocket'] });
    setSocket(newSocket);

    newSocket.on('newTrip', (trip: Trip) => {
      setAvailableTasks(prev => {
        if (prev.some(t => t.id === trip.id)) return prev;
        return [...prev, trip];
      });
    });

    newSocket.on('tripAccepted', (tripId: number) => {
      setAvailableTasks(prev => prev.filter(t => t.id !== tripId));
    });

    const getData = async () => {
  const storedToken = await AsyncStorage.getItem('userToken');
  const role = await AsyncStorage.getItem('userRole');
  const id = await AsyncStorage.getItem('userId');
  const name = await AsyncStorage.getItem('userName');
  
  // 🔥 DODAJ TO - upewnij się że authToken też istnieje
  if (storedToken) {
    await AsyncStorage.setItem('authToken', storedToken);
    console.log('✅ [MainKierowca] Skopiowano token do authToken');
  }
  
  console.log('📦 [MainKierowca] storedToken:', storedToken ? 'OK' : 'BRAK');
  console.log('📦 [MainKierowca] authToken po kopii:', await AsyncStorage.getItem('authToken') ? 'OK' : 'BRAK');
      
      if (role !== 'driver') {
        Alert.alert('Brak dostępu', 'Tylko dla kierowców', [
          { text: 'OK', onPress: () => navigation.replace('Login') },
        ]);
        return;
      }

      setToken(storedToken);
      if (id) setUserId(parseInt(id));
      if (name) setUserName(name.split(' ')[0] || 'Kierowca');

      fetchVehiclesAndCheckAssignment(storedToken, id ? parseInt(id) : null);
      fetchPendingTrips(storedToken);
    };
    getData();

    return () => newSocket.disconnect();
  }, []);


  // 🔥 POLLING DLA ZLECEŃ (co 5 sekund) - FALLBACK GDY WEBSOCKET NIE DZIAŁA
useEffect(() => {
  if (!token) return;
  
  const fetchTrips = async () => {
    try {
      const response = await axios.get(`${API_URL}/trips/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableTasks(response.data);
      console.log('🔄 [Polling] Odświeżono zlecenia, liczba:', response.data.length);
    } catch (error) {
      console.error('❌ [Polling] Błąd:', error);
    }
  };
  
  // Od razu pobierz
  fetchTrips();
  
  // Ustaw interwał co 5 sekund
  const interval = setInterval(fetchTrips, 5000);
  
  return () => clearInterval(interval);
}, [token]);



  // 🔥 SPRAWDZANIE AKTYWNEGO KURSU PRZY STARCIE APLIKACJI
useEffect(() => {
  const checkActiveTrip = async () => {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      const driverId = await AsyncStorage.getItem('userId');
      
      console.log('🔍 [Startup] Sprawdzanie aktywnego kursu...');
      console.log('🔍 [Startup] authToken:', authToken ? 'OK' : 'BRAK');
      console.log('🔍 [Startup] driverId:', driverId);
      
      if (!authToken || !driverId) return;
      
      const response = await axios.get(`${API_URL}/trips/driver/${driverId}/active`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('📡 [Startup] Odpowiedź API:', response.data);
      
      if (response.data && response.data.id) {
        console.log('✅ [Startup] Znaleziono aktywny kurs:', response.data.id);
        setActiveTrip(response.data);
        
        if (response.data.status === 'assigned') {
          setTripPhase('heading_to_pickup');
          // Uruchom nawigację do pickupu
          const waypoint = { 
            title: response.data.pickupAddress || 'Odbiór', 
            position: { lat: Number(response.data.pickupLat), lng: Number(response.data.pickupLng) } 
          };
          await navigationController.setDestinations([waypoint], { routingOptions: { travelMode: 1 } });
          await navigationController.startGuidance();
        } else if (response.data.status === 'in_progress') {
          setTripPhase('heading_to_dropoff');
          // Uruchom nawigację do dropoff
          const waypoint = { 
            title: response.data.dropoffAddress || 'Cel', 
            position: { lat: Number(response.data.dropoffLat), lng: Number(response.data.dropoffLng) } 
          };
          await navigationController.setDestinations([waypoint], { routingOptions: { travelMode: 1 } });
          await navigationController.startGuidance();
        }
      } else {
        console.log('❌ [Startup] Brak aktywnego kursu');
      }
    } catch (error) {
      console.error('❌ [Startup] Błąd sprawdzania aktywnego kursu:', error);
    }
  };
  
  // Opóźnij sprawdzanie aż mapa będzie gotowa i navigationController dostępny
  if (isMapReady && navigationController) {
    checkActiveTrip();
  }
}, [isMapReady, navigationController]);


  useEffect(() => {
  if (!activeTrip || !driverLocation) return;
  
  const dLat = driverLocation.coords.latitude;
  const dLng = driverLocation.coords.longitude;
  
  // Jeśli jedziemy po klienta, sprawdzamy odległość do punktu odbioru
  if (tripPhase === 'heading_to_pickup') {
    const dist = getDistance(dLat, dLng, Number(activeTrip.pickupLat), Number(activeTrip.pickupLng));
    if (dist < 300) { // 300 metrów promienia
      setTripPhase('arrived_pickup');
    }
  } 
  // Jeśli jedziemy do celu, sprawdzamy odległość do dropoffu
  else if (tripPhase === 'heading_to_dropoff') {
    const dist = getDistance(dLat, dLng, Number(activeTrip.dropoffLat), Number(activeTrip.dropoffLng));
    if (dist < 300) {
      setTripPhase('arrived_dropoff');
    }
  }
}, [driverLocation, activeTrip, tripPhase]);

  const fetchVehiclesAndCheckAssignment = async (authToken: string | null, driverId: number | null) => {
    if (!authToken || !driverId) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/vehicles`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setVehicles(response.data);
      const myVehicle = response.data.find((v: Vehicle) => v.currentDriverId === driverId);
      setAssignedVehicle(myVehicle || null);
    } catch (error) {
      console.error('Błąd pobierania pojazdów:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingTrips = async (authToken: string | null) => {
    if (!authToken) return;
    try {
      const response = await axios.get(`${API_URL}/trips/pending`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setAvailableTasks(response.data);
    } catch (error) {}
  };

  const handleSelectVehicle = async (vehicleId: number) => {
    if (!userId || !token) return;
    Alert.alert('Potwierdzenie', 'Czy na pewno chcesz wybrać ten pojazd?', [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Wybierz',
          onPress: async () => {
            try {
              await axios.patch(`${API_URL}/vehicles/${vehicleId}/assign-driver/${userId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
              await axios.patch(`${API_URL}/users/${userId}`, { isOnline: true }, { headers: { Authorization: `Bearer ${token}` } });
              await fetchVehiclesAndCheckAssignment(token, userId);
            } catch (error: any) {
              Alert.alert('Błąd', error.response?.data?.message || 'Nie udało się przypisać pojazdu');
            }
          },
        },
      ]);
  };

  const handleReleaseVehicle = async () => {
    if (!assignedVehicle || !token) return;
    Alert.alert('Potwierdzenie', `Zakończyć pracę z ${assignedVehicle.registration}?`, [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Zakończ',
          onPress: async () => {
            try {
              await axios.patch(`${API_URL}/vehicles/${assignedVehicle.id}/release-driver`, {}, { headers: { Authorization: `Bearer ${token}` } });
              await axios.patch(`${API_URL}/users/${userId}`, { isOnline: false }, { headers: { Authorization: `Bearer ${token}` } });
              setAssignedVehicle(null);
              await fetchVehiclesAndCheckAssignment(token, userId);
            } catch (error) {
              Alert.alert('Błąd', 'Nie udało się zwolnić pojazdu');
            }
          },
        },
      ]);
  };

  const handleLogout = () => {
    const logoutMessage = assignedVehicle 
      ? `Wylogowanie spowoduje automatyczne zakończenie pracy z pojazdem ${assignedVehicle.registration}. Czy na pewno chcesz się wylogować?` 
      : 'Czy na pewno chcesz się wylogować?';

    Alert.alert(
      'Wylogowanie',
      logoutMessage,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Wyloguj',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Jeśli jest pojazd, zwalniamy go automatycznie
              if (assignedVehicle && token) {
                await axios.patch(
                  `${API_URL}/vehicles/${assignedVehicle.id}/release-driver`,
                  {},
                  { headers: { Authorization: `Bearer ${token}` } }
                );
              }
              // 2. Ustawiamy status offline
              if (userId && token) {
                await axios.patch(
                  `${API_URL}/users/${userId}`,
                  { isOnline: false },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
              }
            } catch (e) {
              console.log('Błąd podczas czyszczenia sesji z bazy...', e);
            }
            
            // 3. Czyścimy pamięć i wracamy do logowania
            await AsyncStorage.clear();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  //AKCEPTACJA KURSU + AUTOMATYCZNE ODPAŁANIE NAWIGACJI PO KLIENTA

  const handleAcceptTask = async (tripId: number) => {
  if (!userId || !token) return;
  
  // 🔥 POBIERZ AKTUALNĄ LOKALIZACJĘ KIEROWCY
  let driverLat = null;
  let driverLng = null;
  let driverAddress = '';
  
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High
    });
    driverLat = location.coords.latitude;
    driverLng = location.coords.longitude;
    
    console.log('📍 Lokalizacja startowa przy akceptacji:', { driverLat, driverLng });
  } catch (error) {
    console.log('⚠️ Nie udało się pobrać lokalizacji startowej:', error);
  }
  
  try {
    const response = await axios.patch(
      `${API_URL}/trips/${tripId}/accept`, 
      { 
        driverId: userId,
        driverLat: driverLat,
        driverLng: driverLng,
        driverAddress: driverAddress || ''
      }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const trip = response.data;
    
    // 🔥 ZAPISZ AKTYWNY TRIP W ASYNCSTORAGE
    await AsyncStorage.setItem('activeTripId', trip.id.toString());
    
    setActiveTrip(trip);
    setAvailableTasks(prev => prev.filter(t => t.id !== tripId));
    setTripPhase('heading_to_pickup');
    
    // Automatycznie odpalamy nawigację GPS po klienta
    const waypoint = { 
      title: trip.pickupAddress || 'Odbiór', 
      position: { lat: Number(trip.pickupLat), lng: Number(trip.pickupLng) } 
    };
    await navigationController.setDestinations([waypoint], { routingOptions: { travelMode: 1 } });
    await navigationController.startGuidance();
    
  } catch (error: any) {
    Alert.alert('Błąd', error.response?.data?.message || 'Nie udało się przypisać kursu.');
  }
};

//KLIENT WSIADŁ

const handleClientBoarded = async () => {
  if (!activeTrip) return;
  
  try {
    // 🔥 WYŚLIJ PATCH DO BACKENDU
    const token = await AsyncStorage.getItem('authToken');
    await axios.patch(
      `${API_URL}/trips/${activeTrip.id}/start`,
      { driverId: userId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✅ Status kursu zmieniony na: in_progress');
    
    setTripPhase('heading_to_dropoff');
    
    // Odpalamy nawigację do celu
    const waypoint = { 
      title: activeTrip.dropoffAddress || 'Cel', 
      position: { lat: Number(activeTrip.dropoffLat), lng: Number(activeTrip.dropoffLng) } 
    };
    await navigationController.setDestinations([waypoint], { routingOptions: { travelMode: 1 } });
    await navigationController.startGuidance();
    
  } catch (error) {
    console.error('❌ Błąd zmiany statusu kursu:', error);
    Alert.alert('Błąd', 'Nie udało się zmienić statusu kursu');
  }
};
  const focusMapOnTask = async (task: Trip) => {
  if (isMapReady && mapCtrl.current && driverLocation) {
    try {
      // Ładujemy trasę (Odbiór -> Cel) do wbudowanego silnika, ale nie startujemy jeszcze nawigacji głosowej
      const waypoints = [
        { title: 'Odbiór', position: { lat: Number(task.pickupLat), lng: Number(task.pickupLng) } },
        { title: 'Cel', position: { lat: Number(task.dropoffLat), lng: Number(task.dropoffLng) } }
      ];
      await navigationController.setDestinations(waypoints, { routingOptions: { travelMode: 1 } });
      
      // Pokazujemy przegląd całej trasy z oddalenia
      if(mapCtrl.current.showRouteOverview) {
         mapCtrl.current.showRouteOverview();
      }
      
      // Zwijamy dolny panel lekko w dół, żeby kierowca miał czysty widok na mapę
      Animated.spring(animatedHeight, { toValue: MIN_HEIGHT + 60, useNativeDriver: false }).start();
    } catch(e) { console.error(e); }
  }
};

  const handleStartNavigation = async (type: 'pickup' | 'dropoff') => {
    if (!activeTrip || !isMapReady) return;
    const lat = type === 'pickup' ? activeTrip.pickupLat : activeTrip.dropoffLat;
    const lng = type === 'pickup' ? activeTrip.pickupLng : activeTrip.dropoffLng;
    const title = type === 'pickup' ? activeTrip.pickupAddress : activeTrip.dropoffAddress;

    try {
      const waypoint = { title: title || 'Cel', position: { lat: Number(lat), lng: Number(lng) } };
      await navigationController.setDestinations([waypoint], { routingOptions: { travelMode: 1 } });
      await navigationController.startGuidance();
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się uruchomić nawigacji.");
    }
  };

  const handleCompleteTrip = async () => {
  if (!activeTrip) return;
  try {
    await axios.patch(`${API_URL}/trips/${activeTrip.id}/complete`, { driverId: userId });
    
    // 🔥 USUŃ AKTYWNY TRIP Z ASYNCSTORAGE
    await AsyncStorage.removeItem('activeTripId');
    
    setActiveTrip(null); 
    setTripPhase('idle'); // Resetujemy fazę
    await navigationController.stopGuidance();
    await navigationController.clearDestinations();
    Alert.alert('Sukces', 'Kurs zakończony!');
  } catch (e) { 
    Alert.alert('Błąd', 'Nie udało się zakończyć.'); 
  }
};

  // Komponent Logo - Tekst na białym tle (Wizualnie zgodny z Web)
  const TextLogo = () => (
    <View style={{ backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4 }}>
      <Text style={{ color: '#0a1d56', fontWeight: '900', fontSize: 20, fontStyle: 'italic', letterSpacing: 1 }}>MICHELIN</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={MainKierowcaStyles.container}>
        <View style={MainKierowcaStyles.header}>
          <TextLogo />
        </View>
        <View style={MainKierowcaStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a1d56" />
          <Text>Ładowanie danych...</Text>
        </View>
      </View>
    );
  }

  // EKRAN WYBORU POJAZDU
  if (!assignedVehicle) {
    const availableVehicles = vehicles.filter(v => v.status === 'dostępny' && !v.isBreakdown);
    return (
      <View style={MainKierowcaStyles.container}>
        <View style={MainKierowcaStyles.header}>
          <TextLogo />
          <Pressable onPress={toggleMenu} style={MainKierowcaStyles.menuButton}>
            <Ionicons name="menu" size={28} color="white" />
          </Pressable>
        </View>

        <ScrollView style={MainKierowcaStyles.selectionContainer}>
          <View style={MainKierowcaStyles.selectionCard}>
            <Text style={MainKierowcaStyles.selectionTitle}>🚗 Wybór pojazdu</Text>
            <Text style={MainKierowcaStyles.selectionSubtitle}>Nie masz przypisanego pojazdu. Wybierz dostępny:</Text>
            {availableVehicles.length === 0 ? (
              <Text style={MainKierowcaStyles.noVehicles}>Brak dostępnych pojazdów.</Text>
            ) : (
              availableVehicles.map(vehicle => (
                <View key={vehicle.id} style={MainKierowcaStyles.vehicleItem}>
                  <View style={MainKierowcaStyles.vehicleInfo}>
                    <Text style={MainKierowcaStyles.vehicleName}>{vehicle.brand} {vehicle.model}</Text>
                    <Text style={MainKierowcaStyles.vehicleDetail}>Rej: {vehicle.registration}</Text>
                    <Text style={MainKierowcaStyles.vehicleDetail}>Miejsca: {vehicle.passengerCapacity}</Text>
                  </View>
                  <Pressable style={MainKierowcaStyles.selectBtn} onPress={() => handleSelectVehicle(vehicle.id)}>
                    <Text style={MainKierowcaStyles.selectBtnText}>Wybierz</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // GŁÓWNY EKRAN KIEROWCY
  return (
    <View style={MainKierowcaStyles.container}>
      <View style={MainKierowcaStyles.header}>
        <TextLogo />
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          {userName && <Text style={{color: 'white', marginRight: 15, fontWeight: 'bold'}}>Witaj, {userName}!</Text>}
          <Pressable onPress={toggleMenu} style={MainKierowcaStyles.menuButton}>
            <Ionicons name="menu" size={28} color="white" />
          </Pressable>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'tasks' && (
          <View style={{ flex: 1, flexDirection: 'column' }}>
            
            {/* MAPA ZAWSZE NA GÓRZE */}
            <View style={{ flex: 1 }}>
              <NavigationView style={{ flex: 1 }} onMapViewControllerCreated={(ctrl: any) => { mapCtrl.current = ctrl; }} 
                 navigationUIEnabled={true}      
                 myLocationEnabled={true}        
                 myLocationButtonEnabled={true}  
                 onMapReady={() => {
                   setIsMapReady(true);
                   // Inicjuj SDK i pokazuj regulamin DOPIERO GDY MAPA JEST GOTOWA
                   initializeNavigation(); 
                 }}
              />
            </View>

            {/* 2. ZLECENIA NA DOLE (Draggable Bottom Sheet) */}
            {/* ZAWSZE POKAZUJ PANEL AKTYWNEGO KURSU JAKO PIERWSZY */}
{activeTrip ? (
  <View style={{ 
    height: 280, 
    backgroundColor: 'white', 
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0
  }}>
    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0a1d56', marginBottom: 15, textAlign: 'center' }}>
      🚕 AKTYWNY KURS #{activeTrip.id}
    </Text>

    <View style={{ marginBottom: 15 }}>
      <Text style={{ fontSize: 14, color: '#666' }}>📍 Odbiór:</Text>
      <Text style={{ fontSize: 16, fontWeight: '500', color: '#333' }}>{activeTrip.pickupAddress}</Text>
      <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 10 }} />
      <Text style={{ fontSize: 14, color: '#666' }}>🏁 Cel:</Text>
      <Text style={{ fontSize: 16, fontWeight: '500', color: '#333' }}>{activeTrip.dropoffAddress}</Text>
    </View>

    {tripPhase === 'heading_to_pickup' && (
      <View style={{ alignItems: 'center', marginTop: 10 }}>
        <ActivityIndicator size="small" color="#007bff" />
        <Text style={{ marginTop: 10, color: '#666', fontWeight: 'bold' }}>Nawigacja do klienta włączona.</Text>
        <Text style={{ marginTop: 5, color: '#999', fontSize: 12 }}>Przycisk odbioru pojawi się po dotarciu na miejsce.</Text>
      </View>
    )}

    {tripPhase === 'arrived_pickup' && (
      <Pressable 
        style={{ backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 }} 
        onPress={handleClientBoarded}
      >
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>🤝 KLIENT WSIADŁ</Text>
      </Pressable>
    )}

    {tripPhase === 'heading_to_dropoff' && (
      <View style={{ alignItems: 'center', marginTop: 10 }}>
        <ActivityIndicator size="small" color="#17a2b8" />
        <Text style={{ marginTop: 10, color: '#666', fontWeight: 'bold' }}>Nawigacja do celu włączona.</Text>
        <Text style={{ marginTop: 5, color: '#999', fontSize: 12 }}>Przycisk zakończenia kursu pojawi się po dotarciu na miejsce.</Text>
      </View>
    )}

    {tripPhase === 'arrived_dropoff' && (
      <Pressable 
        style={{ backgroundColor: '#dc3545', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 }} 
        onPress={handleCompleteTrip}
      >
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>✅ ZAKOŃCZ KURS</Text>
      </Pressable>
    )}
    <Pressable 
      style={{ backgroundColor: '#fff', borderWidth: 2, borderColor: '#dc3545', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 }}>
      <Text style={{ color: '#dc3545', fontWeight: 'bold', fontSize: 14 }}>ANULUJ PRZEJAZD</Text>
    </Pressable>
  </View>
) : (
  <Animated.View style={{ 
    height: animatedHeight, 
    backgroundColor: '#f4f6f9', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5
  }}>
    {/* Drag Handle Area */}
    <View 
      {...panResponder.panHandlers}
      style={{ 
        padding: 15, 
        borderBottomWidth: 1, 
        borderBottomColor: '#ddd', 
        backgroundColor: '#fff', 
        borderTopLeftRadius: 20, 
        borderTopRightRadius: 20,
        alignItems: 'center'
      }}
    >
      <View style={{ width: 40, height: 5, backgroundColor: '#ccc', borderRadius: 3, marginBottom: 10 }} />
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0a1d56' }}>Dostępne zlecenia ({availableTasks.length})</Text>
    </View>
    
    {/* Scrollable List */}
    <ScrollView contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}>
      {availableTasks.length === 0 ? (
        <Text style={{ padding: 30, textAlign: 'center', color: '#666', fontSize: 16 }}>Oczekujesz na zlecenia... ☕</Text>
      ) : (
        availableTasks.map((task) => (
          <View key={task.id} style={{ 
            marginHorizontal: 15, 
            marginTop: 15, 
            backgroundColor: '#fff', 
            borderRadius: 12, 
            padding: 15, 
            elevation: 3,
            borderLeftWidth: 4,
            borderLeftColor: '#0a1d56'
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: '#28a745', fontWeight: 'bold', backgroundColor: '#e8f5e9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5, overflow: 'hidden' }}>Nowe</Text>
              <Text style={{ color: '#666', fontWeight: 'bold' }}>👥 {task.passengerCount} os.</Text>
            </View>

            <View style={{ marginBottom: 15 }}>
              <Text style={{ fontSize: 14, color: '#444', marginBottom: 6 }}>📍 Od: <Text style={{fontWeight: 'bold', color: '#000'}}>{task.pickupAddress}</Text></Text>
              <Text style={{ fontSize: 14, color: '#444' }}>🏁 Do: <Text style={{fontWeight: 'bold', color: '#000'}}>{task.dropoffAddress}</Text></Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Pressable 
                style={{ flex: 1, backgroundColor: '#f0f2f5', padding: 12, borderRadius: 8, marginRight: 5, alignItems: 'center' }} 
                onPress={() => focusMapOnTask(task)}
              >
                <Text style={{ color: '#0a1d56', fontWeight: 'bold' }}>🗺️ Pokaż trasę</Text>
              </Pressable>

              <Pressable 
                style={{ flex: 1, backgroundColor: '#0a1d56', padding: 12, borderRadius: 8, marginLeft: 5, alignItems: 'center' }} 
                onPress={() => handleAcceptTask(task.id)}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Przyjmij</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  </Animated.View>
)}
          </View>
        )}

        {activeTab === 'history' && (
          <View style={MainKierowcaStyles.historyArea}>
            <View style={MainKierowcaStyles.taskCard}>
              <Text style={MainKierowcaStyles.panelTitle}>Historia kursów</Text>
              <Text>Tutaj znajdzie się lista wykonanych przez Ciebie kursów.</Text>
            </View>
          </View>
        )}
      </View>

      {/* MENU BOCZNE */}
      {/* MENU BOCZNE */}
      {isMenuOpen && <Pressable style={[MainKierowcaStyles.overlay, { zIndex: 99, elevation: 99 }]} onPress={closeMenu} />}
      <View style={[MainKierowcaStyles.sideMenu, isMenuOpen && MainKierowcaStyles.sideMenuOpen, { zIndex: 100, elevation: 100 }]}>
        <Pressable style={MainKierowcaStyles.closeMenuBtn} onPress={closeMenu}>
          <Ionicons name="close" size={28} color="#333" />
        </Pressable>
        <View style={MainKierowcaStyles.menuHeader}>
          <Text style={MainKierowcaStyles.menuHeaderText}>👤 Profil Kierowcy</Text>
        </View>

        {assignedVehicle && (
          <View style={MainKierowcaStyles.currentVehicle}>
            <Text style={MainKierowcaStyles.vehicleLabel}>Twój pojazd:</Text>
            <Text style={MainKierowcaStyles.vehicleNameText}>{assignedVehicle.brand} {assignedVehicle.model}</Text>
            <Text style={MainKierowcaStyles.vehiclePlate}>{assignedVehicle.registration}</Text>
            <Pressable style={MainKierowcaStyles.releaseBtn} onPress={handleReleaseVehicle}>
              <Text style={MainKierowcaStyles.releaseBtnText}>Zakończ pracę</Text>
            </Pressable>
            <Pressable style={[MainKierowcaStyles.releaseBtn, { backgroundColor: '#ffc107', marginTop: 10 }]}>
              <Text style={MainKierowcaStyles.releaseBtnText}>Zgłoś usterkę</Text>
            </Pressable>
          </View>
        )}

        <Pressable style={[MainKierowcaStyles.menuItem, activeTab === 'tasks' && MainKierowcaStyles.menuItemActive]} onPress={() => { setActiveTab('tasks'); closeMenu(); }}>
          <Text style={[MainKierowcaStyles.menuItemText, activeTab === 'tasks' && MainKierowcaStyles.menuItemTextActive]}>Zlecenia</Text>
        </Pressable>
        
        {/* Przycisk Pauza dodany z powrotem */}
        <Pressable style={MainKierowcaStyles.menuItem} onPress={closeMenu}>
          <Text style={MainKierowcaStyles.menuItemText}>Pauza (Przerwa)</Text>
        </Pressable>

        <View style={MainKierowcaStyles.menuBottom}>
          <Pressable style={MainKierowcaStyles.menuItem} onPress={() => { 
            closeMenu(); 
            navigation.navigate('HistoriaKierowca'); 
          }}>
            <Text style={MainKierowcaStyles.menuItemText}>Historia kursów</Text>
          </Pressable>
          <Pressable style={MainKierowcaStyles.menuItem} onPress={handleLogout}>
            <Text style={MainKierowcaStyles.logoutText}>Wyloguj się</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function MainKierowca(props: any) {
  return (
    <NavigationProvider
      termsAndConditionsDialogOptions={{
        title: 'Regulamin Google Maps',
        companyName: 'Michelin Taxi',
        showOnlyDisclaimer: false,
      }}
      taskRemovedBehavior={TaskRemovedBehavior.CONTINUE_SERVICE}
    >
      <MainKierowcaContent {...props} />
    </NavigationProvider>
  );
}