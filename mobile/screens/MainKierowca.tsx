import { io, Socket } from 'socket.io-client';

import React, { useState, useEffect } from 'react';

import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { MainKierowcaStyles } from '../styles/MainKierowcaStyles';

import { API_URL } from './config';
// 🔥 UŻYJ SWOJEGO IP (z ipconfig)


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
}

export default function MainKierowca({ navigation }: any) {
  const [loggedUser, setLoggedUser] = useState<string | null>('Kierowca');
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [assignedVehicle, setAssignedVehicle] = useState<Vehicle | null>(null);
  
  const [loading, setLoading] = useState(true);

  const [availableTasks, setAvailableTasks] = useState<Trip[]>([]); // Giełda zleceń
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);   // Przyjęty kurs
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(API_URL, { transports: ['websocket'] });
    setSocket(newSocket);

    // Nasłuchiwanie na nowe zlecenia z backendu
    newSocket.on('newTrip', (trip: Trip) => {
      setAvailableTasks(prev => [...prev, trip]);
      Alert.alert('Nowe zlecenie!', `${trip.pickupAddress} -> ${trip.dropoffAddress}`);
    });


    const getData = async () => {
      const storedToken = await AsyncStorage.getItem('userToken');
      const role = await AsyncStorage.getItem('userRole');
      const id = await AsyncStorage.getItem('userId');
      const name = await AsyncStorage.getItem('userName');
      const email = await AsyncStorage.getItem('userEmail');

      console.log('🔑 Token:', storedToken ? `${storedToken.substring(0, 30)}...` : 'BRAK');
      console.log('👤 Rola:', role);
      console.log('🆔 UserId:', id);
      console.log('📛 UserName:', name);

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
    };
    getData();

    // 🔥 4. FUNKCJA CZYSZCZĄCA (ZAPOBIEGA WYCIEKOM PAMIĘCI I DUBLOWANIU ALERTÓW)
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
      // 1. Uderzamy do backendu, aby zaktualizować status w bazie
      const response = await axios.patch(
        `${API_URL}/trips/${tripId}/accept`,
        { driverId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Ustawiamy przyjęty kurs jako aktywny
      setActiveTrip(response.data);
      // 2. Jeśli się udało, usuwamy to zlecenie z listy "Dostępnych" (bo już jest Twoje)
      setAvailableTasks(prev => prev.filter(t => t.id !== tripId));

      Alert.alert('Sukces!', `Zlecenie #${tripId} zostało przypisane do Ciebie. Możesz ruszać.`);
      
      // Opcjonalnie: tutaj mógłbyś przełączyć widok na "Aktywne Zlecenie" lub pokazać mapę
    } catch (error: any) {
      console.error('Błąd akceptacji kursu:', error);
      Alert.alert(
        'Błąd', 
        error.response?.data?.message || 'Nie udało się przypisać kursu. Być może ktoś inny był szybszy.'
      );
    }
  };

  // Start kursu (Klient wsiadł)
  const handleStartTrip = async () => {
    if (!activeTrip) return;
    try {
      const resp = await axios.patch(`${API_URL}/trips/${activeTrip.id}/start`, { driverId: userId });
      setActiveTrip(resp.data); // Zmienia status na 'in_progress'
    } catch (e) { Alert.alert('Błąd', 'Nie udało się wystartować.'); }
  };

  // Zakończenie kursu
  const handleCompleteTrip = async () => {
    if (!activeTrip) return;
    try {
      await axios.patch(`${API_URL}/trips/${activeTrip.id}/complete`, { driverId: userId });
      setActiveTrip(null); // Czyścimy panel, status zmienia się na 'completed'
      Alert.alert('Sukces', 'Kurs zakończony!');
    } catch (e) { Alert.alert('Błąd', 'Nie udało się zakończyć.'); }
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

  // Widok wyboru pojazdu (gdy nie ma przypisanego)
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

        {/* Wysuwane menu */}
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

        {/* Widok wyboru pojazdu */}
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

  

  // Widok główny (gdy ma przypisany pojazd)
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

      {/* Wysuwane menu */}
      {isMenuOpen && <Pressable style={MainKierowcaStyles.overlay} onPress={closeMenu} />}
      <View style={[MainKierowcaStyles.sideMenu, isMenuOpen && MainKierowcaStyles.sideMenuOpen]}>
        <Pressable style={MainKierowcaStyles.closeMenuBtn} onPress={closeMenu}>
          <Ionicons name="close" size={28} color="#333" />
        </Pressable>
        <View style={MainKierowcaStyles.menuHeader}>
          <Text style={MainKierowcaStyles.menuHeaderText}>👤 Profil Kierowcy</Text>
        </View>

        {/* Aktualny pojazd w menu */}
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

      {/* Główna zawartość */}
      <ScrollView style={MainKierowcaStyles.mainContent}>
        {activeTab === 'tasks' && (
          <View style={MainKierowcaStyles.tasksLayout}>
            {/* Lewy panel - lista zleceń */}
            <View style={MainKierowcaStyles.sidebar}>
              <View style={MainKierowcaStyles.taskCard}>
                <Text style={MainKierowcaStyles.panelTitle}>Dostępne zlecenia</Text>

                <View style={MainKierowcaStyles.tasksContainer}>
                  {availableTasks.length === 0 ? (
                    <Text style={{ padding: 20, textAlign: 'center', color: '#666', fontSize: 16 }}>
                      Oczekujesz na zlecenia... ☕
                    </Text>
                  ) : (
                    availableTasks.map((task) => (
                      <View key={task.id} style={MainKierowcaStyles.taskItem}>
                        <View style={MainKierowcaStyles.taskHeader}>
                          <Text style={MainKierowcaStyles.taskTime}>Nowe</Text>
                          <Text style={MainKierowcaStyles.taskDistance}>
                            {task.distanceKm ? `${task.distanceKm} km` : '---'}
                          </Text>
                        </View>
                        <View style={MainKierowcaStyles.taskRoute}>
                          <Text><Text style={MainKierowcaStyles.bold}>Od:</Text> {task.pickupAddress}</Text>
                          <Text><Text style={MainKierowcaStyles.bold}>Do:</Text> {task.dropoffAddress}</Text>
                        </View>
                        <View style={MainKierowcaStyles.taskActions}>
                          <Pressable 
                            style={MainKierowcaStyles.rejectBtn}
                            // Funkcja odrzucenia - po prostu usuwa kurs z widoku TEGO KIEROWCY
                            onPress={() => setAvailableTasks(prev => prev.filter(t => t.id !== task.id))}
                          >
                            <Text style={MainKierowcaStyles.rejectBtnText}>Odrzuć</Text>
                          </Pressable>
                          <Pressable 
                            style={MainKierowcaStyles.acceptBtn} 
                            onPress={() => handleAcceptTask(task.id)}
                          >
                            <Text style={MainKierowcaStyles.acceptBtnText}>Przyjmij</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </View>

            {/* Prawy panel - mapa */}
            {/* Prawy panel - Mapa i Sterowanie */}
            <View style={MainKierowcaStyles.mapArea}>
              {activeTrip ? (
                <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 15, padding: 15 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0a1d56', marginBottom: 10 }}>
                    {activeTrip.status === 'in_progress' ? '🚖 Kurs w trakcie' : '📍 Dojazd do klienta'}
                  </Text>

                  {/* Tu w przyszłości wstawisz <MapView> z trasą Google */}
                  <View style={{ flex: 1, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', borderRadius: 10 }}>
                    <Text style={{ textAlign: 'center', padding: 10 }}>
                      Trasa: {activeTrip.pickupAddress} {'\n'} {'->'} {'\n'} {activeTrip.dropoffAddress}
                    </Text>
                  </View>
              
                  {/* PRZYCISKI STEROWANIA STATUSAMI */}
                  <View style={{ marginTop: 20 }}>
                    {activeTrip.status !== 'in_progress' ? (
                      <Pressable 
                        style={{ backgroundColor: '#28a745', padding: 15, borderRadius: 10, alignItems: 'center' }} 
                        onPress={handleStartTrip}
                      >
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>KLIENT WSIADŁ - START</Text>
                      </Pressable>
                    ) : (
                      <Pressable 
                        style={{ backgroundColor: '#dc3545', padding: 15, borderRadius: 10, alignItems: 'center' }} 
                        onPress={handleCompleteTrip}
                      >
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>ZAKOŃCZ KURS</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              ) : (
                <View style={MainKierowcaStyles.mapCard}>
                  <Text style={MainKierowcaStyles.mapPlaceholder}>Nie masz aktywnego zlecenia.</Text>
                  <Text style={{ color: '#666', marginTop: 10 }}>Wybierz kurs z listy po lewej stronie.</Text>
                </View>
              )}
            </View>
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
      </ScrollView>
    </View>
  );
}