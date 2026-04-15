import { io, Socket } from 'socket.io-client';
import React, { useState, useEffect, useCallback } from 'react';
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
  Linking,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { MainKierowcaStyles } from '../styles/MainKierowcaStyles';

import { API_URL, GOOGLE_MAPS_API_KEY } from './config';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';

// 🔥 NOWE IMPORTY Z DOKUMENTACJI V0.14+
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
  currentDriver?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

interface Trip {
  id: number;
  pickupAddress: string;
  dropoffAddress: string;
  passengerCount: number;
  distanceKm?: number;
  status: string;
  pickupLat: string | number;
  pickupLng: string | number;
  dropoffLat: string | number;
  dropoffLng: string | number;
}

// =========================================================================
// GŁÓWNY KOMPONENT KIEROWCY (Zawiera całe Twoje oryginalne UI)
// =========================================================================
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

  const [availableTasks, setAvailableTasks] = useState<Trip[]>([]); // Giełda zleceń
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);   // Przyjęty kurs
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const [driverLocation, setDriverLocation] = useState<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // 🔥 KONTROLERY Z NOWEJ WERSJI GOOGLE SDK
  const mapCtrl = React.useRef<any>(null);
  const { navigationController } = useNavigation();

  // 1. INICJALIZACJA NAWIGACJI GOOGLE (Zgodnie z nowym README)
  const initializeNavigation = useCallback(async () => {
    try {
      const termsAccepted = await navigationController.showTermsAndConditionsDialog();
      if (!termsAccepted) {
        console.warn('Odrzucono regulamin nawigacji');
        return;
      }

      const status = await navigationController.init();
      if (status === NavigationSessionStatus.OK) {
        console.log('✅ Silnik Navigation SDK zainicjalizowany.');
      } else {
        console.error('Błąd inicjalizacji:', status);
      }
    } catch (e) {
      console.error(e);
    }
  }, [navigationController]);

  useEffect(() => {
    initializeNavigation();
  }, [initializeNavigation]);


  // 2. Śledzenie lokalizacji GPS kierowcy (Z poprawionym targetem kamery)
  useEffect(() => {
    let positionSubscription: any;
    (async () => {
      // 1. Prosimy o uprawnienia (Foreground + Accuracy)
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      // Dodatkowe sprawdzenie dokładności (tylko Android)
      const providerStatus = await Location.getProviderStatusAsync();
      
      if (status !== 'granted' || !providerStatus.locationServicesEnabled) {
        Alert.alert(
          'Brak lokalizacji',
          'Aplikacja potrzebuje dokładnego GPS. Sprawdź czy masz włączony GPS w telefonie.'
        );
        return;
      }

      console.log("GPS jest gotowy i uprawniony.");

      // 2. Śledzenie pozycji
      positionSubscription = await Location.watchPositionAsync(
        { 
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5, 
          timeInterval: 1000 
        },
        (loc) => {
          setDriverLocation(loc);
          
          // WYMUSZONE CENTROWANIE (Tylko gdy mapa jest gotowa i nie mamy kursu)
          if (isMapReady && mapCtrl.current && !activeTrip) {
            try {
              mapCtrl.current.moveCamera({
                target: { // Zmienione z 'center' na 'target' dla kompatybilności z V0.14
                  lat: loc.coords.latitude,
                  lng: loc.coords.longitude
                },
                zoom: 17,
                bearing: 0,
                tilt: 0
              });
            } catch (e) {}
          }
        }
      );
    })();
    return () => positionSubscription?.remove();
  }, [isMapReady, activeTrip]);

  useEffect(() => {
    const newSocket = io(API_URL, { transports: ['websocket'] });
    setSocket(newSocket);

    // Nasłuchiwanie na nowe zlecenia z backendu
    newSocket.on('newTrip', (trip: Trip) => {
      setAvailableTasks(prev => {
        if (prev.some(t => t.id === trip.id)) return prev;
        return [...prev, trip];
      });
      Alert.alert('Nowe zlecenie!', `${trip.pickupAddress} -> ${trip.dropoffAddress}`);
    });

    // Zniknięcie zlecenia (przyjęte przez kogoś innego)
    newSocket.on('tripAccepted', (tripId: number) => {
      setAvailableTasks(prev => prev.filter(t => t.id !== tripId));
    });

    const getData = async () => {
      const storedToken = await AsyncStorage.getItem('userToken');
      const role = await AsyncStorage.getItem('userRole');
      const id = await AsyncStorage.getItem('userId');
      const name = await AsyncStorage.getItem('userName');
      const email = await AsyncStorage.getItem('userEmail');

      if (role !== 'driver') {
        Alert.alert('Brak dostępu', 'Ta strona jest tylko dla kierowców', [
          { text: 'OK', onPress: () => navigation.replace('Login') },
        ]);
        return;
      }

      setToken(storedToken);
      if (id) setUserId(parseInt(id));
      if (name) setUserName(name);
      if (email) setLoggedUser(email);

      fetchVehiclesAndCheckAssignment(storedToken, id ? parseInt(id) : null);
      fetchPendingTrips(storedToken);
    };
    getData();

    return () => {
      newSocket.disconnect();
    };
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
      if (myVehicle) {
        setAssignedVehicle(myVehicle);
      } else {
        setAssignedVehicle(null);
      }
    } catch (error) {
      console.error('Błąd pobierania pojazdów:', error);
      Alert.alert('Błąd', 'Nie udało się pobrać listy pojazdów');
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
    } catch (error) {
      console.error('Błąd pobierania oczekujących zleceń:', error);
    }
  };

  const handleSelectVehicle = async (vehicleId: number) => {
    if (!userId || !token) return;

    Alert.alert(
      'Potwierdzenie',
      'Czy na pewno chcesz wybrać ten pojazd?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Wybierz',
          onPress: async () => {
            try {
              await axios.patch(
                `${API_URL}/vehicles/${vehicleId}/assign-driver/${userId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
              Alert.alert('Sukces', 'Pojazd został przypisany!');
              await fetchVehiclesAndCheckAssignment(token, userId);
            } catch (error: any) {
              console.error('Błąd przypisywania pojazdu:', error);
              Alert.alert('Błąd', error.response?.data?.message || 'Nie udało się przypisać pojazdu');
            }
          },
        },
      ]
    );
  };

  const handleReleaseVehicle = async () => {
    if (!assignedVehicle || !token) return;

    Alert.alert(
      'Potwierdzenie',
      `Czy na pewno chcesz zakończyć pracę z pojazdem ${assignedVehicle.registration}?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Zakończ',
          onPress: async () => {
            try {
              await axios.patch(
                `${API_URL}/vehicles/${assignedVehicle.id}/release-driver`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
              Alert.alert('Sukces', 'Zakończono pracę z pojazdem');
              setAssignedVehicle(null);
              await fetchVehiclesAndCheckAssignment(token, userId);
            } catch (error) {
              console.error('Błąd zwalniania pojazdu:', error);
              Alert.alert('Błąd', 'Nie udało się zwolnić pojazdu');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Wylogowanie',
      'Czy na pewno chcesz się wylogować?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Wyloguj',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userRole');
            await AsyncStorage.removeItem('userEmail');
            await AsyncStorage.removeItem('userId');
            await AsyncStorage.removeItem('userName');
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleAcceptTask = async (tripId: number) => {
    if (!userId || !token) {
      Alert.alert('Błąd', 'Brak autoryzacji do przyjęcia kursu.');
      return;
    }

    try {
      const response = await axios.patch(
        `${API_URL}/trips/${tripId}/accept`,
        { driverId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setActiveTrip(response.data);
      setAvailableTasks(prev => prev.filter(t => t.id !== tripId));

      Alert.alert('Sukces!', `Zlecenie #${tripId} zostało przypisane do Ciebie. Możesz ruszać.`);
    } catch (error: any) {
      console.error('Błąd akceptacji kursu:', error);
      Alert.alert('Błąd', error.response?.data?.message || 'Nie udało się przypisać kursu.');
    }
  };

  // 🔥 AKTUALIZACJA WYZNACZANIA TRASY (Nowe API v0.14)
  const handleStartNavigation = async (type: 'pickup' | 'dropoff') => {
    if (!activeTrip || !isMapReady) {
      Alert.alert('Chwileczkę', 'Mapa jeszcze się ładuje...');
      return;
    }

    const lat = type === 'pickup' ? activeTrip.pickupLat : activeTrip.dropoffLat;
    const lng = type === 'pickup' ? activeTrip.pickupLng : activeTrip.dropoffLng;
    const title = type === 'pickup' ? activeTrip.pickupAddress : activeTrip.dropoffAddress;

    try {
      const waypoint = {
        title: title || 'Cel',
        position: { lat: Number(lat), lng: Number(lng) }
      };

      await navigationController.setDestinations([waypoint], { routingOptions: { travelMode: 1 } });
      await navigationController.startGuidance();
    } catch (error) {
      console.error("Błąd nawigacji:", error);
      Alert.alert("Błąd", "Nie udało się uruchomić nawigacji.");
    }
  };

  // 🔥 AKTUALIZACJA KOŃCZENIA KURSU (Nowe API v0.14)
  const handleCompleteTrip = async () => {
    if (!activeTrip) return;
    try {
      await axios.patch(`${API_URL}/trips/${activeTrip.id}/complete`, { driverId: userId });
      setActiveTrip(null); 
      
      // Czyszczenie trasy po kursie
      await navigationController.stopGuidance();
      await navigationController.clearDestinations();
      
      Alert.alert('Sukces', 'Kurs zakończony!');
    } catch (e) { 
      Alert.alert('Błąd', 'Nie udało się zakończyć.'); 
    }
  };

  if (loading) {
    return (
      <View style={MainKierowcaStyles.container}>
        <View style={MainKierowcaStyles.header}>
          <Image
            source={require('../assets/MichelinLogo.png')}
            style={MainKierowcaStyles.logoImage}
            resizeMode="contain"
          />
          <Pressable onPress={toggleMenu} style={MainKierowcaStyles.menuButton}>
            <Ionicons name="menu" size={28} color="white" />
          </Pressable>
        </View>
        <View style={MainKierowcaStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a1d56" />
          <Text>Ładowanie danych...</Text>
        </View>
      </View>
    );
  }

  if (!assignedVehicle) {
    const availableVehicles = vehicles.filter(v => v.status === 'dostępny' && !v.isBreakdown);
    return (
      <View style={MainKierowcaStyles.container}>
        <View style={MainKierowcaStyles.header}>
          <Image
            source={require('../assets/MichelinLogo.png')}
            style={MainKierowcaStyles.logoImage}
            resizeMode="contain"
          />
          <Pressable onPress={toggleMenu} style={MainKierowcaStyles.menuButton}>
            <Ionicons name="menu" size={28} color="white" />
          </Pressable>
        </View>

        {isMenuOpen && <Pressable style={MainKierowcaStyles.overlay} onPress={closeMenu} />}
        <View style={[MainKierowcaStyles.sideMenu, isMenuOpen && MainKierowcaStyles.sideMenuOpen]}>
          <Pressable style={MainKierowcaStyles.closeMenuBtn} onPress={closeMenu}>
            <Ionicons name="close" size={28} color="#333" />
          </Pressable>
          <View style={MainKierowcaStyles.menuHeader}>
            <Text style={MainKierowcaStyles.menuHeaderText}>👤 Profil Kierowcy</Text>
          </View>
          <View style={MainKierowcaStyles.menuBottom}>
            <Pressable style={MainKierowcaStyles.menuItem} onPress={handleLogout}>
              <Text style={MainKierowcaStyles.logoutText}>Wyloguj się</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView style={MainKierowcaStyles.selectionContainer}>
          <View style={MainKierowcaStyles.selectionCard}>
            <Text style={MainKierowcaStyles.selectionTitle}>🚗 Wybór pojazdu</Text>
            <Text style={MainKierowcaStyles.selectionSubtitle}>Nie masz przypisanego pojazdu. Wybierz dostępny:</Text>

            {availableVehicles.length === 0 ? (
              <Text style={MainKierowcaStyles.noVehicles}>Brak dostępnych pojazdów. Skontaktuj się z administratorem.</Text>
            ) : (
              availableVehicles.map(vehicle => (
                <View key={vehicle.id} style={MainKierowcaStyles.vehicleItem}>
                  <View style={MainKierowcaStyles.vehicleInfo}>
                    <Text style={MainKierowcaStyles.vehicleName}>{vehicle.brand} {vehicle.model}</Text>
                    <Text style={MainKierowcaStyles.vehicleDetail}>Rejestracja: {vehicle.registration}</Text>
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

  return (
    <View style={MainKierowcaStyles.container}>
      <View style={MainKierowcaStyles.header}>
        <Image
          source={require('../assets/MichelinLogo.png')}
          style={MainKierowcaStyles.logoImage}
          resizeMode="contain"
        />
        <Pressable onPress={toggleMenu} style={MainKierowcaStyles.menuButton}>
          <Ionicons name="menu" size={28} color="white" />
        </Pressable>
      </View>

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

        <Pressable
          style={[MainKierowcaStyles.menuItem, activeTab === 'tasks' && MainKierowcaStyles.menuItemActive]}
          onPress={() => { setActiveTab('tasks'); closeMenu(); }}
        >
          <Text style={[MainKierowcaStyles.menuItemText, activeTab === 'tasks' && MainKierowcaStyles.menuItemTextActive]}>
            Lista zleceń
          </Text>
        </Pressable>
        <Pressable style={MainKierowcaStyles.menuItem} onPress={closeMenu}>
          <Text style={MainKierowcaStyles.menuItemText}>Pauza (Przerwa)</Text>
        </Pressable>

        <View style={MainKierowcaStyles.menuBottom}>
          <Pressable
            style={[MainKierowcaStyles.menuItem, activeTab === 'history' && MainKierowcaStyles.menuItemActive]}
            onPress={() => { setActiveTab('history'); closeMenu(); }}
          >
            <Text style={[MainKierowcaStyles.menuItemText, activeTab === 'history' && MainKierowcaStyles.menuItemTextActive]}>
              Historia kursów
            </Text>
          </Pressable>
          <Pressable style={MainKierowcaStyles.menuItem} onPress={handleLogout}>
            <Text style={MainKierowcaStyles.logoutText}>Wyloguj się</Text>
          </Pressable>
        </View>
      </View>

      <View style={[MainKierowcaStyles.mainContent, { flex: 1 }]}>
        {activeTab === 'tasks' && (
          <View style={{ flex: 1, flexDirection: 'column' }}>
            
            {/* 1. LISTA ZLECEŃ */}
            {!activeTrip && (
              <View style={{ height: 250, backgroundColor: '#f8f9fa' }}>
                <Text style={[MainKierowcaStyles.panelTitle, { padding: 10 }]}>Dostępne zlecenia</Text>
                <ScrollView>
                  {availableTasks.length === 0 ? (
                    <Text style={{ padding: 20, textAlign: 'center', color: '#666' }}>Oczekujesz na zlecenia... ☕</Text>
                  ) : (
                    availableTasks.map((task) => (
                      <View key={task.id} style={[MainKierowcaStyles.taskItem, { flexDirection: 'row', alignItems: 'center', padding: 10, margin: 10, backgroundColor: '#fff', borderRadius: 8, elevation: 2 }]}>
                        
                        {/* Szczegóły zlecenia */}
                        <View style={{ flex: 1, paddingRight: 10 }}>
                          <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#0a1d56' }}>📍 Skąd: {task.pickupAddress}</Text>
                          <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#0a1d56', marginTop: 4 }}>🏁 Dokąd: {task.dropoffAddress}</Text>
                          <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>👤 Pasażerów: {task.passengerCount}</Text>
                        </View>

                        {/* Przycisk akceptacji */}
                        <Pressable 
                          style={[{ backgroundColor: '#28a745', padding: 10, borderRadius: 8, justifyContent: 'center' }]} 
                          onPress={() => handleAcceptTask(task.id)}
                        >
                          <Text style={{ color: 'white', fontWeight: 'bold' }}>Przyjmij</Text>
                        </Pressable>

                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            )}

            {/* 2. MAPA I NAWIGACJA */}
            <View style={{ flex: 1, borderTopWidth: 2, borderColor: '#0a1d56' }}>
              
              {/* 🔥 NOWY KOMPONENT NAWIGACJI (Bez starych refów i wycofanych atrybutów) */}
              <NavigationView
                 style={{ flex: 1 }}
                 onMapViewControllerCreated={(ctrl: any) => { mapCtrl.current = ctrl; }} 
                 navigationUIEnabled={true}      
                 myLocationEnabled={true}        
                 myLocationButtonEnabled={true}  
                 onMapReady={() => {
                   console.log('Mapa gotowa');
                   setIsMapReady(true);
                 }}
              />
        
              {/* PANEL AKTYWNEGO ZLECENIA */}
              {activeTrip && (
                <View style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  right: 0, 
                  backgroundColor: 'white', 
                  padding: 15,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  elevation: 10 
                }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0a1d56', marginBottom: 10, textAlign: 'center' }}>
                    Zlecenie #{activeTrip.id} w toku
                  </Text>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Pressable 
                      style={{ flex: 1, backgroundColor: isMapReady ? '#007bff' : '#ccc', padding: 12, borderRadius: 8, marginRight: 5, alignItems: 'center' }} 
                      onPress={() => handleStartNavigation('pickup')}
                      disabled={!isMapReady}
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>{isMapReady ? 'PO KLIENTA' : 'ŁADOWANIE...'}</Text>
                    </Pressable>
              
                    <Pressable 
                      style={{ flex: 1, backgroundColor: isMapReady ? '#17a2b8' : '#ccc', padding: 12, borderRadius: 8, marginLeft: 5, alignItems: 'center' }} 
                      onPress={() => handleStartNavigation('dropoff')}
                      disabled={!isMapReady}
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>{isMapReady ? 'DO CELU' : 'ŁADOWANIE...'}</Text>
                    </Pressable>
                  </View>
              
                  <Pressable 
                    style={{ backgroundColor: '#dc3545', padding: 15, borderRadius: 8, alignItems: 'center' }} 
                    onPress={handleCompleteTrip}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>✅ ZAKOŃCZ KURS</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ORYGINALNA HISTORIA KURSÓW */}
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

// =========================================================================
// 🔥 GLOBALNY WRAPPER (Wymagany w Google Navigation SDK v0.14+)
// =========================================================================
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