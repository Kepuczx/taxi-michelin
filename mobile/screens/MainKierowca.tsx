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
    try {
      const termsAccepted = await navigationController.showTermsAndConditionsDialog();
      if (!termsAccepted) return;

      const status = await navigationController.init();
      if (status === NavigationSessionStatus.OK) {
        console.log('✅ Silnik Navigation SDK zainicjalizowany.');
      }
    } catch (e) {
      console.error(e);
    }
  }, [navigationController]);

  useEffect(() => {
    initializeNavigation();
  }, [initializeNavigation]);

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

  const handleAcceptTask = async (tripId: number) => {
    if (!userId || !token) return;
    try {
      const response = await axios.patch(`${API_URL}/trips/${tripId}/accept`, { driverId: userId }, { headers: { Authorization: `Bearer ${token}` } });
      setActiveTrip(response.data);
      setAvailableTasks(prev => prev.filter(t => t.id !== tripId));
      Alert.alert('Sukces!', `Zlecenie #${tripId} przypisane.`);
    } catch (error: any) {
      Alert.alert('Błąd', error.response?.data?.message || 'Nie udało się przypisać kursu.');
    }
  };

  const focusMapOnTask = (task: Trip) => {
    if (isMapReady && mapCtrl.current) {
      mapCtrl.current.moveCamera({
        target: { lat: Number(task.pickupLat), lng: Number(task.pickupLng) },
        zoom: 15,
        bearing: 0,
        tilt: 0
      });
      // Optionally drag the sheet down slightly when they focus a task
      Animated.spring(animatedHeight, { toValue: MID_HEIGHT, useNativeDriver: false }).start();
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
      setActiveTrip(null); 
      await navigationController.stopGuidance();
      await navigationController.clearDestinations();
      Alert.alert('Sukces', 'Kurs zakończony!');
    } catch (e) { Alert.alert('Błąd', 'Nie udało się zakończyć.'); }
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

      {/* MENU BOCZNE */}
      {isMenuOpen && <Pressable style={MainKierowcaStyles.overlay} onPress={closeMenu} />}
      <View style={[MainKierowcaStyles.sideMenu, isMenuOpen && MainKierowcaStyles.sideMenuOpen]}>
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
          <Pressable style={[MainKierowcaStyles.menuItem, activeTab === 'history' && MainKierowcaStyles.menuItemActive]} onPress={() => { setActiveTab('history'); closeMenu(); }}>
            <Text style={[MainKierowcaStyles.menuItemText, activeTab === 'history' && MainKierowcaStyles.menuItemTextActive]}>Historia kursów</Text>
          </Pressable>
          <Pressable style={MainKierowcaStyles.menuItem} onPress={handleLogout}>
            <Text style={MainKierowcaStyles.logoutText}>Wyloguj się</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'tasks' && (
          <View style={{ flex: 1, flexDirection: 'column' }}>
            
            {/* 1. MAPA ZAWSZE NA GÓRZE */}
            <View style={{ flex: 1 }}>
              <NavigationView
                 style={{ flex: 1 }}
                 onMapViewControllerCreated={(ctrl: any) => { mapCtrl.current = ctrl; }} 
                 navigationUIEnabled={true}      
                 myLocationEnabled={true}        
                 myLocationButtonEnabled={true}  
                 onMapReady={() => setIsMapReady(true)}
              />
            </View>

            {/* 2. ZLECENIA NA DOLE (Draggable Bottom Sheet) */}
            {!activeTrip && (
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

            {/* PANEL AKTYWNEGO ZLECENIA (Zastępuje listę, jeśli w toku) */}
            {activeTrip && (
              <View style={{ 
                height: 220,
                backgroundColor: 'white', 
                padding: 20,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                elevation: 10 
              }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0a1d56', marginBottom: 15, textAlign: 'center' }}>
                  Zlecenie #{activeTrip.id} w toku
                </Text>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                  <Pressable 
                    style={{ flex: 1, backgroundColor: isMapReady ? '#007bff' : '#ccc', padding: 15, borderRadius: 8, marginRight: 5, alignItems: 'center' }} 
                    onPress={() => handleStartNavigation('pickup')} disabled={!isMapReady}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>{isMapReady ? 'PO KLIENTA' : '...'}</Text>
                  </Pressable>
            
                  <Pressable 
                    style={{ flex: 1, backgroundColor: isMapReady ? '#17a2b8' : '#ccc', padding: 15, borderRadius: 8, marginLeft: 5, alignItems: 'center' }} 
                    onPress={() => handleStartNavigation('dropoff')} disabled={!isMapReady}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>{isMapReady ? 'DO CELU' : '...'}</Text>
                  </Pressable>
                </View>
            
                <Pressable style={{ backgroundColor: '#dc3545', padding: 15, borderRadius: 8, alignItems: 'center' }} onPress={handleCompleteTrip}>
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>✅ ZAKOŃCZ KURS</Text>
                </Pressable>
              </View>
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