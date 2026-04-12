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

// 🔥 UŻYJ SWOJEGO IP (z ipconfig)
const API_URL = 'http://192.168.0.13:3000';

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

  useEffect(() => {
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

  const handleAcceptTask = (id: number) => {
    Alert.alert('Przyjęto zlecenie', `Rozpoczynanie nawigacji dla zlecenia #${id}...`);
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
                  <View style={MainKierowcaStyles.taskItem}>
                    <View style={MainKierowcaStyles.taskHeader}>
                      <Text style={MainKierowcaStyles.taskTime}>Teraz</Text>
                      <Text style={MainKierowcaStyles.taskDistance}>2.5 km stąd</Text>
                    </View>
                    <View style={MainKierowcaStyles.taskRoute}>
                      <Text><Text style={MainKierowcaStyles.bold}>Od:</Text> Brama Główna</Text>
                      <Text><Text style={MainKierowcaStyles.bold}>Do:</Text> Magazyn 4</Text>
                    </View>
                    <View style={MainKierowcaStyles.taskActions}>
                      <Pressable style={MainKierowcaStyles.rejectBtn}>
                        <Text style={MainKierowcaStyles.rejectBtnText}>Odrzuć</Text>
                      </Pressable>
                      <Pressable style={MainKierowcaStyles.acceptBtn} onPress={() => handleAcceptTask(1)}>
                        <Text style={MainKierowcaStyles.acceptBtnText}>Przyjmij</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={MainKierowcaStyles.taskItem}>
                    <View style={MainKierowcaStyles.taskHeader}>
                      <Text style={MainKierowcaStyles.taskTime}>Za 15 min</Text>
                      <Text style={MainKierowcaStyles.taskDistance}>4.0 km stąd</Text>
                    </View>
                    <View style={MainKierowcaStyles.taskRoute}>
                      <Text><Text style={MainKierowcaStyles.bold}>Od:</Text> Biurowiec A</Text>
                      <Text><Text style={MainKierowcaStyles.bold}>Do:</Text> Dworzec PKP</Text>
                    </View>
                    <View style={MainKierowcaStyles.taskActions}>
                      <Pressable style={MainKierowcaStyles.rejectBtn}>
                        <Text style={MainKierowcaStyles.rejectBtnText}>Odrzuć</Text>
                      </Pressable>
                      <Pressable style={MainKierowcaStyles.acceptBtn} onPress={() => handleAcceptTask(2)}>
                        <Text style={MainKierowcaStyles.acceptBtnText}>Przyjmij</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Prawy panel - mapa */}
            <View style={MainKierowcaStyles.mapArea}>
              <View style={MainKierowcaStyles.mapCard}>
                <Text style={MainKierowcaStyles.mapPlaceholder}>Podgląd Mapy i Nawigacji</Text>
              </View>
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