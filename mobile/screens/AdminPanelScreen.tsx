import React, { useState, useEffect } from 'react';
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

// 🔥 UŻYJ SWOJEGO IP (z ipconfig)
const API_URL = 'http://192.168.0.13:3000';

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
  const [activeSection, setActiveSection] = useState('users');
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
  const [token, setToken] = useState<string | null>(null);

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
      
      if (role !== 'admin') {
        Alert.alert('Brak dostępu', 'Panel tylko dla administratorów', [
          { text: 'OK', onPress: () => navigation.replace('ZamowieniePracownik') }
        ]);
        return;
      }
      setToken(storedToken);
    };
    getToken();
  }, []);

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
        headers: { Authorization: `Bearer ${token}` },
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
                headers: { Authorization: `Bearer ${token}` },
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
      }, {
        headers: { Authorization: `Bearer ${token}` },
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
        isBreakdown: !currentStatus,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchVehicles();
    } catch (error) {
      console.error('Błąd zmiany statusu awarii:', error);
      Alert.alert('Błąd', 'Nie udało się zmienić statusu awarii');
    }
  };

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
        {/* SEKCJA UŻYTKOWNICY */}
        {activeSection === 'users' && (
          <View style={AdminPanelStyles.section}>
            <View style={AdminPanelStyles.sectionHeader}>
              <Text style={AdminPanelStyles.sectionTitle}>👥 Zarządzanie użytkownikami</Text>
              <Pressable style={AdminPanelStyles.addButton} onPress={() => setShowForm(!showForm)}>
                <Text style={AdminPanelStyles.addButtonText}>{showForm ? '✕ Anuluj' : '➕ Dodaj'}</Text>
              </Pressable>
            </View>

            {showForm && (
              <View style={AdminPanelStyles.formContainer}>
                <Text style={AdminPanelStyles.formTitle}>Nowy użytkownik</Text>
                <TextInput
                  style={AdminPanelStyles.input}
                  placeholder="Username *"
                  value={newUser.username}
                  onChangeText={(text) => setNewUser({ ...newUser, username: text })}
                />
                <TextInput
                  style={AdminPanelStyles.input}
                  placeholder="Email *"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={newUser.email}
                  onChangeText={(text) => setNewUser({ ...newUser, email: text })}
                />
                <TextInput
                  style={AdminPanelStyles.input}
                  placeholder="Hasło *"
                  secureTextEntry
                  value={newUser.password}
                  onChangeText={(text) => setNewUser({ ...newUser, password: text })}
                />
                <TextInput
                  style={AdminPanelStyles.input}
                  placeholder="Imię *"
                  value={newUser.firstName}
                  onChangeText={(text) => setNewUser({ ...newUser, firstName: text })}
                />
                <TextInput
                  style={AdminPanelStyles.input}
                  placeholder="Nazwisko *"
                  value={newUser.lastName}
                  onChangeText={(text) => setNewUser({ ...newUser, lastName: text })}
                />
                <TextInput
                  style={AdminPanelStyles.input}
                  placeholder="Telefon"
                  value={newUser.phone}
                  onChangeText={(text) => setNewUser({ ...newUser, phone: text })}
                />
                <View style={AdminPanelStyles.pickerContainer}>
                  <Text style={AdminPanelStyles.pickerLabel}>Rola:</Text>
                  <View style={AdminPanelStyles.roleButtons}>
                    {['employee', 'driver', 'admin'].map((role) => (
                      <Pressable
                        key={role}
                        style={[
                          AdminPanelStyles.roleButton,
                          newUser.role === role && AdminPanelStyles.roleButtonActive,
                        ]}
                        onPress={() => setNewUser({ ...newUser, role })}
                      >
                        <Text style={[AdminPanelStyles.roleButtonText, newUser.role === role && AdminPanelStyles.roleButtonTextActive]}>
                          {role === 'employee' ? 'Pracownik' : role === 'driver' ? 'Kierowca' : 'Admin'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={AdminPanelStyles.formActions}>
                  <Pressable style={AdminPanelStyles.submitButton} onPress={addUser}>
                    <Text style={AdminPanelStyles.submitButtonText}>Zapisz</Text>
                  </Pressable>
                  <Pressable style={AdminPanelStyles.cancelButton} onPress={() => setShowForm(false)}>
                    <Text style={AdminPanelStyles.cancelButtonText}>Anuluj</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {loading ? (
              <ActivityIndicator size="large" color="#0a1d56" style={AdminPanelStyles.loader} />
            ) : (
              <View style={AdminPanelStyles.tableContainer}>
                <View style={AdminPanelStyles.tableHeader}>
                  <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { width: 40 }]}>ID</Text>
                  <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { flex: 1.5 }]}>Username</Text>
                  <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { flex: 2 }]}>Email</Text>
                  <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { flex: 1 }]}>Rola</Text>
                  <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { width: 50 }]}>Akcje</Text>
                </View>
                <ScrollView style={AdminPanelStyles.tableBody}>
                  {users.map((user) => (
                    <View key={user.id} style={AdminPanelStyles.tableRow}>
                      <Text style={[AdminPanelStyles.tableCell, { width: 40 }]}>{user.id}</Text>
                      <Text style={[AdminPanelStyles.tableCell, { flex: 1.5 }]}>{user.username}</Text>
                      <Text style={[AdminPanelStyles.tableCell, { flex: 2 }]}>{user.email}</Text>
                      <Text style={[AdminPanelStyles.tableCell, { flex: 1 }]}>{user.role}</Text>
                      <Pressable style={AdminPanelStyles.deleteButton} onPress={() => deleteUser(user.id)}>
                        <Text style={AdminPanelStyles.deleteButtonText}>🗑️</Text>
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* SEKCJA FLOTA */}
        {activeSection === 'fleet' && (
          <View style={AdminPanelStyles.section}>
            <View style={AdminPanelStyles.sectionHeader}>
              <Text style={AdminPanelStyles.sectionTitle}>🚗 Zarządzanie flotą</Text>
              <Pressable style={AdminPanelStyles.addButton} onPress={() => setShowVehicleForm(!showVehicleForm)}>
                <Text style={AdminPanelStyles.addButtonText}>{showVehicleForm ? '✕ Anuluj' : '➕ Dodaj pojazd'}</Text>
              </Pressable>
            </View>

            {showVehicleForm && (
              <View style={AdminPanelStyles.formContainer}>
                <Text style={AdminPanelStyles.formTitle}>Nowy pojazd</Text>
                <TextInput
                  style={AdminPanelStyles.input}
                  placeholder="Rejestracja *"
                  value={newVehicle.registration}
                  onChangeText={(text) => setNewVehicle({ ...newVehicle, registration: text })}
                />
                <TextInput
                  style={AdminPanelStyles.input}
                  placeholder="Marka *"
                  value={newVehicle.brand}
                  onChangeText={(text) => setNewVehicle({ ...newVehicle, brand: text })}
                />
                <TextInput
                  style={AdminPanelStyles.input}
                  placeholder="Model *"
                  value={newVehicle.model}
                  onChangeText={(text) => setNewVehicle({ ...newVehicle, model: text })}
                />
                <TextInput
                  style={AdminPanelStyles.input}
                  placeholder="Ilość miejsc"
                  keyboardType="numeric"
                  value={String(newVehicle.passengerCapacity)}
                  onChangeText={(text) => setNewVehicle({ ...newVehicle, passengerCapacity: parseInt(text) || 0 })}
                />
                <View style={AdminPanelStyles.pickerContainer}>
                  <Text style={AdminPanelStyles.pickerLabel}>Status:</Text>
                  <View style={AdminPanelStyles.roleButtons}>
                    {['dostępny', 'w użyciu', 'niedostępny'].map((status) => (
                      <Pressable
                        key={status}
                        style={[
                          AdminPanelStyles.roleButton,
                          newVehicle.status === status && AdminPanelStyles.roleButtonActive,
                        ]}
                        onPress={() => setNewVehicle({ ...newVehicle, status })}
                      >
                        <Text style={[AdminPanelStyles.roleButtonText, newVehicle.status === status && AdminPanelStyles.roleButtonTextActive]}>
                          {status === 'dostępny' ? '✅ Dostępny' : status === 'w użyciu' ? '🚗 W użyciu' : '❌ Niedostępny'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <TextInput
                  style={AdminPanelStyles.input}
                  placeholder="Notatki"
                  value={newVehicle.notes}
                  onChangeText={(text) => setNewVehicle({ ...newVehicle, notes: text })}
                />
                <View style={AdminPanelStyles.formActions}>
                  <Pressable style={AdminPanelStyles.submitButton} onPress={addVehicle}>
                    <Text style={AdminPanelStyles.submitButtonText}>Zapisz</Text>
                  </Pressable>
                  <Pressable style={AdminPanelStyles.cancelButton} onPress={() => setShowVehicleForm(false)}>
                    <Text style={AdminPanelStyles.cancelButtonText}>Anuluj</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {showEditVehicleForm && editingVehicle && (
              <View style={[AdminPanelStyles.formContainer, { backgroundColor: '#fff3cd' }]}>
                <Text style={AdminPanelStyles.formTitle}>Edytuj pojazd</Text>
                <TextInput
                  style={AdminPanelStyles.input}
                  placeholder="Rejestracja *"
                  value={editingVehicle.registration}
                  onChangeText={(text) => setEditingVehicle({ ...editingVehicle, registration: text })}
                />
                <TextInput
                  style={AdminPanelStyles.input}
                  placeholder="Marka *"
                  value={editingVehicle.brand}
                  onChangeText={(text) => setEditingVehicle({ ...editingVehicle, brand: text })}
                />
                <TextInput
                  style={AdminPanelStyles.input}
                  placeholder="Model *"
                  value={editingVehicle.model}
                  onChangeText={(text) => setEditingVehicle({ ...editingVehicle, model: text })}
                />
                <TextInput
                  style={AdminPanelStyles.input}
                  placeholder="Ilość miejsc"
                  keyboardType="numeric"
                  value={String(editingVehicle.passengerCapacity)}
                  onChangeText={(text) => setEditingVehicle({ ...editingVehicle, passengerCapacity: parseInt(text) || 0 })}
                />
                <View style={AdminPanelStyles.pickerContainer}>
                  <Text style={AdminPanelStyles.pickerLabel}>Status:</Text>
                  <View style={AdminPanelStyles.roleButtons}>
                    {['dostępny', 'w użyciu', 'niedostępny'].map((status) => (
                      <Pressable
                        key={status}
                        style={[
                          AdminPanelStyles.roleButton,
                          editingVehicle.status === status && AdminPanelStyles.roleButtonActive,
                        ]}
                        onPress={() => setEditingVehicle({ ...editingVehicle, status })}
                      >
                        <Text style={[AdminPanelStyles.roleButtonText, editingVehicle.status === status && AdminPanelStyles.roleButtonTextActive]}>
                          {status === 'dostępny' ? '✅ Dostępny' : status === 'w użyciu' ? '🚗 W użyciu' : '❌ Niedostępny'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <TextInput
                  style={AdminPanelStyles.input}
                  placeholder="Notatki"
                  value={editingVehicle.notes}
                  onChangeText={(text) => setEditingVehicle({ ...editingVehicle, notes: text })}
                />
                <View style={AdminPanelStyles.formActions}>
                  <Pressable style={AdminPanelStyles.submitButton} onPress={updateVehicle}>
                    <Text style={AdminPanelStyles.submitButtonText}>Zapisz zmiany</Text>
                  </Pressable>
                  <Pressable style={AdminPanelStyles.cancelButton} onPress={() => {
                    setShowEditVehicleForm(false);
                    setEditingVehicle(null);
                  }}>
                    <Text style={AdminPanelStyles.cancelButtonText}>Anuluj</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {loadingVehicles ? (
              <ActivityIndicator size="large" color="#0a1d56" style={AdminPanelStyles.loader} />
            ) : (
              <View style={AdminPanelStyles.tableContainer}>
                <View style={AdminPanelStyles.tableHeader}>
                  <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { width: 40 }]}>ID</Text>
                  <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { flex: 1.5 }]}>Rejestracja</Text>
                  <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { flex: 2 }]}>Marka/Model</Text>
                  <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { flex: 1 }]}>Status</Text>
                  <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { width: 50 }]}>Akcje</Text>
                </View>
                <ScrollView style={AdminPanelStyles.tableBody}>
                  {vehicles.map((vehicle) => (
                    <View key={vehicle.id} style={AdminPanelStyles.tableRow}>
                      <Text style={[AdminPanelStyles.tableCell, { width: 40 }]}>{vehicle.id}</Text>
                      <Text style={[AdminPanelStyles.tableCell, { flex: 1.5 }]}>{vehicle.registration}</Text>
                      <Text style={[AdminPanelStyles.tableCell, { flex: 2 }]}>{vehicle.brand} {vehicle.model}</Text>
                      <Text style={[AdminPanelStyles.tableCell, { flex: 1 }]}>
                        <Text style={{ color: getStatusColor(vehicle.status), fontWeight: 'bold' }}>
                          {vehicle.status === 'dostępny' ? '✅ Dostępny' : vehicle.status === 'w użyciu' ? '🚗 W użyciu' : '❌ Niedostępny'}
                        </Text>
                      </Text>
                      <View style={{ flexDirection: 'row', width: 50 }}>
                        <Pressable style={AdminPanelStyles.editButton} onPress={() => startEditVehicle(vehicle)}>
                          <Text style={AdminPanelStyles.editButtonText}>✏️</Text>
                        </Pressable>
                        <Pressable style={AdminPanelStyles.deleteButton} onPress={() => deleteVehicle(vehicle.id)}>
                          <Text style={AdminPanelStyles.deleteButtonText}>🗑️</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* SEKCJA RAPORTY */}
        {activeSection === 'reports' && (
          <View style={AdminPanelStyles.section}>
            <Text style={AdminPanelStyles.sectionTitle}>📋 Raporty - Historia pojazdów</Text>
            
            <View style={AdminPanelStyles.vehicleSelector}>
              <Text style={AdminPanelStyles.pickerLabel}>Wybierz pojazd:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={AdminPanelStyles.vehicleButtons}>
                  <Pressable
                    style={[AdminPanelStyles.vehicleButton, selectedVehicleId === null && AdminPanelStyles.vehicleButtonActive]}
                    onPress={() => {
                      setSelectedVehicleId(null);
                      setVehicleLogs([]);
                    }}
                  >
                    <Text style={[AdminPanelStyles.vehicleButtonText, selectedVehicleId === null && AdminPanelStyles.vehicleButtonTextActive]}>
                      -- Wybierz --
                    </Text>
                  </Pressable>
                  {vehicles.map(vehicle => (
                    <Pressable
                      key={vehicle.id}
                      style={[AdminPanelStyles.vehicleButton, selectedVehicleId === vehicle.id && AdminPanelStyles.vehicleButtonActive]}
                      onPress={() => {
                        setSelectedVehicleId(vehicle.id);
                        fetchLogsForVehicle(vehicle.id);
                      }}
                    >
                      <Text style={[AdminPanelStyles.vehicleButtonText, selectedVehicleId === vehicle.id && AdminPanelStyles.vehicleButtonTextActive]}>
                        {vehicle.brand} {vehicle.model}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {selectedVehicleId ? (
              loadingLogs ? (
                <ActivityIndicator size="large" color="#0a1d56" style={AdminPanelStyles.loader} />
              ) : vehicleLogs.length === 0 ? (
                <View style={AdminPanelStyles.emptyState}>
                  <Text>Brak logów dla tego pojazdu.</Text>
                </View>
              ) : (
                <View style={AdminPanelStyles.tableContainer}>
                  <View style={AdminPanelStyles.tableHeader}>
                    <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { flex: 1.5 }]}>Data</Text>
                    <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { flex: 1.5 }]}>Typ</Text>
                    <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { flex: 2 }]}>Opis</Text>
                    <Text style={[AdminPanelStyles.tableCell, AdminPanelStyles.tableHeaderCell, { flex: 1 }]}>Zmienił</Text>
                  </View>
                  <ScrollView style={AdminPanelStyles.tableBody}>
                    {vehicleLogs.map((log) => (
                      <View key={log.id} style={AdminPanelStyles.tableRow}>
                        <Text style={[AdminPanelStyles.tableCell, { flex: 1.5 }]}>{formatDate(log.eventTime)}</Text>
                        <Text style={[AdminPanelStyles.tableCell, { flex: 1.5 }]}>{getEventTypeLabel(log.eventType)}</Text>
                        <Text style={[AdminPanelStyles.tableCell, { flex: 2 }]}>{log.description || '-'}</Text>
                        <Text style={[AdminPanelStyles.tableCell, { flex: 1 }]}>{log.changedBy || '-'}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )
            ) : (
              <View style={AdminPanelStyles.emptyState}>
                <Text>Wybierz pojazd, aby zobaczyć jego historię.</Text>
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