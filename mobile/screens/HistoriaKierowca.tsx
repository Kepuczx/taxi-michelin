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

// Interfejs kursu z bazy danych
interface Trip {
  id: number;
  createdAt: string; 
  pickupAddress: string;
  dropoffAddress: string;
  status: string;
  vehicle?: string;
  // Współrzędne do obliczania dystansów
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  driverStartLat: number; // ⚠️ Wymaga dodania do backendu (miejsce akceptacji kursu)
  driverStartLng: number; // ⚠️ Wymaga dodania do backendu
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

// Funkcja formatująca metry na kilometry (np. 1.2 km)
const formatDistance = (meters: number) => {
  return (meters / 1000).toFixed(1) + ' km';
};

// =========================================================================
// 🛑 MOCK DATA (Zaktualizowany o współrzędne Olsztyna do symulacji)
// =========================================================================
const MOCK_TRIPS: Trip[] = [
  { id: 1, createdAt: '2026-02-25T10:34:00Z', vehicle: 'NO 12345', pickupAddress: 'Dworzec Główny', dropoffAddress: 'Galeria Warmińska', status: 'zakończony', driverStartLat: 53.7784, driverStartLng: 20.4801, pickupLat: 53.7820, pickupLng: 20.4950, dropoffLat: 53.7550, dropoffLng: 20.4610 },
  { id: 2, createdAt: '2026-02-14T14:21:00Z', vehicle: 'NO 12345', pickupAddress: 'Stare Miasto', dropoffAddress: 'Kortowo', status: 'zakończony', driverStartLat: 53.7850, driverStartLng: 20.4700, pickupLat: 53.7770, pickupLng: 20.4770, dropoffLat: 53.7480, dropoffLng: 20.4500 },
  { id: 3, createdAt: '2026-01-28T12:49:00Z', vehicle: 'NO 98765', pickupAddress: 'Jaroty', dropoffAddress: 'Zatorze', status: 'zakończony', driverStartLat: 53.7500, driverStartLng: 20.4900, pickupLat: 53.7400, pickupLng: 20.5000, dropoffLat: 53.7900, dropoffLng: 20.4900 },
];

export default function HistoriaKierowca({ navigation }: any) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [firstName, setFirstName] = useState<string>('Kierowca');
  
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const extractMonths = (data: Trip[]) => {
    const months = new Set<string>();
    data.forEach((trip) => {
      const date = new Date(trip.createdAt);
      const rawMonth = date.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
      months.add(rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1));
    });
    setAvailableMonths(['Wszystkie', ...Array.from(months)]);
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const driverId = await AsyncStorage.getItem('userId');

      if (!token || !driverId) return;

      setTimeout(() => {
        setTrips(MOCK_TRIPS);
        extractMonths(MOCK_TRIPS);
        setLoading(false);
        setRefreshing(false);
      }, 500);

    } catch (error) {
      console.error('Błąd pobierania historii:', error);
      Alert.alert('Błąd', 'Nie udało się pobrać historii przejazdów.');
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

  const renderHistory = () => {
    let displayedTrips = [...trips];
    
    if (selectedMonth !== 'Wszystkie') {
      displayedTrips = displayedTrips.filter(trip => {
        const date = new Date(trip.createdAt);
        const rawMonth = date.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
        return (rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1)) === selectedMonth;
      });
    }

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
      const statusColor = trip.status === 'zakończony' ? '#27ae60' : '#e74c3c';
      const statusText = trip.status === 'zakończony' ? 'Zakończony' : 'Anulowany';

      // --- OBLICZANIE DYSTANSÓW ---
      const distToPickupMeters = getDistance(trip.driverStartLat, trip.driverStartLng, trip.pickupLat, trip.pickupLng);
      const distTripMeters = getDistance(trip.pickupLat, trip.pickupLng, trip.dropoffLat, trip.dropoffLng);
      const totalDistMeters = distToPickupMeters + distTripMeters;

      return (
        <View key={trip.id}>
          {isNewMonth && selectedMonth === 'Wszystkie' && <Text style={styles.monthHeader}>{formattedMonthYear}</Text>}
          
          {/* KARTA NA CAŁĄ SZEROKOŚĆ EKRANU */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.dateText}>{dateString}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
              </View>
            </View>

            <View style={styles.routeContainer}>
              {/* LEWA STRONA: Grafika trasy */}
              <View style={styles.graphicColumn}>
                <View style={styles.iconCircleBlue}><Ionicons name="car-outline" size={14} color="white" /></View>
                <View style={styles.dashedLine} />
                <View style={styles.iconCircleGreen}><Ionicons name="person-outline" size={14} color="white" /></View>
                <View style={styles.dashedLine} />
                <View style={styles.iconCircleRed}><Ionicons name="flag-outline" size={14} color="white" /></View>
              </View>

              {/* PRAWA STRONA: Informacje i Dystanse */}
              <View style={styles.infoColumn}>
                
                {/* 1. Start Kierowcy */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoTitle}>Dojazd do klienta</Text>
                  <Text style={styles.distanceText}>{formatDistance(distToPickupMeters)}</Text>
                </View>
                
                <View style={styles.spacer} />

                {/* 2. Odbiór Klienta */}
                <View style={styles.infoRow}>
                  <View style={{flex: 1}}>
                    <Text style={styles.infoTitle}>Kurs z klientem</Text>
                    <Text style={styles.addressText} numberOfLines={1}>{trip.pickupAddress}</Text>
                  </View>
                  <Text style={styles.distanceText}>{formatDistance(distTripMeters)}</Text>
                </View>

                <View style={styles.spacer} />

                {/* 3. Zakończenie (Cel) */}
                <View style={styles.infoRow}>
                  <View style={{flex: 1}}>
                    <Text style={styles.infoTitle}>Miejsce docelowe</Text>
                    <Text style={styles.addressText} numberOfLines={1}>{trip.dropoffAddress}</Text>
                  </View>
                </View>

              </View>
            </View>

            {/* PODSUMOWANIE NA DOLE KARTY */}
            <View style={styles.cardFooter}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="car-sport" size={18} color="#666" />
                <Text style={styles.driverText}>Pojazd: <Text style={{fontWeight: 'bold'}}>{trip.vehicle || '-'}</Text></Text>
              </View>
              <Text style={styles.totalDistanceText}>Suma: <Text style={{fontWeight: '900', color: '#0a1d56'}}>{formatDistance(totalDistMeters)}</Text></Text>
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

      {/* MENU BOCZNE */}
      {isMenuOpen && <Pressable style={[styles.overlay, {zIndex: 99, elevation: 99}]} onPress={closeMenu} />}
      <View style={[styles.sideMenu, isMenuOpen && styles.sideMenuOpen, {zIndex: 100, elevation: 100}]}>
        <Pressable style={styles.closeMenuBtn} onPress={closeMenu}>
          <Ionicons name="close" size={28} color="#333" />
        </Pressable>
        <View style={styles.menuHeader}>
          <Text style={styles.menuHeaderText}>👤 Profil Kierowcy</Text>
        </View>

        <Pressable 
          style={styles.menuItem} 
          onPress={() => { 
            closeMenu(); 
            navigation.navigate('MainKierowca'); 
          }}
        >
          <Text style={styles.menuItemText}>Zlecenia</Text>
        </Pressable>
        
        <Pressable style={styles.menuItem} onPress={() => { console.log('Przycisk pauzy wciśnięty - w budowie'); closeMenu(); }}>
          <Text style={styles.menuItemText}>Pauza (Przerwa)</Text>
        </Pressable>

        <View style={styles.menuBottom}>
          <Pressable style={[styles.menuItem, { backgroundColor: '#f4f6f9' }]} onPress={closeMenu}>
            <Text style={[styles.menuItemText, { fontWeight: 'bold', color: '#0a1d56' }]}>Historia kursów</Text>
          </Pressable>
          <Pressable style={styles.menuItem} onPress={handleLogout}>
            <Text style={styles.logoutText}>Wyloguj się</Text>
          </Pressable>
        </View>
      </View>

      {/* ZAWARTOŚĆ GŁÓWNA */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Historia kursów</Text>
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

  scrollContent: { paddingBottom: 40, paddingHorizontal: 0 }, // Usunięty margines, by karta była na całą szerokość
  
  // Menu Boczne
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  sideMenu: {
    position: 'absolute', top: 0, right: '-100%', bottom: 0, width: 280,
    backgroundColor: '#fff', paddingTop: 60, paddingHorizontal: 20,
    shadowColor: '#000', shadowOffset: { width: -2, height: 0 }, shadowOpacity: 0.2, shadowRadius: 5,
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
  monthHeader: { fontSize: 18, fontWeight: 'bold', color: '#0a1d56', marginTop: 15, marginBottom: 10, marginLeft: 15 },
  card: {
    backgroundColor: '#fff', 
    marginBottom: 12,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#e0e0e0',
    padding: 15,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f0f2f5', paddingBottom: 10 },
  dateText: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  
  // Layout dla trasy (Lewa i Prawa Kolumna)
  routeContainer: { flexDirection: 'row', marginBottom: 15 },
  
  // Grafika Osi
  graphicColumn: { width: 40, alignItems: 'center', marginRight: 10, paddingTop: 5 },
  iconCircleBlue: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#0a1d56', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  iconCircleGreen: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#27ae60', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  iconCircleRed: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#dc3545', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  dashedLine: { height: 25, width: 2, borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed', marginVertical: -2, zIndex: 1 },

  // Informacje tekstowe
  infoColumn: { flex: 1, justifyContent: 'space-between' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoTitle: { fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 },
  addressText: { fontSize: 15, color: '#000', fontWeight: '500', marginTop: 2 },
  distanceText: { fontSize: 15, fontWeight: 'bold', color: '#0a1d56', backgroundColor: '#f0f4f8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
  spacer: { height: 18 }, // Odstępy między etapami

  // Footer Karty
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 12, borderRadius: 8, marginTop: 5 },
  driverText: { marginLeft: 6, fontSize: 13, color: '#555' },
  totalDistanceText: { fontSize: 14, color: '#333' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { marginTop: 10, color: '#666', fontSize: 16 }
});