import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { AdminPanelStyles } from '../styles/AdminPanelStyles';
import MapView, { Marker, Callout } from 'react-native-maps';

import { API_URL } from './config';
// 🔥 UŻYJ SWOJEGO IP (z ipconfig)



// Typy
interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  isActive: boolean;
  isOnline: boolean;
  currentLat: string | number;
  currentLng: string | number;
}

interface NewUser {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
}

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
    firstName: string;
    lastName: string;
  };
}

interface VehicleLog {
  id: number;
  vehicleId: number;
  eventType: string;
  eventTime: string;
  description: string;
  changedBy: string;
  driver?: {
    firstName: string;
    lastName: string;
  };
}

export default function AdminPanelScreen({ navigation }: any) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleLogs, setVehicleLogs] = useState<VehicleLog[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<User | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const [searchTermUsers, setSearchTermUsers] = useState('');
  const [currentPageUsers, setCurrentPageUsers] = useState(1);
  const itemsPerPage = 5;
  const [showEditUserForm, setShowEditUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserData, setEditUserData] = useState<NewUser>({
    username: '', email: '', password: '', firstName: '', lastName: '', phone: '', role: 'employee'
  });
  const [searchTermVehicles, setSearchTermVehicles] = useState('');
  const [currentPageVehicles, setCurrentPageVehicles] = useState(1);
  const [isVehiclePickerOpen, setIsVehiclePickerOpen] = useState(false);

  // Formularz nowego użytkownika
  const [newUser, setNewUser] = useState<NewUser>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'employee',
  });

  // Formularz nowego pojazdu
  const [newVehicle, setNewVehicle] = useState({
    registration: '',
    brand: '',
    model: '',
    passengerCapacity: 4,
    status: 'dostępny',
    isBreakdown: false,
    notes: '',
  });

  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [showEditVehicleForm, setShowEditVehicleForm] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

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

  useEffect(() => {
    const getToken = async () => {
      const storedToken = await AsyncStorage.getItem('userToken');
      const role = await AsyncStorage.getItem('userRole');
      const email = await AsyncStorage.getItem('userEmail');
      
      if (role !== 'admin') {
        Alert.alert('Brak dostępu', 'Panel tylko dla administratorów', [
          { text: 'OK', onPress: () => navigation.replace('ZamowieniePracownik') }
        ]);
        return;
      }
      setToken(storedToken);
      setAdminEmail(email);
    };
    getToken();
  }, []);


  // ==================== DASHBOARD / MAPA ====================
  const fetchDriversForMap = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const driversOnly = response.data.filter((u: User) => u.role === 'driver');
      setDrivers(driversOnly);
    } catch (error) {
      console.error('Błąd pobierania kierowców dla mapy:', error);
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (activeSection === 'dashboard' && token) {
      fetchDriversForMap();
      intervalId = setInterval(() => {
        fetchDriversForMap();
      }, 10000); // Odświeżanie co 10 sekund (jak w HomePageAdmin)
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeSection, token]);

  const sortedDrivers = [...drivers].sort((a, b) => {
    const aOnline = a.isOnline ? 1 : 0;
    const bOnline = b.isOnline ? 1 : 0;
    return bOnline - aOnline; 
  });

  const handleSelectDriver = (driver: User) => {
  const lat = Number(driver.currentLat);
  const lng = Number(driver.currentLng);

  if (lat && lng) {
    setSelectedDriver(driver);
    // Animacja do pozycji kierowcy
    mapRef.current?.animateToRegion({
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  } else {
    Alert.alert("Błąd", "Ten kierowca nie udostępnia obecnie lokalizacji.");
  }
};

  // ==================== UŻYTKOWNICY ====================
  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Błąd pobierania:', error);
      Alert.alert('Błąd', 'Nie udało się pobrać użytkowników');
    } finally {
      setLoading(false);
    }
  };

  const addUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
      Alert.alert('Błąd', 'Wypełnij wszystkie wymagane pola');
      return;
    }

    try {
      await axios.post(`${API_URL}/users`, newUser, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('Sukces', 'Użytkownik dodany');
      setShowForm(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'employee',
      });
      fetchUsers();
    } catch (error) {
      console.error('Błąd dodawania:', error);
      Alert.alert('Błąd', 'Nie udało się dodać użytkownika');
    }
  };

  const deleteUser = (id: number) => {
    Alert.alert(
      'Potwierdzenie',
      'Czy na pewno chcesz usunąć tego użytkownika?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              fetchUsers();
            } catch (error) {
              Alert.alert('Błąd', 'Nie udało się usunąć');
            }
          },
        },
      ]
    );
  };

  // Przygotowanie danych do edycji
  const startEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserData({
      username: user.username,
      email: user.email,
      password: '', // zostawiamy puste, jeśli admin nie chce zmieniać hasła
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role
    });
    setShowEditUserForm(true);
    setShowForm(false);
  };

  // Aktualizacja użytkownika w bazie
  const updateUser = async () => {
    if (!editingUser) return;
    try {
      const payload: any = { ...editUserData };
      if (!payload.password.trim()) delete payload.password; // Nie wysyłaj pustego hasła

      await axios.patch(`${API_URL}/users/${editingUser.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('Sukces', 'Użytkownik zaktualizowany');
      setShowEditUserForm(false);
      fetchUsers();
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się zaktualizować użytkownika');
    }
  };

  // Logika filtrowania i paginacji (obliczana przy każdym renderze)
  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchTermUsers.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTermUsers.toLowerCase()) ||
    u.firstName.toLowerCase().includes(searchTermUsers.toLowerCase()) ||
    u.lastName.toLowerCase().includes(searchTermUsers.toLowerCase())
  );

  const totalPagesUsers = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPageUsers - 1) * itemsPerPage,
    currentPageUsers * itemsPerPage
  );

  // ==================== POJAZDY ====================
  const fetchVehicles = async () => {
    if (!token) return;
    setLoadingVehicles(true);
    try {
      const response = await axios.get(`${API_URL}/vehicles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVehicles(response.data);
    } catch (error) {
      console.error('Błąd pobierania pojazdów:', error);
      Alert.alert('Błąd', 'Nie udało się pobrać pojazdów');
    } finally {
      setLoadingVehicles(false);
    }
  };

  const addVehicle = async () => {
    if (!newVehicle.registration || !newVehicle.brand || !newVehicle.model) {
      Alert.alert('Błąd', 'Wypełnij wszystkie wymagane pola');
      return;
    }

    try {
      await axios.post(`${API_URL}/vehicles`, newVehicle, {
        headers: { Authorization: `Bearer ${token}`, 
       'x-changed-by': adminEmail || 'system'
      },
      });
      Alert.alert('Sukces', 'Pojazd dodany');
      setShowVehicleForm(false);
      setNewVehicle({
        registration: '',
        brand: '',
        model: '',
        passengerCapacity: 4,
        status: 'dostępny',
        isBreakdown: false,
        notes: '',
      });
      fetchVehicles();
    } catch (error) {
      console.error('Błąd dodawania pojazdu:', error);
      Alert.alert('Błąd', 'Nie udało się dodać pojazdu');
    }
  };

  const deleteVehicle = (id: number) => {
    Alert.alert(
      'Potwierdzenie',
      'Czy na pewno chcesz usunąć ten pojazd?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/vehicles/${id}`, {
                headers: { Authorization: `Bearer ${token}`,
                'x-changed-by': adminEmail || 'system'
              },
              });
              fetchVehicles();
            } catch (error) {
              Alert.alert('Błąd', 'Nie udało się usunąć pojazdu');
            }
          },
        },
      ]
    );
  };

  const startEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowEditVehicleForm(true);
    setShowVehicleForm(false);
  };

  const updateVehicle = async () => {
    if (!editingVehicle) return;
    try {
      await axios.patch(`${API_URL}/vehicles/${editingVehicle.id}`, {
        registration: editingVehicle.registration,
        brand: editingVehicle.brand,
        model: editingVehicle.model,
        passengerCapacity: editingVehicle.passengerCapacity,
        status: editingVehicle.status,
        notes: editingVehicle.notes,
        isBreakdown: editingVehicle.isBreakdown,
      }, {
        headers: { Authorization: `Bearer ${token}`,
        'x-changed-by': adminEmail || 'system'
      },
      });
      Alert.alert('Sukces', 'Pojazd zaktualizowany');
      setShowEditVehicleForm(false);
      setEditingVehicle(null);
      fetchVehicles();
    } catch (error) {
      console.error('Błąd aktualizacji pojazdu:', error);
      Alert.alert('Błąd', 'Nie udało się zaktualizować pojazdu');
    }
  };

  const toggleBreakdown = async (id: number, currentStatus: boolean) => {
    try {
      await axios.patch(`${API_URL}/vehicles/${id}`, {
        isBreakdown: !currentStatus
      }, {
        headers: { Authorization: `Bearer ${token}`,
        'x-changed-by': adminEmail || 'system'
      },
      });
      fetchVehicles();
    } catch (error) {
      console.error('Błąd zmiany statusu awarii:', error);
      Alert.alert('Błąd', 'Nie udało się zmienić statusu awarii');
    }
  };

  const filteredVehicles = vehicles.filter(v =>
    v.registration.toLowerCase().includes(searchTermVehicles.toLowerCase()) ||
    v.brand.toLowerCase().includes(searchTermVehicles.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTermVehicles.toLowerCase())
  );

  const totalPagesVehicles = Math.ceil(filteredVehicles.length / itemsPerPage);
  const currentVehicles = filteredVehicles.slice(
    (currentPageVehicles - 1) * itemsPerPage,
    currentPageVehicles * itemsPerPage
  );

  // ==================== LOGI ====================
  const fetchLogsForVehicle = async (vehicleId: number) => {
    if (!token) return;
    setLoadingLogs(true);
    try {
      const response = await axios.get(`${API_URL}/vehicles/vehicle-logs/vehicle/${vehicleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVehicleLogs(response.data);
    } catch (error) {
      console.error('Błąd pobierania logów:', error);
      Alert.alert('Błąd', 'Nie udało się pobrać historii pojazdu');
    } finally {
      setLoadingLogs(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeSection === 'users') {
      await fetchUsers();
    } else if (activeSection === 'fleet') {
      await fetchVehicles();
    } else if (activeSection === 'dashboard') {
      await fetchDriversForMap();
    }
    setRefreshing(false);
  };

  useEffect(() => {
    if (activeSection === 'users' && token) {
      fetchUsers();
    } else if (activeSection === 'fleet' && token) {
      fetchVehicles();
    }
  }, [activeSection, token]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'dostępny': return '#28a745';
      case 'w użyciu': return '#ffc107';
      case 'niedostępny': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    switch(eventType) {
      case 'rozpoczęcie_pracy': return '🚗 Rozpoczęcie pracy';
      case 'zakończenie_pracy': return '🏁 Zakończenie pracy';
      case 'przejazd': return '🚖 Przejazd';
      case 'awaria': return '⚠️ Awaria';
      default: return '📝 Uwagi';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pl-PL');
  };

  return (
    <View style={AdminPanelStyles.container}>
      {/* Nagłówek z przyciskiem menu */}
      <View style={AdminPanelStyles.header}>
        <Image 
          source={require('../assets/MichelinLogo.png')} 
          style={AdminPanelStyles.logoImage}
          resizeMode="contain"
        />
        <Pressable onPress={toggleMenu} style={AdminPanelStyles.menuButton}>
          <Ionicons name="menu" size={32} color="white" />
        </Pressable>
      </View>

      {/* Wysuwane menu z prawej strony */}
      {isMenuOpen && (
        <Pressable style={AdminPanelStyles.overlay} onPress={closeMenu} />
      )}
      <View style={[AdminPanelStyles.sideMenu, isMenuOpen && AdminPanelStyles.sideMenuOpen]}>
        <View style={AdminPanelStyles.sideMenuHeader}>
          <Text style={AdminPanelStyles.sideMenuHeaderText}>👑 Panel Administratora</Text>
          <Pressable onPress={closeMenu} style={AdminPanelStyles.closeMenuButton}>
            <Ionicons name="close" size={28} color="#333" />
          </Pressable>
        </View>

         <Pressable
          style={[AdminPanelStyles.sideMenuItem, activeSection === 'dashboard' && AdminPanelStyles.sideMenuItemActive]}
          onPress={() => { setActiveSection('dashboard'); closeMenu(); }}
        >
          <Ionicons name="map" size={24} color={activeSection === 'dashboard' ? '#0a1d56' : '#555'} />
          <Text style={[AdminPanelStyles.sideMenuItemText, activeSection === 'dashboard' && AdminPanelStyles.sideMenuItemTextActive]}>
            🗺️ Kursy
          </Text>
        </Pressable>

        <Pressable
          style={[AdminPanelStyles.sideMenuItem, activeSection === 'users' && AdminPanelStyles.sideMenuItemActive]}
          onPress={() => { setActiveSection('users'); closeMenu(); }}
        >
          <Ionicons name="people" size={24} color={activeSection === 'users' ? '#0a1d56' : '#555'} />
          <Text style={[AdminPanelStyles.sideMenuItemText, activeSection === 'users' && AdminPanelStyles.sideMenuItemTextActive]}>
            👥 Użytkownicy
          </Text>
        </Pressable>

        <Pressable
          style={[AdminPanelStyles.sideMenuItem, activeSection === 'fleet' && AdminPanelStyles.sideMenuItemActive]}
          onPress={() => { setActiveSection('fleet'); closeMenu(); }}
        >
          <Ionicons name="car" size={24} color={activeSection === 'fleet' ? '#0a1d56' : '#555'} />
          <Text style={[AdminPanelStyles.sideMenuItemText, activeSection === 'fleet' && AdminPanelStyles.sideMenuItemTextActive]}>
            🚗 Flota
          </Text>
        </Pressable>

        <Pressable
          style={[AdminPanelStyles.sideMenuItem, activeSection === 'reports' && AdminPanelStyles.sideMenuItemActive]}
          onPress={() => { setActiveSection('reports'); closeMenu(); }}
        >
          <Ionicons name="document-text" size={24} color={activeSection === 'reports' ? '#0a1d56' : '#555'} />
          <Text style={[AdminPanelStyles.sideMenuItemText, activeSection === 'reports' && AdminPanelStyles.sideMenuItemTextActive]}>
            📋 Raporty
          </Text>
        </Pressable>

        <Pressable
          style={[AdminPanelStyles.sideMenuItem, activeSection === 'blocks' && AdminPanelStyles.sideMenuItemActive]}
          onPress={() => { setActiveSection('blocks'); closeMenu(); }}
        >
          <Ionicons name="lock-closed" size={24} color={activeSection === 'blocks' ? '#0a1d56' : '#555'} />
          <Text style={[AdminPanelStyles.sideMenuItemText, activeSection === 'blocks' && AdminPanelStyles.sideMenuItemTextActive]}>
            🔒 Blokady
          </Text>
        </Pressable>

        <Pressable
          style={[AdminPanelStyles.sideMenuItem, activeSection === 'stats' && AdminPanelStyles.sideMenuItemActive]}
          onPress={() => { setActiveSection('stats'); closeMenu(); }}
        >
          <Ionicons name="stats-chart" size={24} color={activeSection === 'stats' ? '#0a1d56' : '#555'} />
          <Text style={[AdminPanelStyles.sideMenuItemText, activeSection === 'stats' && AdminPanelStyles.sideMenuItemTextActive]}>
            📊 Statystyki
          </Text>
        </Pressable>

        <View style={AdminPanelStyles.sideMenuDivider} />

        <Pressable style={AdminPanelStyles.sideMenuItem} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#dc3545" />
          <Text style={[AdminPanelStyles.sideMenuItemText, { color: '#dc3545' }]}>
            Wyloguj się
          </Text>
        </Pressable>
      </View>

      {/* Treść */}
      <ScrollView
        style={AdminPanelStyles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
              {/*  SEKCJA DASHBOARD / MAPA  */}
        {activeSection === 'dashboard' && (
          <View style={AdminPanelStyles.section}>
            <View style={AdminPanelStyles.sectionHeader}>
              <Text style={AdminPanelStyles.sectionTitle}>🗺️ Podgląd kursów</Text>
            </View>

            {/* Widok mapy */}
            <View style={{ height: 400, borderRadius: 12, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#ccc' }}>
              <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: 53.7784, // Olsztyn (jak w podanym kodzie web)
                  longitude: 20.4801,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }}
              >
                {drivers.map(driver => {
                  const lat = Number(driver.currentLat);
                  const lng = Number(driver.currentLng);
                  
                  if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

                  // Przygotowujemy tekst do dymka
                  const statusText = driver.isOnline ? '🟢 Online' : '⚪ Offline';
                  const phoneText = driver.phone ? `📞 ${driver.phone}` : '📞 Nie podano';

                  return (
                    <Marker
                      key={driver.id}
                      coordinate={{ latitude: lat, longitude: lng }}
                      pinColor={driver.isOnline ? '#28a745' : '#ccc'}
                      title={`${driver.firstName} ${driver.lastName}`}
                      description={`${statusText}  •  ${phoneText}  •  📧 ${driver.email}`}
                    />
                  );
                })}
              </MapView>
            </View>

            {/* Lista kierowców / Operacyjni */}
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0a1d56', marginBottom: 12, borderBottomWidth: 2, borderBottomColor: '#FFD700', paddingBottom: 5, alignSelf: 'flex-start' }}>
              Operacyjni ({drivers.filter(d => d.isOnline).length}/{drivers.length})
            </Text>
            
            <View style={{ backgroundColor: '#f8f9fa', borderRadius: 8, padding: 10, marginBottom: 40 }}>
              {sortedDrivers.map(driver => (
                <Pressable 
                  key={driver.id} 
                  onPress={() => handleSelectDriver(driver)}
                  style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: 12, 
                    backgroundColor: selectedDriver?.id === driver.id ? '#eef2ff' : 'white', 
                    borderRadius: 8, 
                    marginBottom: 8, 
                    borderWidth: selectedDriver?.id === driver.id ? 1 : 0,
                    borderColor: '#0a1d56',
                    elevation: 2, 
                  }}
                >
                  <View>
                    <Text style={{ fontWeight: 'bold', color: '#333', fontSize: 15 }}>
                      {driver.firstName} {driver.lastName}
                    </Text>
                    <Text style={{ fontSize: 12, color: driver.isOnline ? '#28a745' : '#999', marginTop: 4, fontWeight: 'bold' }}>
                      {driver.isOnline ? '🟢 DOSTĘPNY' : '⚪ OFFLINE'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 13, color: '#666' }}>{driver.phone || 'Brak tel.'}</Text>
                  </View>
                </Pressable>
              ))}
              {drivers.length === 0 && (
                <Text style={{ textAlign: 'center', color: '#666', padding: 10 }}>Brak przypisanych kierowców.</Text>
              )}
            </View>
          </View>
        )}
        {/* SEKCJA UŻYTKOWNICY */}
        {activeSection === 'users' && (
          <View style={AdminPanelStyles.section}>
            <View style={[
              AdminPanelStyles.sectionHeader, 
              { 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10, 
                marginBottom: 15
              }
            ]}>
              <Text style={[
                AdminPanelStyles.sectionTitle, 
                { flexShrink: 1, marginRight: 10 }
              ]}>
                👥 Zarządzanie użytkownikami
              </Text>
              <Pressable 
                style={AdminPanelStyles.addButton} 
                onPress={() => {
                  setShowForm(!showForm); 
                  setShowEditUserForm(false);
                }}
              >
                <Text style={AdminPanelStyles.addButtonText}>{showForm ? '✕ Anuluj' : '➕ Dodaj'}</Text>
              </Pressable>
            </View>

            <View style={{ marginBottom: 15 }}>
              <TextInput
                style={[AdminPanelStyles.input, { marginBottom: 5 }]}
                placeholder="Wyszukaj użytkownika..."
                value={searchTermUsers}
                onChangeText={(text) => {
                  setSearchTermUsers(text);
                  setCurrentPageUsers(1); // Powrót na 1 stronę przy szukaniu
                }}
              />
              <Text style={{ fontSize: 12, color: '#666', marginLeft: 5 }}>
                Znaleziono: {filteredUsers.length}
              </Text>
            </View>

            {showForm && (
              <View style={AdminPanelStyles.formContainer}>
                <Text style={AdminPanelStyles.formTitle}>Nowy użytkownik</Text>
                <TextInput style={AdminPanelStyles.input} placeholder="Username *" value={newUser.username} onChangeText={(text) => setNewUser({ ...newUser, username: text })} />
                <TextInput style={AdminPanelStyles.input} placeholder="Email *" keyboardType="email-address" autoCapitalize="none" value={newUser.email} onChangeText={(text) => setNewUser({ ...newUser, email: text })} />
                <TextInput style={AdminPanelStyles.input} placeholder="Hasło *" secureTextEntry value={newUser.password} onChangeText={(text) => setNewUser({ ...newUser, password: text })} />
                <TextInput style={AdminPanelStyles.input} placeholder="Imię *" value={newUser.firstName} onChangeText={(text) => setNewUser({ ...newUser, firstName: text })} />
                <TextInput style={AdminPanelStyles.input} placeholder="Nazwisko *" value={newUser.lastName} onChangeText={(text) => setNewUser({ ...newUser, lastName: text })} />
                <TextInput style={AdminPanelStyles.input} placeholder="Telefon" value={newUser.phone} onChangeText={(text) => setNewUser({ ...newUser, phone: text })} />
                
                <View style={AdminPanelStyles.pickerContainer}>
                  <Text style={AdminPanelStyles.pickerLabel}>Rola:</Text>
                  <View style={AdminPanelStyles.roleButtons}>
                    {['employee', 'driver', 'admin'].map((role) => (
                      <Pressable key={role} style={[AdminPanelStyles.roleButton, newUser.role === role && AdminPanelStyles.roleButtonActive]} onPress={() => setNewUser({ ...newUser, role })}>
                        <Text style={[AdminPanelStyles.roleButtonText, newUser.role === role && AdminPanelStyles.roleButtonTextActive]}>
                          {role === 'employee' ? 'Pracownik' : role === 'driver' ? 'Kierowca' : 'Admin'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={AdminPanelStyles.formActions}>
                  <Pressable style={AdminPanelStyles.submitButton} onPress={addUser}><Text style={AdminPanelStyles.submitButtonText}>Zapisz</Text></Pressable>
                  <Pressable style={AdminPanelStyles.cancelButton} onPress={() => setShowForm(false)}><Text style={AdminPanelStyles.cancelButtonText}>Anuluj</Text></Pressable>
                </View>
              </View>
            )}

            {showEditUserForm && (
              <View style={[AdminPanelStyles.formContainer, { backgroundColor: '#eef2ff', borderColor: '#0a1d56', borderLeftWidth: 5 }]}>
                <Text style={AdminPanelStyles.formTitle}>Edytuj: {editingUser?.username}</Text>
                <TextInput style={AdminPanelStyles.input} placeholder="Email *" value={editUserData.email} onChangeText={(text) => setEditUserData({ ...editUserData, email: text })} />
                <TextInput style={AdminPanelStyles.input} placeholder="Nowe Hasło (opcjonalnie)" secureTextEntry value={editUserData.password} onChangeText={(text) => setEditUserData({ ...editUserData, password: text })} />
                <TextInput style={AdminPanelStyles.input} placeholder="Imię *" value={editUserData.firstName} onChangeText={(text) => setEditUserData({ ...editUserData, firstName: text })} />
                <TextInput style={AdminPanelStyles.input} placeholder="Nazwisko *" value={editUserData.lastName} onChangeText={(text) => setEditUserData({ ...editUserData, lastName: text })} />
                <TextInput style={AdminPanelStyles.input} placeholder="Telefon" value={editUserData.phone} onChangeText={(text) => setEditUserData({ ...editUserData, phone: text })} />
                
                <View style={AdminPanelStyles.pickerContainer}>
                  <Text style={AdminPanelStyles.pickerLabel}>Rola:</Text>
                  <View style={AdminPanelStyles.roleButtons}>
                    {['employee', 'driver', 'admin'].map((role) => (
                      <Pressable key={role} style={[AdminPanelStyles.roleButton, editUserData.role === role && AdminPanelStyles.roleButtonActive]} onPress={() => setEditUserData({ ...editUserData, role })}>
                        <Text style={[AdminPanelStyles.roleButtonText, editUserData.role === role && AdminPanelStyles.roleButtonTextActive]}>
                          {role === 'employee' ? 'Pracownik' : role === 'driver' ? 'Kierowca' : 'Admin'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={AdminPanelStyles.formActions}>
                  <Pressable style={AdminPanelStyles.submitButton} onPress={updateUser}><Text style={AdminPanelStyles.submitButtonText}>Zapisz zmiany</Text></Pressable>
                  <Pressable style={AdminPanelStyles.cancelButton} onPress={() => setShowEditUserForm(false)}><Text style={AdminPanelStyles.cancelButtonText}>Anuluj</Text></Pressable>
                </View>
              </View>
            )}

            {loading ? (
              <ActivityIndicator size="large" color="#0a1d56" style={AdminPanelStyles.loader} />
            ) : (
              <>
                <View style={AdminPanelStyles.tableContainer}>
                  <View style={AdminPanelStyles.tableHeader}>
                    <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { width: 40 }]}>ID</Text>
                    <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { flex: 1.5 }]}>Użytkownik</Text>
                    <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { flex: 1 }]}>Rola</Text>
                    <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { width: 80 }]}>Akcje</Text>
                  </View>
                  <View style={AdminPanelStyles.tableBody}>
                    {currentUsers.map((user) => (
                      <View key={user.id} style={AdminPanelStyles.tableRow}>
                        <Text style={[AdminPanelStyles.tableCell, { width: 40 }]}>{String(user.id).substring(0,2)}</Text>
                        <View style={{ flex: 1.5 }}>
                          <Text style={{ fontWeight: 'bold' }}>{user.username}</Text>
                          <Text style={{ fontSize: 10, color: '#666' }}>{user.email}</Text>
                        </View>
                        <Text style={[AdminPanelStyles.tableCell, { flex: 1, fontSize: 11 }]}>{user.role}</Text>
                        <View style={{ flexDirection: 'row', width: 80, justifyContent: 'space-around' }}>
                          <Pressable onPress={() => startEditUser(user)}>
                            <Ionicons name="create-outline" size={20} color="#0a1d56" />
                          </Pressable>
                          <Pressable onPress={() => deleteUser(user.id)}>
                            <Ionicons name="trash-outline" size={20} color="#dc3545" />
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
                {totalPagesUsers > 1 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15, paddingBottom: 20 }}>
                    <Pressable 
                      disabled={currentPageUsers === 1} 
                      onPress={() => setCurrentPageUsers(v => v - 1)}
                      style={{ padding: 10, opacity: currentPageUsers === 1 ? 0.3 : 1 }}
                    >
                      <Ionicons name="chevron-back" size={24} color="#0a1d56" />
                    </Pressable>
                    
                    <Text style={{ marginHorizontal: 20, fontWeight: 'bold' }}>
                      Strona {currentPageUsers} z {totalPagesUsers}
                    </Text>

                    <Pressable 
                      disabled={currentPageUsers === totalPagesUsers} 
                      onPress={() => setCurrentPageUsers(v => v + 1)}
                      style={{ padding: 10, opacity: currentPageUsers === totalPagesUsers ? 0.3 : 1 }}
                    >
                      <Ionicons name="chevron-forward" size={24} color="#0a1d56" />
                    </Pressable>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* SEKCJA FLOTA */}
        {activeSection === 'fleet' && (
          <View style={AdminPanelStyles.section}>
            <View style={[AdminPanelStyles.sectionHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 15 }]}>
              <Text style={[AdminPanelStyles.sectionTitle, { flexShrink: 1 }]}>🚗 Zarządzanie flotą</Text>
              <Pressable 
                style={AdminPanelStyles.addButton} 
                onPress={() => {
                  setShowVehicleForm(!showVehicleForm);
                  setShowEditVehicleForm(false);
                }}
              >
                <Text style={AdminPanelStyles.addButtonText}>{showVehicleForm ? '✕ Anuluj' : '➕ Dodaj pojazd'}</Text>
              </Pressable>
            </View>

            {/* Wyszukiwarka floty */}
            <View style={{ marginBottom: 15 }}>
              <TextInput
                style={[AdminPanelStyles.input, { marginBottom: 5 }]}
                placeholder="Wyszukaj pojazd (rejestracja, marka...)"
                value={searchTermVehicles}
                onChangeText={(text) => {
                  setSearchTermVehicles(text);
                  setCurrentPageVehicles(1);
                }}
              />
              <Text style={{ fontSize: 12, color: '#666', marginLeft: 5 }}>
                Znaleziono: {filteredVehicles.length}
              </Text>
            </View>

            {/* Formularze dodawania i edycji */}
            {(showVehicleForm || showEditVehicleForm) && (
              <View style={[AdminPanelStyles.formContainer, showEditVehicleForm && { backgroundColor: '#fff3cd', borderColor: '#856404' }]}>
                <Text style={AdminPanelStyles.formTitle}>{showEditVehicleForm ? 'Edytuj pojazd' : 'Nowy pojazd'}</Text>
                <TextInput 
                  style={AdminPanelStyles.input} 
                  placeholder="Rejestracja *" 
                  value={showEditVehicleForm ? editingVehicle?.registration : newVehicle.registration} 
                  onChangeText={(text) => showEditVehicleForm ? setEditingVehicle({...editingVehicle!, registration: text}) : setNewVehicle({ ...newVehicle, registration: text })} 
                />
                <TextInput 
                  style={AdminPanelStyles.input} 
                  placeholder="Marka *" 
                  value={showEditVehicleForm ? editingVehicle?.brand : newVehicle.brand} 
                  onChangeText={(text) => showEditVehicleForm ? setEditingVehicle({...editingVehicle!, brand: text}) : setNewVehicle({ ...newVehicle, brand: text })} 
                />
                <TextInput 
                  style={AdminPanelStyles.input} 
                  placeholder="Model *" 
                  value={showEditVehicleForm ? editingVehicle?.model : newVehicle.model} 
                  onChangeText={(text) => showEditVehicleForm ? setEditingVehicle({...editingVehicle!, model: text}) : setNewVehicle({ ...newVehicle, model: text })} 
                />
                
                <View style={AdminPanelStyles.pickerContainer}>
                  <Text style={AdminPanelStyles.pickerLabel}>Status:</Text>
                  <View style={AdminPanelStyles.roleButtons}>
                    {['dostępny', 'w użyciu', 'niedostępny'].map((status) => (
                      <Pressable 
                        key={status} 
                        style={[AdminPanelStyles.roleButton, (showEditVehicleForm ? editingVehicle?.status : newVehicle.status) === status && AdminPanelStyles.roleButtonActive]} 
                        onPress={() => showEditVehicleForm ? setEditingVehicle({...editingVehicle!, status}) : setNewVehicle({ ...newVehicle, status })}
                      >
                        <Text style={[AdminPanelStyles.roleButtonText, (showEditVehicleForm ? editingVehicle?.status : newVehicle.status) === status && AdminPanelStyles.roleButtonTextActive]}>
                          {status === 'dostępny' ? '✅' : status === 'w użyciu' ? '🚗' : '❌'} {status}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={[AdminPanelStyles.pickerContainer, { marginTop: 10 }]}>
                  <Text style={AdminPanelStyles.pickerLabel}>Stan techniczny:</Text>
                  <View style={AdminPanelStyles.roleButtons}>
                    <Pressable
                      style={[
                        AdminPanelStyles.roleButton,
                        !editingVehicle.isBreakdown && { backgroundColor: '#28a745' },
                      ]}
                      onPress={() => setEditingVehicle({ ...editingVehicle, isBreakdown: false })}
                    >
                      <Text style={[AdminPanelStyles.roleButtonText, !editingVehicle.isBreakdown && { color: 'white' }]}>
                        ✅ SPRAWNY
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        AdminPanelStyles.roleButton,
                        editingVehicle.isBreakdown && { backgroundColor: '#dc3545' },
                      ]}
                      onPress={() => setEditingVehicle({ ...editingVehicle, isBreakdown: true })}
                    >
                      <Text style={[AdminPanelStyles.roleButtonText, editingVehicle.isBreakdown && { color: 'white' }]}>
                        ⚠️ AWARIA
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View style={AdminPanelStyles.formActions}>
                  <Pressable style={AdminPanelStyles.submitButton} onPress={showEditVehicleForm ? updateVehicle : addVehicle}>
                    <Text style={AdminPanelStyles.submitButtonText}>Zapisz</Text>
                  </Pressable>
                  <Pressable style={AdminPanelStyles.cancelButton} onPress={() => { setShowVehicleForm(false); setShowEditVehicleForm(false); }}>
                    <Text style={AdminPanelStyles.cancelButtonText}>Anuluj</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {loadingVehicles ? (
              <ActivityIndicator size="large" color="#0a1d56" style={AdminPanelStyles.loader} />
            ) : (
              <>
                <View style={AdminPanelStyles.tableContainer}>
                  <View style={AdminPanelStyles.tableHeader}>
                    <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { width: 90 }]}>Rejestracja</Text>
                    <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { flex: 1 }]}>Status</Text>
                    <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { flex: 1 }]}>Stan</Text>
                    <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { width: 70 }]}>Akcje</Text>
                  </View>
                  <View style={AdminPanelStyles.tableBody}>
                    {currentVehicles.map((vehicle) => (
                      <View key={vehicle.id} style={AdminPanelStyles.tableRow}>
                        <View style={{ width: 90 }}>
                          <Text style={{ fontWeight: 'bold', fontSize: 12 }}>{vehicle.registration}</Text>
                          <Text style={{ fontSize: 10, color: '#666' }}>{vehicle.brand} {vehicle.model}</Text>
                        </View>
                        
                        {/* Status Badge */}
                        <View style={{ flex: 1 }}>
                          <View style={{ 
                            backgroundColor: vehicle.status === 'dostępny' ? '#e8f5e9' : '#fff3e0', 
                            padding: 4, borderRadius: 4, alignSelf: 'flex-start' 
                          }}>
                            <Text style={{ fontSize: 9, fontWeight: 'bold', color: getStatusColor(vehicle.status) }}>
                              {vehicle.status.toUpperCase()}
                            </Text>
                          </View>
                        </View>

                        {/* Stan (Awaria/Sprawny) - Przycisk przełączający jak w Web */}
                        <Pressable 
                          style={{ flex: 1 }} 
                          onPress={() => toggleBreakdown(vehicle.id, vehicle.isBreakdown)}
                        >
                          <View style={{ 
                            backgroundColor: vehicle.isBreakdown ? '#fdecea' : '#f0f0f0', 
                            padding: 4, borderRadius: 4, alignSelf: 'flex-start',
                            borderWidth: 1, borderColor: vehicle.isBreakdown ? '#dc3545' : '#ccc'
                          }}>
                            <Text style={{ fontSize: 9, fontWeight: 'bold', color: vehicle.isBreakdown ? '#dc3545' : '#666' }}>
                              {vehicle.isBreakdown ? '⚠️ AWARIA' : '✅ SPRAWNY'}
                            </Text>
                          </View>
                        </Pressable>

                        {/* Akcje */}
                        <View style={{ flexDirection: 'row', width: 70, justifyContent: 'space-around' }}>
                          <Pressable onPress={() => startEditVehicle(vehicle)}>
                            <Ionicons name="create-outline" size={20} color="#0a1d56" />
                          </Pressable>
                          <Pressable onPress={() => deleteVehicle(vehicle.id)}>
                            <Ionicons name="trash-outline" size={20} color="#dc3545" />
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Paginacja Floty */}
                {totalPagesVehicles > 1 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15, paddingBottom: 20 }}>
                    <Pressable disabled={currentPageVehicles === 1} onPress={() => setCurrentPageVehicles(v => v - 1)} style={{ padding: 10, opacity: currentPageVehicles === 1 ? 0.3 : 1 }}>
                      <Ionicons name="chevron-back" size={24} color="#0a1d56" />
                    </Pressable>
                    <Text style={{ marginHorizontal: 20, fontWeight: 'bold' }}>Strona {currentPageVehicles} z {totalPagesVehicles}</Text>
                    <Pressable disabled={currentPageVehicles === totalPagesVehicles} onPress={() => setCurrentPageVehicles(v => v + 1)} style={{ padding: 10, opacity: currentPageVehicles === totalPagesVehicles ? 0.3 : 1 }}>
                      <Ionicons name="chevron-forward" size={24} color="#0a1d56" />
                    </Pressable>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* SEKCJA RAPORTY */}
        {activeSection === 'reports' && (
          <View style={AdminPanelStyles.section}>
            <Text style={AdminPanelStyles.sectionTitle}>📋 Raporty - Historia pojazdów</Text>
            
            <View style={{ marginBottom: 20, zIndex: 100 }}>
              <Text style={AdminPanelStyles.pickerLabel}>Wybierz pojazd:</Text>
              
              {/* „Dropdown” - Pole wyboru */}
              <Pressable 
                style={[AdminPanelStyles.input, { 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor: isVehiclePickerOpen ? '#0a1d56' : '#ccc'
                }]}
                onPress={() => setIsVehiclePickerOpen(!isVehiclePickerOpen)}
              >
                <Text style={{ color: selectedVehicleId ? '#000' : '#999' }}>
                  {selectedVehicleId 
                    ? vehicles.find(v => v.id === selectedVehicleId)?.brand + ' ' + vehicles.find(v => v.id === selectedVehicleId)?.model + ` (${vehicles.find(v => v.id === selectedVehicleId)?.registration})`
                    : '-- Wybierz z listy --'}
                </Text>
                <Ionicons name={isVehiclePickerOpen ? "chevron-up" : "chevron-down"} size={20} color="#666" />
              </Pressable>

              {/* Wysuwana lista opcji */}
              {isVehiclePickerOpen && (
                <View style={{
                  backgroundColor: 'white',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#ccc',
                  marginTop: 5, // Mały odstęp od przycisku
                  marginBottom: 15, // Odsuwa tabelę z wynikami w dół po rozwinięciu
                  maxHeight: 250, // Limituje okienko
                  overflow: 'hidden', // Zapobiega wylewaniu się tła na zaokrąglonych rogach
                }}>
                  <ScrollView nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                  >
                    <Pressable
                      style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                      onPress={() => {
                        setSelectedVehicleId(null);
                        setVehicleLogs([]);
                        setIsVehiclePickerOpen(false);
                      }}
                    >
                      <Text style={{ color: '#666' }}>-- Wybierz z listy --</Text>
                    </Pressable>
                    {vehicles.map(vehicle => (
                      <Pressable
                        key={vehicle.id}
                        style={{ 
                          padding: 12, 
                          borderBottomWidth: 1, 
                          borderBottomColor: '#eee',
                          backgroundColor: selectedVehicleId === vehicle.id ? '#f0f4ff' : 'white'
                        }}
                        onPress={() => {
                          setSelectedVehicleId(vehicle.id);
                          fetchLogsForVehicle(vehicle.id);
                          setIsVehiclePickerOpen(false);
                        }}
                      >
                        <Text style={{ fontWeight: selectedVehicleId === vehicle.id ? 'bold' : 'normal' }}>
                          {vehicle.brand} {vehicle.model} ({vehicle.registration})
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Wyniki (Tabela) */}
            {selectedVehicleId ? (
              loadingLogs ? (
                <ActivityIndicator size="large" color="#0a1d56" style={AdminPanelStyles.loader} />
              ) : vehicleLogs.length === 0 ? (
                <View style={AdminPanelStyles.emptyState}>
                  <Text>Brak logów dla tego pojazdu.</Text>
                </View>
              ) : (
                <View style={[AdminPanelStyles.tableContainer, { zIndex: 1 }]}>
                  <View style={AdminPanelStyles.tableHeader}>
                    <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { flex: 1.2 }]}>Data</Text>
                    <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { flex: 1 }]}>Typ</Text>
                    <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { flex: 2 }]}>Opis</Text>
                    <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { flex: 1.5 }]}>Kierowca/Zmienił</Text>
                  </View>
                  
                  <ScrollView 
                    style={[AdminPanelStyles.tableBody, { maxHeight: 400 }]} 
                    nestedScrollEnabled={true}
                  >
                    {vehicleLogs.map((log) => (
                      <View key={log.id} style={AdminPanelStyles.tableRow}>
                        <Text style={[AdminPanelStyles.tableCell, { flex: 1.2, fontSize: 9 }]}>{formatDate(log.eventTime)}</Text>
                        <Text style={[AdminPanelStyles.tableCell, { flex: 1, fontSize: 9 }]}>{getEventTypeLabel(log.eventType)}</Text>
                        <Text style={[AdminPanelStyles.tableCell, { flex: 2, fontSize: 9 }]}>{log.description || '-'}</Text>
                        <View style={[AdminPanelStyles.tableCell, { flex: 1.5, justifyContent: 'center' }]}>
                          {log.driver && (
                            <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#0a1d56', marginBottom: 4 }}>
                              🚘 {log.driver.firstName} {log.driver.lastName}
                            </Text>
                          )}
                          <Text style={{ fontSize: 9, color: '#666' }}>
                            ✏️ {log.changedBy || 'System'}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )
            ) : (
              <View style={[AdminPanelStyles.emptyState, { marginTop: 20 }]}>
                <Ionicons name="car-outline" size={48} color="#ccc" />
                <Text style={{ color: '#999', marginTop: 10 }}>Wybierz pojazd, aby zobaczyć jego historię.</Text>
              </View>
            )}
          </View>
        )}


        {/* SEKCJA BLOKADY (placeholder) */}
        {activeSection === 'blocks' && (
          <View style={AdminPanelStyles.placeholderSection}>
            <Ionicons name="lock-closed" size={64} color="#ccc" />
            <Text style={AdminPanelStyles.placeholderTitle}>🔒 Blokady pojazdów</Text>
            <Text style={AdminPanelStyles.placeholderText}>Sekcja w budowie...</Text>
          </View>
        )}

        {/* SEKCJA STATYSTYKI (placeholder) */}
        {activeSection === 'stats' && (
          <View style={AdminPanelStyles.placeholderSection}>
            <Ionicons name="stats-chart" size={64} color="#ccc" />
            <Text style={AdminPanelStyles.placeholderTitle}>📊 Statystyki</Text>
            <Text style={AdminPanelStyles.placeholderText}>Sekcja w budowie...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}