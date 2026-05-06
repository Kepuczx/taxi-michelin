import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { API_URL } from './config';

interface Trip {
  id: number;
  createdAt: string; 
  pickupAddress: string;
  dropoffAddress: string;
  status: string;
  distanceKm?: string | number;
  driver?: {
    firstName: string;
    lastName: string;
  };
  vehicle?: {
    registration: string;
    brand: string;
  };
}

export default function HistoriaPracownik({ navigation }: any) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [firstName, setFirstName] = useState<string>('Pracownik');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- STANY SORTOWANIA I FILTROWANIA ---
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedMonth, setSelectedMonth] = useState<string>('Wszystkie');
  const [availableMonths, setAvailableMonths] = useState<string[]>(['Wszystkie']);

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

  const fetchHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');

      if (!token || !userId) return;

      const response = await axios.get(`${API_URL}/trips/client/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Zapisujemy surowe dane z bazy
      setTrips(response.data);

      // Wyciągamy unikalne miesiące z bazy do stworzenia filtrów
      const months = new Set<string>();
      response.data.forEach((trip: Trip) => {
        const date = new Date(trip.createdAt);
        const rawMonth = date.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
        months.add(rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1));
      });
      setAvailableMonths(['Wszystkie', ...Array.from(months)]);

    } catch (error) {
      console.error('Błąd pobierania historii:', error);
      Alert.alert('Błąd', 'Nie udało się pobrać historii przejazdów.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, []);

  const handleLogout = () => {
    Alert.alert('Wylogowanie', 'Czy na pewno chcesz się wylogować?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Wyloguj', style: 'destructive', onPress: async () => { await AsyncStorage.clear(); navigation.replace('Login'); } },
    ]);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  // Funkcja renderująca z zastosowaniem sortowania i filtrów
  const renderHistory = () => {
    // 1. Filtrowanie po miesiącu
    let displayedTrips = [...trips];
    if (selectedMonth !== 'Wszystkie') {
      displayedTrips = displayedTrips.filter(trip => {
        const date = new Date(trip.createdAt);
        const rawMonth = date.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
        return (rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1)) === selectedMonth;
      });
    }

    // 2. Sortowanie
    displayedTrips.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    if (displayedTrips.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>Brak przejazdów dla tych kryteriów.</Text>
        </View>
      );
    }

    let currentMonth = '';

    return displayedTrips.map((trip) => {
      const tripDate = new Date(trip.createdAt);
      const rawMonthYear = tripDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
      const formattedMonthYear = rawMonthYear.charAt(0).toUpperCase() + rawMonthYear.slice(1);
      
      const isNewMonth = formattedMonthYear !== currentMonth;
      if (isNewMonth) currentMonth = formattedMonthYear;

      const dateString = `${tripDate.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}, ${tripDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`;
      
      const driverInfo = trip.driver ? `${trip.driver.firstName} ${trip.driver.lastName}` : 'Oczekuje...';
      const vehicleInfo = trip.vehicle ? trip.vehicle.registration : '-';
      
      const statusColor = trip.status === 'oczekujący' ? '#f39c12' 
                        : trip.status === 'w toku' ? '#3498db' 
                        : trip.status === 'zakończony' ? '#27ae60' 
                        : '#666';

      const statusText = trip.status === 'oczekujący' ? 'Szukanie' 
                       : trip.status === 'w toku' ? 'W trakcie' 
                       : trip.status === 'zakończony' ? 'Zakończony' 
                       : trip.status;

      return (
        <View key={trip.id}>
          {isNewMonth && selectedMonth === 'Wszystkie' && <Text style={styles.monthHeader}>{formattedMonthYear}</Text>}
          
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.dateText}>{dateString}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
              </View>
            </View>

            <View style={styles.routeContainer}>
              <View style={styles.routeRow}>
                <Ionicons name="location" size={16} color="#0a1d56" style={styles.routeIcon} />
                <Text style={styles.routeText} numberOfLines={1}><Text style={{fontWeight: 'bold'}}>Od: </Text>{trip.pickupAddress}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routeRow}>
                <Ionicons name="flag" size={16} color="#dc3545" style={styles.routeIcon} />
                <Text style={styles.routeText} numberOfLines={1}><Text style={{fontWeight: 'bold'}}>Do: </Text>{trip.dropoffAddress}</Text>
              </View>
            </View>

            <View style={[styles.cardFooter, { justifyContent: 'space-between' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons name="person-circle-outline" size={18} color="#666" />
                <Text style={styles.driverText} numberOfLines={1}>
                  Kierowca: {driverInfo} <Text style={{fontWeight: 'bold'}}>({vehicleInfo})</Text>
                </Text>
              </View>
              
              {/* Sekcja dystansu (wyświetli się tylko jeśli dystans istnieje w bazie) */}
              {trip.distanceKm && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}>
                  <Ionicons name="swap-horizontal-outline" size={16} color="#666" />
                  <Text style={{ marginLeft: 4, fontSize: 13, color: '#555', fontWeight: 'bold' }}>
                    {Number(trip.distanceKm).toFixed(1).replace('.', ',')} km
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TextLogo />
        <View style={styles.headerButtons}>
          <Text style={{ color: 'white', marginRight: 15, fontWeight: 'bold' }}>Witaj, {firstName}!</Text>
          <Pressable onPress={toggleMenu} style={styles.menuButton}>
            <Ionicons name="menu" size={28} color="white" />
          </Pressable>
        </View>
      </View>

      {/* ZAWARTOŚĆ GŁÓWNA */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Historia przejazdów</Text>
      </View>

      {/* PASEK FILTRÓW */}
      {!loading && trips.length > 0 && (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {/* Przycisk Sortowania */}
            <Pressable 
              style={[styles.filterPill, sortOrder === 'asc' ? styles.filterPillActive : null]}
              onPress={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            >
              <Ionicons name={sortOrder === 'desc' ? 'arrow-down' : 'arrow-up'} size={16} color={sortOrder === 'asc' ? 'white' : '#0a1d56'} style={{marginRight: 4}} />
              <Text style={[styles.filterPillText, sortOrder === 'asc' ? styles.filterPillTextActive : null]}>
                {sortOrder === 'desc' ? 'Najnowsze' : 'Najstarsze'}
              </Text>
            </Pressable>

            {/* Przyciski Miesięcy */}
            {availableMonths.map((month) => (
              <Pressable 
                key={month} 
                style={[styles.filterPill, selectedMonth === month ? styles.filterPillActive : null]}
                onPress={() => setSelectedMonth(month)}
              >
                <Text style={[styles.filterPillText, selectedMonth === month ? styles.filterPillTextActive : null]}>
                  {month}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#0a1d56" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView 
          bounces={true} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0a1d56']} />
          }
        >
          {renderHistory()}
        </ScrollView>
      )}

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
          style={[styles.menuItem, { paddingLeft: 20, marginLeft: -20, marginRight: -20 }]} 
          onPress={() => { closeMenu(); navigation.navigate('ZamowieniePracownik'); }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="car-sport-outline" size={22} color="#555" style={{ marginRight: 12 }} />
            <Text style={styles.menuItemText}>Zamów TAXI</Text>
          </View>
        </Pressable>

        <Pressable 
          style={[styles.menuItem, { backgroundColor: '#f8f9fa', borderLeftWidth: 4, borderLeftColor: '#0a1d56', paddingLeft: 16, marginLeft: -20, marginRight: -20 }]} 
          onPress={closeMenu}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="time" size={22} color="#0a1d56" style={{ marginRight: 12 }} />
            <Text style={[styles.menuItemText, { fontWeight: 'bold', color: '#0a1d56' }]}>Historia przejazdów</Text>
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
  
  titleContainer: { backgroundColor: '#f4f6f9', paddingBottom: 10 },
  title: { fontSize: 26, fontWeight: '900', color: '#0a1d56', fontStyle: 'italic', textAlign: 'center', marginTop: 25 },
  
  // Filtry i Sortowanie
  filterContainer: { height: 50, backgroundColor: '#f4f6f9', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', marginBottom: 10 },
  filterScroll: { paddingHorizontal: 15, alignItems: 'center' },
  filterPill: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
    paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, 
    marginRight: 10, borderWidth: 1, borderColor: '#ddd' 
  },
  filterPillActive: { backgroundColor: '#0a1d56', borderColor: '#0a1d56' },
  filterPillText: { fontSize: 13, fontWeight: 'bold', color: '#0a1d56' },
  filterPillTextActive: { color: '#fff' },

  scrollContent: { paddingBottom: 40, paddingHorizontal: 15 },
  
  // Menu Boczne
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

  // List Items
  monthHeader: { fontSize: 18, fontWeight: 'bold', color: '#0a1d56', marginTop: 15, marginBottom: 10, marginLeft: 5 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
    borderLeftWidth: 4, borderLeftColor: '#0a1d56',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f0f2f5', paddingBottom: 10 },
  dateText: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  routeContainer: { marginBottom: 15 },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  routeIcon: { marginRight: 8, width: 16, textAlign: 'center' },
  routeText: { fontSize: 14, color: '#444', flex: 1 },
  routeLine: { height: 12, borderLeftWidth: 1, borderLeftColor: '#ccc', borderStyle: 'dashed', marginLeft: 8, marginVertical: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 10, borderRadius: 8 },
  driverText: { marginLeft: 6, fontSize: 13, color: '#555' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { marginTop: 10, color: '#666', fontSize: 16 }
});