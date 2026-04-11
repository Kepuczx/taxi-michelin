import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// 🔥 UŻYJ SWOJEGO IP (z ipconfig)
const API_URL = 'http://192.168.1.21:3000';

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

export default function AdminPanelScreen({ navigation }: any) {
  const [activeSection, setActiveSection] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
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

  // Funkcja wylogowania
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
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  // Pobierz token przy starcie
  useEffect(() => {
    const getToken = async () => {
      const storedToken = await AsyncStorage.getItem('userToken');
      const role = await AsyncStorage.getItem('userRole');
      
      // Sprawdź czy admin
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

  // Pobierz użytkowników
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

  // Odświeżanie
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  // Dodaj użytkownika
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

  // Usuń użytkownika
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

  useEffect(() => {
    if (activeSection === 'users' && token) {
      fetchUsers();
    }
  }, [activeSection, token]);

  // Sekcje (placeholder)
  const renderFleetSection = () => (
    <View style={styles.placeholderSection}>
      <Text style={styles.placeholderTitle}>🚗 Zarządzanie flotą</Text>
      <Text style={styles.placeholderText}>Wkrótce...</Text>
    </View>
  );

  const renderReportsSection = () => (
    <View style={styles.placeholderSection}>
      <Text style={styles.placeholderTitle}>📊 Raporty</Text>
      <Text style={styles.placeholderText}>Wkrótce...</Text>
    </View>
  );

  const renderBlocksSection = () => (
    <View style={styles.placeholderSection}>
      <Text style={styles.placeholderTitle}>🔒 Blokady pojazdów</Text>
      <Text style={styles.placeholderText}>Wkrótce...</Text>
    </View>
  );

  const renderStatsSection = () => (
    <View style={styles.placeholderSection}>
      <Text style={styles.placeholderTitle}>📈 Statystyki</Text>
      <Text style={styles.placeholderText}>Wkrótce...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Niebieski nagłówek z przyciskiem wylogowania */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>MICHELIN</Text>
          <Text style={styles.headerSubtitle}>Panel Administratora</Text>
        </View>
        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Wyloguj</Text>
        </Pressable>
      </View>

      {/* Szare menu */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.menuScroll}>
        <View style={styles.menuContainer}>
          <Pressable
            style={[styles.menuButton, activeSection === 'users' && styles.menuButtonActive]}
            onPress={() => setActiveSection('users')}
          >
            <Text style={[styles.menuButtonText, activeSection === 'users' && styles.menuButtonTextActive]}>
              👥 Użytkownicy
            </Text>
          </Pressable>
          <Pressable
            style={[styles.menuButton, activeSection === 'fleet' && styles.menuButtonActive]}
            onPress={() => setActiveSection('fleet')}
          >
            <Text style={[styles.menuButtonText, activeSection === 'fleet' && styles.menuButtonTextActive]}>
              🚗 Flota
            </Text>
          </Pressable>
          <Pressable
            style={[styles.menuButton, activeSection === 'reports' && styles.menuButtonActive]}
            onPress={() => setActiveSection('reports')}
          >
            <Text style={[styles.menuButtonText, activeSection === 'reports' && styles.menuButtonTextActive]}>
              📊 Raporty
            </Text>
          </Pressable>
          <Pressable
            style={[styles.menuButton, activeSection === 'blocks' && styles.menuButtonActive]}
            onPress={() => setActiveSection('blocks')}
          >
            <Text style={[styles.menuButtonText, activeSection === 'blocks' && styles.menuButtonTextActive]}>
              🔒 Blokady
            </Text>
          </Pressable>
          <Pressable
            style={[styles.menuButton, activeSection === 'stats' && styles.menuButtonActive]}
            onPress={() => setActiveSection('stats')}
          >
            <Text style={[styles.menuButtonText, activeSection === 'stats' && styles.menuButtonTextActive]}>
              📈 Statystyki
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Treść */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeSection === 'users' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Zarządzanie użytkownikami</Text>
              <Pressable style={styles.addButton} onPress={() => setShowForm(!showForm)}>
                <Text style={styles.addButtonText}>{showForm ? '✕ Anuluj' : '➕ Dodaj'}</Text>
              </Pressable>
            </View>

            {showForm && (
              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>Nowy użytkownik</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Username *"
                  value={newUser.username}
                  onChangeText={(text) => setNewUser({ ...newUser, username: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email *"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={newUser.email}
                  onChangeText={(text) => setNewUser({ ...newUser, email: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Hasło *"
                  secureTextEntry
                  value={newUser.password}
                  onChangeText={(text) => setNewUser({ ...newUser, password: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Imię *"
                  value={newUser.firstName}
                  onChangeText={(text) => setNewUser({ ...newUser, firstName: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nazwisko *"
                  value={newUser.lastName}
                  onChangeText={(text) => setNewUser({ ...newUser, lastName: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Telefon"
                  value={newUser.phone}
                  onChangeText={(text) => setNewUser({ ...newUser, phone: text })}
                />
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Rola:</Text>
                  <View style={styles.roleButtons}>
                    {['employee', 'driver', 'admin'].map((role) => (
                      <Pressable
                        key={role}
                        style={[
                          styles.roleButton,
                          newUser.role === role && styles.roleButtonActive,
                        ]}
                        onPress={() => setNewUser({ ...newUser, role })}
                      >
                        <Text style={[styles.roleButtonText, newUser.role === role && styles.roleButtonTextActive]}>
                          {role === 'employee' ? 'Pracownik' : role === 'driver' ? 'Kierowca' : 'Admin'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={styles.formActions}>
                  <Pressable style={styles.submitButton} onPress={addUser}>
                    <Text style={styles.submitButtonText}>Zapisz</Text>
                  </Pressable>
                  <Pressable style={styles.cancelButton} onPress={() => setShowForm(false)}>
                    <Text style={styles.cancelButtonText}>Anuluj</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {loading ? (
              <ActivityIndicator size="large" color="#0a1d56" style={styles.loader} />
            ) : (
              <View style={styles.tableContainer}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { width: 40 }]}>ID</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 1.5 }]}>Username</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 2 }]}>Email</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 1 }]}>Rola</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { width: 50 }]}>Akcje</Text>
                </View>
                <ScrollView style={styles.tableBody}>
                  {users.map((user) => (
                    <View key={user.id} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { width: 40 }]}>{user.id}</Text>
                      <Text style={[styles.tableCell, { flex: 1.5 }]}>{user.username}</Text>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{user.email}</Text>
                      <Text style={[styles.tableCell, { flex: 1 }]}>{user.role}</Text>
                      <Pressable style={styles.deleteButton} onPress={() => deleteUser(user.id)}>
                        <Text style={styles.deleteButtonText}>🗑️</Text>
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {activeSection === 'fleet' && renderFleetSection()}
        {activeSection === 'reports' && renderReportsSection()}
        {activeSection === 'blocks' && renderBlocksSection()}
        {activeSection === 'stats' && renderStatsSection()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#0a1d56',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#FFD700',
    fontSize: 14,
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  menuScroll: {
    backgroundColor: '#e0e0e0',
  },
  menuContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  menuButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  menuButtonActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#0a1d56',
  },
  menuButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  menuButtonTextActive: {
    color: '#0a1d56',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#0a1d56',
  },
  roleButtonText: {
    color: '#333',
  },
  roleButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 50,
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0a1d56',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    color: 'white',
    fontWeight: 'bold',
  },
  tableBody: {
    maxHeight: 500,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 14,
    color: '#333',
  },
  deleteButton: {
    width: 40,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 18,
  },
  placeholderSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
});